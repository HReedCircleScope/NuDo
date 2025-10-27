import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UA_2025_WINDOWS } from '@nudo/shared';

// Milestone tier configuration
const TIER_CONFIG = {
  I: { minMinutes: 0, maxMinutes: 1800, milestoneInterval: 120 }, // 0-30h, every 2h
  II: { minMinutes: 1800, maxMinutes: 4200, milestoneInterval: 240 }, // 30-70h, every 4h
  III: { minMinutes: 4200, maxMinutes: 7800, milestoneInterval: 360 }, // 70-130h, every 6h
  IV: { minMinutes: 7800, maxMinutes: 12000, milestoneInterval: 480 }, // 130-200h, every 8h
} as const;

type TierName = 'I' | 'II' | 'III' | 'IV';

interface AcademicWindow {
  start: string;
  end: string;
}

interface MilestoneInfo {
  currentTier: TierName;
  tierStartMinutes: number;
  nextTierMinutes: number | null;
  currentMilestone: number;
  nextMilestoneMinutes: number;
  progressInTier: number;
  milestonesInTier: number;
  milestoneIndexInTier: number;
}

@Controller('season')
export class TrophyRoadController {
  constructor(
    @InjectModel('Session') private readonly sessions: Model<any>,
    @InjectModel('Zone') private readonly zones: Model<any>,
  ) {}

