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

@Controller()
export class AppController {
  constructor(
    @InjectModel('Zone') private readonly zones: Model<any>,
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

  /** Create a zone (no auth yet; V1 dev-only) */
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
}