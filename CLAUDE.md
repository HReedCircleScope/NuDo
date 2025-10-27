# NuDo Project Documentation

## Overview

NuDo is a study-time tracking app for a fraternity, designed to track verified study sessions at approved locations and provide gamified leaderboards, trophies, and achievements.

## Current Status

### ✅ What's Built

#### Backend API (NestJS + MongoDB)
The backend is fully operational with the following endpoints:

**Configuration**
- `GET /config` - Returns app configuration (timezone, goals, caps, academic windows)

**Zones (Study Locations)**
- `GET /zones` - List all active zones
- `POST /zones` - Create a new zone (dev-only, no auth yet)
  - Body: `{ name, lat, lng, radiusMeters, isActive? }`
- `PATCH /zones` - Update a zone (dev-only)
  - Body: `{ id, name?, lat?, lng?, radiusMeters?, isActive? }`

**Sessions (Study Time Tracking)**
- `POST /sessions/start` - Start a study session
  - Body: `{ userId, zoneId }`
  - Returns: `{ sessionId, startAt }`
- `POST /sessions/stop` - Stop a session and compute verified duration
  - Body: `{ sessionId }`
  - Returns: `{ durationMin, endAt, minutes, weekStart }`
  - Automatically updates weekly stats in America/Phoenix timezone

**Weekly Statistics**
- `GET /stats/weekly?userId={id}` - Get current week's stats for a user
  - Returns: `{ userId, minutes, weekStart }`
  - Uses America/Phoenix timezone for week boundaries

**Leaderboards (Partial)**
- `GET /leaderboard?week={YYYY-MM-DD}` - Basic leaderboard endpoint
  - Currently only sorts by minutes (descending)
  - Returns top 50 users
  - **Missing**: scope filtering (overall/pledge/member), proper tie-breaker logic, user details

#### Data Models (MongoDB Schemas)

**User** - `apps/api/src/schemas.ts:4`
- `displayName`: User's display name
- `email`: Unique email
- `role`: "pledge" | "member" | "admin"
- `deviceIdHash`: Unique device identifier
- `avatarKey`: Optional avatar reference
- `streakWeeks`: Consecutive weeks meeting goal (default: 0)

**Zone** - `apps/api/src/schemas.ts:16`
- `name`: Zone name (e.g., "Main Library")
- `lat`, `lng`: GPS coordinates
- `radiusMeters`: Geofence radius
- `isActive`: Whether zone is currently active

**Session** - `apps/api/src/schemas.ts:28`
- `userId`: User who studied
- `zoneId`: Where they studied
- `startAt`, `endAt`: Session timestamps
- `durationMin`: Computed verified duration
- `source`: "manual" (for now)
- TTL index: Auto-delete after ~400 days

**WeeklyStat** - `apps/api/src/schemas.ts:43`
- `userId`: User ID
- `weekStartISO`: Week key in "YYYY-MM-DD" format (America/Phoenix timezone)
- `minutes`: Total verified minutes for the week
- `points`: Computed points (not auto-updated yet)
- `tier`: Optional tier label ("base", "bronze", "silver", etc.)
- Unique index on `(userId, weekStartISO)`

#### Scoring System (Shared Package)

Location: `packages/shared/src/index.ts`

**Base Points** - `packages/shared/src/index.ts:37`
- 1 point per 5 minutes of study time
- Capped at 18 hours/week maximum

**Weekly Bonuses**
- 6+ hours: +25 points
- 8+ hours: +15 points (cumulative)
- 10+ hours: +20 points (cumulative)
- 12+ hours: +25 points (cumulative)

**Streak Multiplier**
- 5% bonus per consecutive week meeting goal
- Capped at 1.25x (5 weeks)

### ❌ What's Missing

#### 1. Leaderboards (Incomplete)
The leaderboard endpoint exists but needs:
- **Scope filtering**: Support `?scope=overall|pledge|member` query parameter
- **Tie-breaker logic**: When points are equal:
  1. Highest tier wins
  2. If tied, highest total points wins
  3. If still tied, earliest timestamp wins
- **User details**: Include user's `displayName` and `role` in response
- **Proper sorting**: Sort by points (desc), then apply tie-breakers

#### 2. Trophy Road (Not Started)
- No backend logic for Trophy Road progression
- Need to track:
  - Total points across all academic windows
  - Trophy milestones and rewards
  - Visual progression data for mobile app
