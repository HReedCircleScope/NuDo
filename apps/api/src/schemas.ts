import { Schema } from 'mongoose';

/** users collection */
export const UserSchema = new Schema(
  {
    displayName: String,
    email: { type: String, unique: true },
    role: { type: String, enum: ['pledge', 'member', 'admin'], default: 'member' },
    deviceIdHash: { type: String, unique: true, sparse: true },
    avatarKey: String,
    streakWeeks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/** zones collection */
export const ZoneSchema = new Schema(
  {
    name: String,
    lat: Number,
    lng: Number,
    radiusMeters: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** sessions collection */
export const SessionSchema = new Schema({
  userId: String,
  zoneId: String,
  startAt: Date,
  endAt: Date,
  durationMin: Number,
  source: { type: String, default: 'manual' },
  createdAt: { type: Date, default: Date.now },
});

// helpful indexes for sessions
SessionSchema.index({ userId: 1, startAt: -1 });
SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 }); // ~400 days TTL

/** weeklyStats collection */
export const WeeklyStatSchema = new Schema({
  userId: String,
  weekStartISO: String, // e.g., "2025-10-13" (Monday in America/Phoenix)
  minutes: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  tier: { type: String, default: 'base' }, // optional label
  computedAt: { type: Date, default: Date.now },
});

// helpful indexes (unique per user per week)
WeeklyStatSchema.index({ userId: 1, weekStartISO: -1 }, { unique: true });
WeeklyStatSchema.index({ weekStartISO: -1 });