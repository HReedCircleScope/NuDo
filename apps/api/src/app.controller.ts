import { Controller, Get, Post, Patch, Body, Query } from '@nestjs/common';
import {
  TIMEZONE,
  WEEKLY_GOAL_HOURS,
  WEEKLY_CAP_MIN,
  UA_2025_WINDOWS,
} from '@nudo/shared';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { phoenixWeekStartISODate } from './time';

type ZoneBody = {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  isActive?: boolean;
};

type UpdateZoneBody = {
  id: string;
  name?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  isActive?: boolean;
};

type StartBody = { userId: string; zoneId: string };
type StopBody = { sessionId: string };

@Controller()
export class AppController {
  constructor(
    @InjectModel('Zone') private readonly zones: Model<any>,
    @InjectModel('Session') private readonly sessions: Model<any>,
    @InjectModel('WeeklyStat') private readonly weeklyStats: Model<any>,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('config')
  getConfig() {
    return {
      timezone: TIMEZONE,
      weeklyGoalHours: WEEKLY_GOAL_HOURS,
      weeklyCapMinutes: WEEKLY_CAP_MIN,
      academicWindows2025: UA_2025_WINDOWS,
    };
  }

  // --- ZONES ---

  /** List active zones */
  @Get('zones')
  async listZones() {
    return this.zones.find({ isActive: true }).lean();
  }

  /** Create a zone (dev-only, no auth yet) */
  @Post('zones')
  async createZone(@Body() b: ZoneBody) {
    if (
      !b ||
      typeof b.name !== 'string' ||
      typeof b.lat !== 'number' ||
      typeof b.lng !== 'number' ||
      typeof b.radiusMeters !== 'number'
    ) {
      return { error: 'invalid_zone_body' };
    }
    const doc = await this.zones.create({
      name: b.name,
      lat: b.lat,
      lng: b.lng,
      radiusMeters: b.radiusMeters,
      isActive: b.isActive ?? true,
    });
    return { id: doc._id.toString() };
  }

  /** Update a zone (dev-only) */
  @Patch('zones')
  async updateZone(@Body() b: UpdateZoneBody) {
    if (!b || typeof b.id !== 'string') return { error: 'id_required' };
    const update: any = {};
    if (b.name !== undefined) update.name = b.name;
    if (b.lat !== undefined) update.lat = b.lat;
    if (b.lng !== undefined) update.lng = b.lng;
    if (b.radiusMeters !== undefined) update.radiusMeters = b.radiusMeters;
    if (b.isActive !== undefined) update.isActive = b.isActive;

    const doc = await this.zones.findByIdAndUpdate(b.id, update, { new: true });
    if (!doc) return { error: 'zone_not_found' };
    return { id: doc._id.toString(), updated: true };
  }

  // --- SESSIONS ---

  /** Start a session (manual start) */
  @Post('sessions/start')
  async startSession(@Body() b: StartBody) {
    if (!b?.userId || !b?.zoneId) return { error: 'missing_fields' };

    const zone = await this.zones.findById(b.zoneId);
    if (!zone) return { error: 'zone_not_found' };

    const startAt = new Date();
    const doc = await this.sessions.create({
      userId: b.userId,
      zoneId: zone._id.toString(),
      startAt,
      source: 'manual',
      createdAt: new Date(),
    });

    return { sessionId: doc._id.toString(), startAt };
  }

  /** Stop a session (computes duration + upserts weekly minutes, but never 500s UI) */
  @Post('sessions/stop')
  async stopSession(@Body() b: StopBody) {
    if (!b?.sessionId) return { error: 'missing_sessionId' };

    const s = await this.sessions.findById(b.sessionId);
    if (!s) return { error: 'session_not_found' };

    // If already stopped, return existing values (idempotent)
    if (s.endAt) {
      return { durationMin: s.durationMin, stoppedAlready: true, endAt: s.endAt };
    }

    // Finalize session
    s.endAt = new Date();
    s.durationMin = Math.max(0, Math.round((+s.endAt - +s.startAt) / 60000));
    await s.save();

  // --- Compute week key using America/Phoenix ---
const weekStartISO = phoenixWeekStartISODate(s.endAt, 1 /* Monday start; use 0 for Sunday */);

let minutesForWeek = 0;
try {
  const inc = s.durationMin ?? 0;
  const updated = await this.weeklyStats.findOneAndUpdate(
    { userId: s.userId, weekStartISO },
    {
      $inc: { minutes: inc },
      $setOnInsert: { points: 0, tier: 'base' },
      $set: { computedAt: new Date() },
    },
    { upsert: true, new: true }
  ).lean();
minutesForWeek = (updated as any)?.minutes ?? 0;
} catch (e: any) {
  console.error('[weeklyStats upsert failed]', {
    userId: s.userId,
    weekStartISO,
    err: e?.message || e,
  });
}

return {
  durationMin: s.durationMin,
  endAt: s.endAt,
  minutes: minutesForWeek,
  weekStart: weekStartISO,
};
  }

// --- WEEKLY STATS ---

  /** Get the current week's stats for a user (America/Phoenix week) */
  @Get('stats/weekly')
  async getWeekly(@Query('userId') userId?: string) {
    if (!userId) return { error: 'userId_required' };

    // Use the same Phoenix week key we used in /sessions/stop
    const weekStartISO = phoenixWeekStartISODate(new Date(), 1); // 1 = Monday (use 0 for Sunday)

    const doc = await this.weeklyStats.findOne({ userId, weekStartISO }).lean();

    // Return the fields the mobile app expects
    return {
  userId,
  minutes: (doc as any)?.minutes ?? 0,
  weekStart: weekStartISO,
};
  }
}