  /**
   * GET /season/progress?userId=X
   * Returns user's year-to-date progress within current academic window
   */
  @Get('progress')
  async getProgress(@Query('userId') userId?: string) {
    if (!userId) {
      return { error: 'userId_required' };
    }

    // Determine current academic window
    const academicWindow = this.getCurrentAcademicWindow();

    if (!academicWindow) {
      // Not currently in an academic window
      return {
        userId,
        academicWindow: null,
        totalMinutes: 0,
        totalHours: 0,
        currentTier: 'I',
        tierStartMinutes: 0,
        nextTierMinutes: 1800,
        currentMilestone: 0,
        nextMilestoneMinutes: 120,
        progressInTier: 0,
        milestonesInTier: 15,
        milestoneIndexInTier: 0,
      };
    }

    // Query all completed sessions for this user within the academic window
    const windowStart = new Date(academicWindow.start);
    const windowEnd = new Date(academicWindow.end);
    windowEnd.setHours(23, 59, 59, 999); // End of day

    const completedSessions = await this.sessions
      .find({
        userId,
        endAt: { $ne: null, $gte: windowStart, $lte: windowEnd },
      })
      .lean();

    // Sum all verified minutes
    const totalMinutes = completedSessions.reduce(
      (sum, session) => sum + (session.durationMin || 0),
      0
    );

    // Calculate milestone info
    const milestoneInfo = this.calculateMilestone(totalMinutes);

    return {
      userId,
      academicWindow: {
        start: academicWindow.start,
        end: academicWindow.end,
      },
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60 * 10) / 10, // One decimal place
      currentTier: milestoneInfo.currentTier,
      tierStartMinutes: milestoneInfo.tierStartMinutes,
      nextTierMinutes: milestoneInfo.nextTierMinutes,
      currentMilestone: milestoneInfo.currentMilestone,
      nextMilestoneMinutes: milestoneInfo.nextMilestoneMinutes,
      progressInTier: milestoneInfo.progressInTier,
      milestonesInTier: milestoneInfo.milestonesInTier,
      milestoneIndexInTier: milestoneInfo.milestoneIndexInTier,
    };
  }

  /**
   * GET /season/occupancy
   * Returns current occupancy data for all active zones
   * (Active sessions per zone, useful for showing which zones are busy)
   */
  @Get('occupancy')
  async getOccupancy() {
    // Find all active zones
    const activeZones = await this.zones.find({ isActive: true }).lean();

    // Find all currently active sessions (endAt is null)
    const activeSessions = await this.sessions
      .find({ endAt: null })
      .lean();

    // Count sessions per zone
    const occupancyMap = new Map<string, number>();

    for (const session of activeSessions) {
      const zoneId = session.zoneId;
      occupancyMap.set(zoneId, (occupancyMap.get(zoneId) || 0) + 1);
    }

    // Build response with zone details and occupancy count
    const occupancyData = activeZones.map((zone) => {
      const zoneId = String(zone._id);
      return {
        zoneId,
        zoneName: zone.name,
        activeUsers: occupancyMap.get(zoneId) || 0,
        isActive: zone.isActive,
      };
    });

    return {
      timestamp: new Date().toISOString(),
      zones: occupancyData,
      totalActiveSessions: activeSessions.length,
    };
  }

  /**
   * Determines which academic window the current date falls within.
   * Returns null if not currently in an academic window.
   */
  private getCurrentAcademicWindow(): AcademicWindow | null {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    for (const [start, end] of UA_2025_WINDOWS) {
      if (todayStr >= start && todayStr <= end) {
        return { start, end };
      }
    }

    return null;
  }

  /**
   * Calculates which tier and milestone the user is at based on total minutes.
   *
   * Tier progression:
   * - Tier I: 0-1800 min (0-30h), milestones every 120 min = 15 milestones total
   * - Tier II: 1800-4200 min (30-70h), milestones every 240 min = 10 milestones total
   * - Tier III: 4200-7800 min (70-130h), milestones every 360 min = 10 milestones total
   * - Tier IV: 7800-12000 min (130-200h), milestones every 480 min = 8 complete + partial
   *
   * Example calculation for 2400 minutes (40h):
   * - Tier I ends at 1800 min with 15 milestones
   * - User is in Tier II (1800-4200 min range)
   * - Progress in Tier II: 2400 - 1800 = 600 min
   * - Milestones completed in Tier II: floor(600 / 240) = 2
   * - Current milestone index: 15 (from Tier I) + 2 = 17
   * - Next milestone at: 1800 + (3 * 240) = 2640 min
   */
  private calculateMilestone(totalMinutes: number): MilestoneInfo {
    // Cap at maximum
    const cappedMinutes = Math.min(totalMinutes, TIER_CONFIG.IV.maxMinutes);

    let currentTier: TierName;
    let tierConfig: typeof TIER_CONFIG.I | typeof TIER_CONFIG.II | typeof TIER_CONFIG.III | typeof TIER_CONFIG.IV;
    let milestonesPriorToTier: number;

    // Determine which tier the user is in
    if (cappedMinutes < TIER_CONFIG.II.minMinutes) {
      currentTier = 'I';
      tierConfig = TIER_CONFIG.I;
      milestonesPriorToTier = 0;
    } else if (cappedMinutes < TIER_CONFIG.III.minMinutes) {
      currentTier = 'II';
      tierConfig = TIER_CONFIG.II;
      // Tier I has 15 milestones (1800 / 120)
      milestonesPriorToTier = 15;
    } else if (cappedMinutes < TIER_CONFIG.IV.minMinutes) {
      currentTier = 'III';
      tierConfig = TIER_CONFIG.III;
      // Tier I has 15, Tier II has 10 (2400 / 240)
      milestonesPriorToTier = 15 + 10;
    } else {
      currentTier = 'IV';
      tierConfig = TIER_CONFIG.IV;
      // Tier I has 15, Tier II has 10, Tier III has 10 (3600 / 360)
      milestonesPriorToTier = 15 + 10 + 10;
    }

    // Calculate progress within current tier
    const progressInTier = cappedMinutes - tierConfig.minMinutes;
    const milestonesCompletedInTier = Math.floor(
      progressInTier / tierConfig.milestoneInterval
    );
    const currentMilestone = milestonesPriorToTier + milestonesCompletedInTier;

    // Calculate next milestone minutes
    const nextMilestoneMinutes =
      tierConfig.minMinutes +
      (milestonesCompletedInTier + 1) * tierConfig.milestoneInterval;

    // Calculate total milestones in this tier
    const tierRange = tierConfig.maxMinutes - tierConfig.minMinutes;
    const milestonesInTier = Math.floor(tierRange / tierConfig.milestoneInterval);

    // Determine next tier threshold (null if at max tier)
    const nextTierMinutes = currentTier === 'IV' ? null : tierConfig.maxMinutes;

    return {
      currentTier,
      tierStartMinutes: tierConfig.minMinutes,
      nextTierMinutes,
      currentMilestone,
      nextMilestoneMinutes: Math.min(nextMilestoneMinutes, TIER_CONFIG.IV.maxMinutes),
      progressInTier,
      milestonesInTier,
      milestoneIndexInTier: milestonesCompletedInTier,
    };
  }
}
