import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { phoenixWeekStartISODate } from './time';

@Controller()
export class LeaderboardController {
  constructor(
    @InjectModel('WeeklyStat') private readonly weeklyStats: Model<any>,
    @InjectModel('User') private readonly users: Model<any>,
  ) {}

  /**
   * Leaderboard: top 50 users for a given week with tie-breaker sorting
   * @param week - Week start date in YYYY-MM-DD format (defaults to current Phoenix week)
   * @param scope - Filter by user role: "overall" (all), "pledge", or "member" (defaults to "overall")
   */
  @Get('leaderboard')
  async getLeaderboard(
    @Query('week') week?: string,
    @Query('scope') scope?: string,
  ) {
    const weekStartISO =
      week && /^\d{4}-\d{2}-\d{2}$/.test(week)
        ? week
        : phoenixWeekStartISODate(new Date(), 1); // Monday start

    const scopeValue = scope || 'overall';

    // Build aggregation pipeline to join WeeklyStat and User collections
    const pipeline: any[] = [
      // Match WeeklyStat entries for the specified week
      { $match: { weekStartISO } },

      // Join with User collection to get displayName and role
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },

      // Unwind the user array (should be single element)
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },

      // Filter by role if scope is "pledge" or "member"
      ...(scopeValue !== 'overall'
        ? [{ $match: { 'user.role': scopeValue } }]
        : []),

      // Add tierPriority field for tie-breaker sorting
      // Tier priority mapping: platinum=5, gold=4, silver=3, bronze=2, base=1
      {
        $addFields: {
          tierPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$tier', 'platinum'] }, then: 5 },
                { case: { $eq: ['$tier', 'gold'] }, then: 4 },
                { case: { $eq: ['$tier', 'silver'] }, then: 3 },
                { case: { $eq: ['$tier', 'bronze'] }, then: 2 },
              ],
              default: 1, // base
            },
          },
        },
      },

      // Sort with tie-breaker logic (in order of priority):
      // 1. points (descending) - primary ranking criterion
      // 2. tierPriority (descending) - if points are equal, higher tier wins
      // 3. computedAt (ascending) - if still tied, earliest timestamp wins
      {
        $sort: {
          points: -1,
          tierPriority: -1,
          computedAt: 1,
        },
      },

      // Limit to top 50 entries
      { $limit: 50 },

      // Project the desired fields for the response
      {
        $project: {
          _id: 0,
          userId: 1,
          displayName: '$user.displayName',
          role: '$user.role',
          points: 1,
          tier: 1,
          minutes: 1,
          computedAt: 1,
        },
      },
    ];

    const results = await this.weeklyStats.aggregate(pipeline).exec();

    // Calculate rank numbers (entries with same points get the same rank)
    let currentRank = 1;
    const entries = results.map((entry, index) => {
      // If points differ from previous entry, update rank to current position
      if (index > 0 && results[index - 1].points !== entry.points) {
        currentRank = index + 1;
      }

      // Remove internal fields from response
      const { computedAt, ...rest } = entry;
      return { rank: currentRank, ...rest };
    });

    return {
      weekStart: weekStartISO,
      scope: scopeValue,
      entries,
    };
  }
}