- Academic windows defined in shared: `UA_2025_WINDOWS`

#### 3. Mobile App (Not Started)
- React Native app not initialized
- Will need to consume backend API
- Features needed:
  - Zone detection and auto-session start/stop
  - Real-time session tracking
  - Weekly stats dashboard
  - Leaderboards view
  - Trophy Road visualization

## Tech Stack & Decisions

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Timezone**: America/Phoenix (no DST)
  - Week starts on Monday
  - Helper function: `phoenixWeekStartISODate()` in `apps/api/src/time.ts:11`
- **Architecture**: Monorepo with workspaces
  - `apps/api`: NestJS backend
  - `packages/shared`: Shared constants and types

### Future Mobile
- **Framework**: React Native (not started)
- **Package**: Will be `apps/mobile` when created

### Key Design Decisions

1. **Timezone-aware weeks**: All week boundaries use America/Phoenix timezone to ensure consistency across locations
2. **Idempotent stop**: Calling `/sessions/stop` multiple times with same sessionId is safe
3. **Weekly cap**: 18 hours/week maximum prevents gaming the system
4. **Verified duration**: Only time spent in approved zones counts
5. **No authentication yet**: All endpoints are dev-only, auth will be added later
6. **Points stored in WeeklyStat**: Not auto-computed yet, will need background job or trigger

## Coding Standards

### TypeScript
- **No `any` types**: Always use proper typing
  - Exception: Migration code or Mongoose models where schema provides type safety
- **Explain complex logic**: Add comments for non-obvious code
  - Example: `apps/api/src/app.controller.ts:141` explains Phoenix timezone usage

### Code Organization
- Controllers handle HTTP logic only
- Business logic should move to services as code grows
- Shared types and constants go in `packages/shared`
- Database schemas live in `apps/api/src/schemas.ts`

### Naming Conventions
- **Files**: kebab-case (e.g., `leaderboard.controller.ts`)
- **Classes**: PascalCase (e.g., `LeaderboardController`)
- **Functions**: camelCase (e.g., `phoenixWeekStartISODate`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `WEEKLY_GOAL_HOURS`)

### Error Handling
- Return error objects, don't throw (for now)
- Format: `{ error: 'error_code' }`
- Example: `{ error: 'session_not_found' }`

## Database Indexes

### Important Indexes
- `User.email`: Unique
- `User.deviceIdHash`: Unique, sparse
- `Session(userId, startAt)`: Compound index for user's session history
- `Session.createdAt`: TTL index (400 days)
- `WeeklyStat(userId, weekStartISO)`: Unique compound index
- `WeeklyStat.weekStartISO`: For weekly queries

## Constants & Configuration

Location: `packages/shared/src/index.ts`

- `TIMEZONE`: "America/Phoenix"
- `WEEKLY_GOAL_HOURS`: 6
- `WEEKLY_CAP_MIN`: 1080 (18 hours)
- `UA_2025_WINDOWS`: Academic year date ranges for Trophy Road

## Next Steps (Priority Order)

1. **Complete Leaderboards** - Add scope filtering and tie-breaker logic
2. **Auto-compute Points** - Add background job or trigger to compute `points` and `tier` fields in WeeklyStat
3. **Trophy Road Backend** - Implement progression tracking and milestones
4. **Mobile App Init** - Set up React Native project structure
5. **Authentication** - Add Firebase Auth or similar
6. **Auto-session Management** - Geofence triggers for auto-start/stop

## Development Notes

### Running the Backend
```bash
cd apps/api
npm run start:dev
```

### MongoDB Connection
- Connection string stored in `.env` as `NUDO_MONGO_URI`
- Connects via `app.module.ts:15`

### Testing Endpoints
Use curl, Postman, or similar:
```bash
# Get config
curl http://localhost:3000/config

# Start session
curl -X POST http://localhost:3000/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","zoneId":"zone456"}'

# Stop session
curl -X POST http://localhost:3000/sessions/stop \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session789"}'

# Get weekly stats
curl http://localhost:3000/stats/weekly?userId=user123

# Get leaderboard
curl http://localhost:3000/leaderboard?week=2025-10-27
```

## Questions or Issues?

- Check the code comments for implementation details
- Key files:
  - `apps/api/src/app.controller.ts` - Main endpoints
  - `apps/api/src/schemas.ts` - Database models
  - `packages/shared/src/index.ts` - Constants and scoring
  - `apps/api/src/time.ts` - Timezone utilities
