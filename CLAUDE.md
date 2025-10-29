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

**Leaderboards**
- `GET /leaderboard?week={YYYY-MM-DD}&scope={overall|pledge|member}` - Complete leaderboard with:
  - Scope filtering (overall/pledge/member)
  - Proper tie-breaker logic (tier priority, then points, then timestamp)
  - User details included (displayName, role)
  - Returns top 50 users sorted by weekly points
  - Implementation: `apps/api/src/leaderboard.controller.ts`

**Trophy Road / Season Progress**
- `GET /season/progress?userId={id}` - Year-to-date progression tracking
  - Returns total minutes/hours within current academic window
  - 4-tier milestone system (Tier I-IV with increasing intervals)
  - Milestone calculation with progress tracking
  - Implementation: `apps/api/src/trophy-road.controller.ts`
- `GET /season/occupancy` - Real-time zone occupancy data
  - Shows active sessions per zone
  - Useful for displaying which zones are currently busy

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

#### Mobile App (React Native + Expo)

Location: `apps/mobile/`

The mobile app is built with Expo (blank-typescript template) and includes:

**Project Structure**
- `constants/Colors.ts` - Sigma Nu color constants (Gold #FFC107, Black #111111)
- `api/client.ts` - Axios client with platform-specific baseURL
- `types/api.ts` - TypeScript interfaces for all API responses
- `components/` - Reusable UI components (Button, LoadingSpinner, ErrorState)
- `screens/` - 5 complete screen components

**Screens Implemented**
1. **HomeScreen** - `apps/mobile/screens/HomeScreen.tsx`
   - Displays current week stats (minutes, hours, progress)
   - "Start Study" button
   - Zone status indicator
   - Fetches from `/stats/weekly` endpoint

2. **LeaderboardScreen** - `apps/mobile/screens/LeaderboardScreen.tsx`
   - 3 tabs: Overall, Pledge, Member
   - Pull-to-refresh functionality
   - Top 3 ranks highlighted in gold
   - Fetches from `/leaderboard` with scope parameter

3. **TrophyRoadScreen** - `apps/mobile/screens/TrophyRoadScreen.tsx`
   - YTD hours and current tier display
   - Milestone progress tracking
   - Fetches from `/season/progress`

4. **MapScreen** - `apps/mobile/screens/MapScreen.tsx`
   - List of all zones with active/inactive status
   - Pull-to-refresh functionality
   - Fetches from `/zones`

5. **ProfileScreen** - `apps/mobile/screens/ProfileScreen.tsx`
   - User avatar with initials
   - Stats cards (YTD hours, weekly minutes)
   - Recent sessions placeholder
   - Settings button

**Tech Stack**
- React Native 0.74.5
- React 18.2.0 (strict version with overrides)
- Expo ~51.0.0
- Axios for API calls
- Platform-specific API URLs (Android: 10.0.2.2:3000, iOS: 10.134.180.90:3000)

### ❌ What's Missing

#### 1. Mobile App Navigation
- No navigation system implemented yet
- Screens exist but are not connected
- Need to add React Navigation or Expo Router
- Tab navigation for main 5 screens

#### 2. Live Session Tracking
- No geofence detection implemented
- Manual session start/stop not connected to backend
- Need location permissions and background tracking
- Real-time timer during active sessions

#### 3. Authentication
- No user authentication system
- Currently using hardcoded "Test User"
- Need to integrate Firebase Auth or similar
- Device ID management for unique users

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
  - `apps/mobile`: React Native mobile app
  - `packages/shared`: Shared constants and types

### Mobile
- **Framework**: React Native 0.74.5 with Expo ~51.0.0
- **Template**: blank-typescript (minimal dependencies)
- **HTTP Client**: Axios
- **Styling**: StyleSheet (no additional UI libraries)
- **State Management**: React hooks (useState, useEffect)
- **Platform Support**: iOS and Android
  - Platform-specific API URLs configured via Platform.OS detection

### Key Design Decisions

1. **Timezone-aware weeks**: All week boundaries use America/Phoenix timezone to ensure consistency across locations
2. **Idempotent stop**: Calling `/sessions/stop` multiple times with same sessionId is safe
3. **Weekly cap**: 18 hours/week maximum prevents gaming the system
4. **Verified duration**: Only time spent in approved zones counts
5. **No authentication yet**: All endpoints are dev-only, auth will be added later
6. **Points stored in WeeklyStat**: Not auto-computed yet, will need background job or trigger
7. **Mobile app minimal dependencies**: After React dependency conflicts, rebuilt with blank-typescript template
8. **React version locked**: Strict overrides in package.json force React 18.2.0 to prevent hook errors
9. **No navigation yet**: Individual screens built first, navigation layer will be added later

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

1. **Mobile Navigation** - Connect the 5 screens with tab navigation (React Navigation or Expo Router)
2. **Live Session Tracking** - Implement geofence detection and real-time session timers
3. **Authentication** - Add Firebase Auth or similar for user management
4. **Auto-compute Points** - Add background job or trigger to compute `points` and `tier` fields in WeeklyStat
5. **Profile Integration** - Connect ProfileScreen to fetch real user data from backend
6. **Session Management UI** - Add start/stop session controls that connect to backend endpoints
7. **Push Notifications** - Remind users to study, celebrate milestones
8. **Background Location** - Enable continued tracking when app is backgrounded

## Development Notes

### Running the Backend
```bash
cd apps/api
npm run start:dev
```

### Running the Mobile App
```bash
cd apps/mobile
npm start

# Then press:
# - 'a' for Android emulator
# - 'i' for iOS simulator
# - Scan QR code for physical device
```

**Important**: Update the API URL in `apps/mobile/api/client.ts` to match your backend:
- Android emulator: `http://10.0.2.2:3000`
- iOS simulator: Use your local IP (e.g., `http://10.134.180.90:3000`)
- Physical device: Use your local network IP

### Seeding Test Data
```bash
cd apps/api
npm run seed
```
This creates 10 test users (5 pledges, 5 members), 4 zones, and generates current week session data.

### MongoDB Connection
- Connection string stored in `.env` as `NUDO_MONGO_URI`
- Connects via `app.module.ts:15`

### Testing Endpoints
Use curl, Postman, or similar:
```bash
# Get config
curl http://localhost:3000/config

# Get all zones
curl http://localhost:3000/zones

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

# Get leaderboard (with scope)
curl http://localhost:3000/leaderboard?week=2025-10-27&scope=overall
curl http://localhost:3000/leaderboard?week=2025-10-27&scope=pledge
curl http://localhost:3000/leaderboard?week=2025-10-27&scope=member

# Get season progress (Trophy Road)
curl http://localhost:3000/season/progress?userId=user123

# Get zone occupancy
curl http://localhost:3000/season/occupancy
```

## Questions or Issues?

- Check the code comments for implementation details
- Key files:
  - **Backend**:
    - `apps/api/src/app.controller.ts` - Main endpoints (sessions, config, zones)
    - `apps/api/src/leaderboard.controller.ts` - Leaderboard with scope filtering
    - `apps/api/src/trophy-road.controller.ts` - Trophy Road / Season progress
    - `apps/api/src/schemas.ts` - Database models (User, Zone, Session, WeeklyStat)
    - `apps/api/src/time.ts` - Timezone utilities (Phoenix week calculations)
    - `apps/api/src/seed.ts` - Database seed script
  - **Shared**:
    - `packages/shared/src/index.ts` - Constants, scoring logic, academic windows
  - **Mobile**:
    - `apps/mobile/api/client.ts` - API client configuration
    - `apps/mobile/types/api.ts` - TypeScript API types
    - `apps/mobile/constants/Colors.ts` - Sigma Nu color constants
    - `apps/mobile/screens/*.tsx` - 5 screen components (Home, Leaderboard, TrophyRoad, Map, Profile)
