# API reference

All endpoints are below `https://localhost:7005` in development. Swagger UI is available at `/swagger` in the `Development` environment.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/Auth/login` | Public | Login, returns access token + sets refresh cookie |
| POST | `/api/Auth/refresh` | Public | Issue new access token using HttpOnly cookie |
| POST | `/api/Auth/logout` | Public | Revoke refresh token and clear cookie |

### CheckIn (Mitarbeiter / Employee)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/CheckIn/set-status` | Submit today's attendance status |
| GET | `/api/CheckIn/checkin` | Get today's / the latest check-in status (future demo entries are ignored) |
| GET | `/api/CheckIn/stats/me` | Get personal attendance statistics |
| GET | `/api/CheckIn/dashboard/overview` | Own totals and weekday distribution for `von`/`bis` |
| GET | `/api/CheckIn/dashboard/verlauf` | Own monthly counts for a `jahr` |
| GET | `/api/CheckIn/dashboard/heatmap` | Own office share per calendar week for a `jahr` |

The employee dashboard endpoints only ever return the signed-in user's own data; department comparison and ranking are admin-only.

### Dashboard (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Dashboard/overview` | Totals, weekday distribution, department comparison and top-5 ranking for `von`/`bis`, filterable by `abteilung` and `userId` |
| GET | `/api/Dashboard/verlauf` | Monthly counts for a `jahr` |
| GET | `/api/Dashboard/heatmap` | Office share per calendar week for a `jahr` |
| GET | `/api/Dashboard/team-woche` | Monday to Friday status per employee for the week starting at `montag` |

### User (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/User` | List all users (including admins) |
| GET | `/api/User/mitarbeiter` | List employees only (used by all selection lists) |
| GET | `/api/User/{id}` | Get user by ID |
| GET | `/api/User/{userId}/checkins` | An employee's check-ins between `von` and `bis` |
| GET | `/api/User/stats` | Attendance statistics with filters |
| GET | `/api/User/stats/abteilungen` | Statistics grouped by department |
| POST | `/api/User/{userId}/checkin` | Add a check-in for a past day (`status`, optional `datum`); `409` if one already exists |
| PUT | `/api/User/{userId}/checkin` | Correct (overwrite) an existing check-in; `400` for future dates |
| GET | `/api/User/export` | Export attendance data (CSV/PDF rendered in frontend) |
