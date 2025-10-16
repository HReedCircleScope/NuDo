import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  TIMEZONE,
  WEEKLY_GOAL_HOURS,
  WEEKLY_CAP_MIN,
  UA_2025_WINDOWS,
} from '@nudo/shared';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

type ZoneBody = {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  isActive?: boolean;
};

type StartBody = { userId: string; zoneId: string };
type StopBody = { sessionId: string };

@Controller()
export class AppController {
  constructor(
    @InjectModel('Zone') private readonly zones: Model<any>,
    @InjectModel('Session') private readonly sessions: Model<any>,
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
    const doc = await this.zones.create({
      name: b.name,
      lat: b.lat,
      lng: b.lng,
      radiusMeters: b.radiusMeters,
      isActive: b.isActive ?? true,
    });
    return { id: doc._id.toString() };
  }

  // --- SESSIONS ---

  /** Start a session (manual start) */
  @Post('sessions/start')
  async startSession(@Body() b: StartBody) {
    const zone = await this.zones.findById(b.zoneId);
    if (!zone) return { error: 'zone_not_found' };

    const startAt = new Date();
    const doc = await this.sessions.create({
      userId: b.userId,
      zoneId: zone._id.toString(),
      startAt,
      source: 'manual',
    });

    return { sessionId: doc._id.toString(), startAt };
  }

  /** Stop a session (computes duration) */
  @Post('sessions/stop')
  async stopSession(@Body() b: StopBody) {
    const s = await this.sessions.findById(b.sessionId);
    if (!s) return { error: 'session_not_found' };
    if (s.endAt) {
      return { durationMin: s.durationMin, stoppedAlready: true, endAt: s.endAt };
    }
    s.endAt = new Date();
    s.durationMin = Math.max(0, Math.round((+s.endAt - +s.startAt) / 60000));
    await s.save();
    return { durationMin: s.durationMin, endAt: s.endAt };
  }
}