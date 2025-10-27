import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { phoenixWeekStartISODate } from './time';

@Controller()
export class LeaderboardController {
  constructor(
    @InjectModel('WeeklyStat') private readonly weeklyStats: Model<any>,
  ) {}

  /** Leaderboard: top 50 by minutes for a given week (default: current AZ week) */
  @Get('leaderboard')
  async getLeaderboard(@Query('week') week?: string) {
    const weekStartISO =
      week && /^\d{4}-\d{2}-\d{2}$/.test(week)
        ? week
        : phoenixWeekStartISODate(new Date(), 1); // Monday start; use 0 for Sunday

    const rows = await this.weeklyStats
      .find({ weekStartISO })
      .select({ _id: 0, userId: 1, minutes: 1, points: 1, tier: 1 })
      .sort({ minutes: -1, userId: 1 })
      .limit(50)
      .lean();

    return { weekStart: weekStartISO, entries: rows };
  }
}