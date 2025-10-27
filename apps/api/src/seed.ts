import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { phoenixWeekStartISODate } from './time';
import { weeklyTotalPoints } from '@nudo/shared';
import { subWeeks, addHours, addMinutes, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Phoenix';

// User configuration (MongoDB will auto-generate _id values)
const PLEDGES = [
  { displayName: 'Alex Chen', email: 'alex.chen@example.com', role: 'pledge' },
  { displayName: 'Jordan Smith', email: 'jordan.smith@example.com', role: 'pledge' },
  { displayName: 'Sam Rivera', email: 'sam.rivera@example.com', role: 'pledge' },
  { displayName: 'Casey Johnson', email: 'casey.johnson@example.com', role: 'pledge' },
  { displayName: 'Taylor Brown', email: 'taylor.brown@example.com', role: 'pledge' },
];

const MEMBERS = [
  { displayName: 'Morgan Lee', email: 'morgan.lee@example.com', role: 'member' },
  { displayName: 'Riley Davis', email: 'riley.davis@example.com', role: 'member' },
  { displayName: 'Quinn Martinez', email: 'quinn.martinez@example.com', role: 'member' },
  { displayName: 'Avery Wilson', email: 'avery.wilson@example.com', role: 'member' },
  { displayName: 'Cameron Garcia', email: 'cameron.garcia@example.com', role: 'member' },
];

const AVATAR_KEYS = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5'];

// Zone configuration (MongoDB will auto-generate _id values)
const ZONES = [
  { name: 'Main Library', lat: 32.2319, lng: -110.9501, radiusMeters: 100, isActive: true },
  { name: 'Student Union', lat: 32.2298, lng: -110.9489, radiusMeters: 150, isActive: true },
  { name: 'Science Library', lat: 32.2335, lng: -110.9512, radiusMeters: 80, isActive: true },
  { name: 'Engineering Building', lat: 32.2342, lng: -110.9478, radiusMeters: 120, isActive: true },
];

// Performance levels (weekly minutes range)
type PerformanceLevel = 'low' | 'medium' | 'high';

interface PerformanceConfig {
  minMinutesPerWeek: number;
  maxMinutesPerWeek: number;
  minSessionDuration: number;
  maxSessionDuration: number;
  sessionsPerWeek: number;
}

const PERFORMANCE_CONFIGS: Record<PerformanceLevel, PerformanceConfig> = {
  low: { minMinutesPerWeek: 100, maxMinutesPerWeek: 200, minSessionDuration: 20, maxSessionDuration: 40, sessionsPerWeek: 7 },
  medium: { minMinutesPerWeek: 300, maxMinutesPerWeek: 400, minSessionDuration: 30, maxSessionDuration: 60, sessionsPerWeek: 10 },
  high: { minMinutesPerWeek: 500, maxMinutesPerWeek: 700, minSessionDuration: 45, maxSessionDuration: 90, sessionsPerWeek: 13 },
};

/**
 * Get a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random element from an array
 */
function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * Generate a random time between 8am and 10pm in Phoenix timezone
 */
function randomStudyTime(date: Date): Date {
  const phoenixDate = toZonedTime(date, TIMEZONE);
  const dayStart = startOfDay(phoenixDate);
  const hour = randomInt(8, 21); // 8am to 9pm (session can extend to 10pm)
  const minute = randomInt(0, 59);
  return addMinutes(addHours(dayStart, hour), minute);
}

/**
 * Assign performance level to users (mix of low, medium, high)
 */
function assignPerformanceLevels(userIds: string[]): Map<string, PerformanceLevel> {
  const levels = new Map<string, PerformanceLevel>();

  // Distribute performance levels across users
  // Roughly: 30% low, 40% medium, 30% high
  const lowCount = Math.ceil(userIds.length * 0.3);
  const mediumCount = Math.ceil(userIds.length * 0.4);

  const shuffled = [...userIds].sort(() => Math.random() - 0.5);

  shuffled.forEach((userId, index) => {
    if (index < lowCount) {
      levels.set(userId, 'low');
    } else if (index < lowCount + mediumCount) {
      levels.set(userId, 'medium');
    } else {
      levels.set(userId, 'high');
    }
  });

  return levels;
}

/**
 * Calculate tier based on points
 */
function calculateTier(points: number): string {
  if (points >= 201) return 'platinum';
  if (points >= 151) return 'gold';
  if (points >= 101) return 'silver';
  if (points >= 51) return 'bronze';
  return 'base';
}

async function seed() {
  console.log('Starting NuDo database seed...\n');

  // Create NestJS app context
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get models from the NestJS dependency injection container
  const UserModel = app.get<Model<any>>(getModelToken('User'));
  const ZoneModel = app.get<Model<any>>(getModelToken('Zone'));
  const SessionModel = app.get<Model<any>>(getModelToken('Session'));
  const WeeklyStatModel = app.get<Model<any>>(getModelToken('WeeklyStat'));

  try {
    // ==================== CLEAR EXISTING DATA ====================
    console.log('Clearing existing data...');
    await Promise.all([
      UserModel.deleteMany({}),
      ZoneModel.deleteMany({}),
      SessionModel.deleteMany({}),
      WeeklyStatModel.deleteMany({}),
    ]);
    console.log('✓ Cleared all collections\n');

    // ==================== CREATE ZONES ====================
    console.log('Creating zones...');
    const createdZones = await ZoneModel.insertMany(ZONES);
    console.log(`✓ Created ${createdZones.length} zones\n`);

    // ==================== CREATE USERS ====================
    console.log('Creating users...');

    const allUsers = [...PLEDGES, ...MEMBERS].map((user) => ({
      ...user,
      avatarKey: randomElement(AVATAR_KEYS),
      streakWeeks: randomInt(0, 3),
    }));

    const createdUsers = await UserModel.insertMany(allUsers);
    console.log(`✓ Created ${createdUsers.length} users (${PLEDGES.length} pledges, ${MEMBERS.length} members)\n`);

    // Build a map of userId -> streakWeeks for scoring later
    const userStreaks = new Map<string, number>();
    createdUsers.forEach((user) => {
      userStreaks.set(user._id.toString(), user.streakWeeks);
    });

    // ==================== CREATE SESSIONS ====================
    console.log('Creating study sessions for the past 4 weeks...');

    const allUserIds = createdUsers.map((u) => u._id.toString());
    const zoneIds = createdZones.map((z) => z._id.toString());
    const performanceLevels = assignPerformanceLevels(allUserIds);

    const sessions: any[] = [];
    const now = new Date();

    // Generate sessions for each of the past 4 weeks
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const weekDate = subWeeks(now, weekOffset);

      for (const userId of allUserIds) {
        const level = performanceLevels.get(userId)!;
        const config = PERFORMANCE_CONFIGS[level];

        // Determine target weekly minutes
        const targetMinutes = randomInt(config.minMinutesPerWeek, config.maxMinutesPerWeek);

        // Generate sessions for this week
        let accumulatedMinutes = 0;
        const numSessions = config.sessionsPerWeek;

        for (let sessionIdx = 0; sessionIdx < numSessions; sessionIdx++) {
          // Calculate remaining minutes to distribute
          const remainingSessions = numSessions - sessionIdx;
          const remainingMinutes = targetMinutes - accumulatedMinutes;

          // Calculate duration for this session
          let durationMin: number;
          if (sessionIdx === numSessions - 1) {
            // Last session: use remaining minutes (with some variance)
            durationMin = Math.max(config.minSessionDuration, remainingMinutes);
          } else {
            // Random duration within config bounds
            const avgRemaining = remainingMinutes / remainingSessions;
            const minDur = Math.max(config.minSessionDuration, avgRemaining - 10);
            const maxDur = Math.min(config.maxSessionDuration, avgRemaining + 10);
            durationMin = randomInt(Math.floor(minDur), Math.ceil(maxDur));
          }

          // Generate random day within the week (0-6, where 0 is the week start)
          const dayOffset = randomInt(0, 6);
          const sessionDate = new Date(weekDate);
          sessionDate.setDate(sessionDate.getDate() + dayOffset);

          const startAt = randomStudyTime(sessionDate);
          const endAt = addMinutes(startAt, durationMin);
          const zoneId = randomElement(zoneIds);

          sessions.push({
            userId,
            zoneId,
            startAt,
            endAt,
            durationMin,
            source: 'manual',
            createdAt: startAt, // Set createdAt to match session start
          });

          accumulatedMinutes += durationMin;
        }
      }
    }

    const createdSessions = await SessionModel.insertMany(sessions);
    console.log(`✓ Created ${createdSessions.length} study sessions\n`);

    // ==================== CALCULATE WEEKLY STATS ====================
    console.log('Calculating weekly stats...');

    // Group sessions by user and week
    const weeklyData = new Map<string, Map<string, number>>(); // userId -> (weekStartISO -> totalMinutes)

    for (const session of createdSessions) {
      const userId = session.userId;
      const weekStartISO = phoenixWeekStartISODate(session.startAt);

      if (!weeklyData.has(userId)) {
        weeklyData.set(userId, new Map());
      }

      const userWeeks = weeklyData.get(userId)!;
      const currentMinutes = userWeeks.get(weekStartISO) || 0;
      userWeeks.set(weekStartISO, currentMinutes + session.durationMin);
    }

    // Create WeeklyStat documents
    const weeklyStats: any[] = [];

    for (const [userId, weeks] of weeklyData.entries()) {
      const streakWeeks = userStreaks.get(userId) || 0;

      for (const [weekStartISO, minutes] of weeks.entries()) {
        const points = weeklyTotalPoints(minutes, streakWeeks);
        const tier = calculateTier(points);

        weeklyStats.push({
          userId,
          weekStartISO,
          minutes,
          points,
          tier,
          computedAt: new Date(),
        });
      }
    }

    const createdStats = await WeeklyStatModel.insertMany(weeklyStats);
    console.log(`✓ Created ${createdStats.length} weekly stat records\n`);

    // ==================== SUMMARY ====================
    console.log('═'.repeat(60));
    console.log('SEED SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Users:         ${createdUsers.length}`);
    console.log(`Zones:         ${createdZones.length}`);
    console.log(`Sessions:      ${createdSessions.length}`);
    console.log(`Weekly Stats:  ${createdStats.length}`);
    console.log('═'.repeat(60));

    // Show sample user data
    console.log('\nSample User Performance:');
    for (const userId of allUserIds.slice(0, 3)) {
      const user = createdUsers.find((u) => u._id.toString() === userId);
      const level = performanceLevels.get(userId);
      const userWeeks = weeklyData.get(userId);

      if (userWeeks) {
        const avgMinutes = Math.round(
          Array.from(userWeeks.values()).reduce((sum, min) => sum + min, 0) / userWeeks.size
        );
        console.log(`  ${user?.displayName} (${level}): ~${avgMinutes} min/week avg`);
      }
    }

    console.log('\n✓ Seed completed successfully!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await app.close();
    process.exit(0);
  }
}

// Run the seed function
seed().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
