# Architecture

How CheckIn is built. For setup and usage see the [README](../README.md).

## Tech stack

### Backend
- ASP.NET Core 10 Web API (.NET 10, LTS)
- Entity Framework Core with MSSQL (LocalDB for development)
- ASP.NET Core Identity for user management
- JWT Bearer authentication with refresh token rotation
- Roles: `Admin`, `Mitarbeiter` (Employee)
- Tests: xUnit, `WebApplicationFactory`, EF Core InMemory

### Frontend
- React 19 with Vite
- React Router
- Axios with request/response interceptors
- Recharts for data visualization
- lucide-react for icons
- react-hot-toast for notifications
- jsPDF + jspdf-autotable for PDF export
- Tests: Vitest, React Testing Library, jsdom

## Project structure

```
CheckIn/
├── backend.Tests/        xUnit tests (unit and API integration)
├── backend/
│   ├── Controllers/
│   │   ├── AdminController.cs
│   │   ├── AuthController.cs
│   │   ├── CheckInController.cs
│   │   ├── DashboardController.cs
│   │   └── UserController.cs
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── SeedData.cs
│   ├── Dto/
│   │   ├── AdminCheckInDto.cs
│   │   ├── AuthResponseDto.cs
│   │   ├── CheckInDto.cs
│   │   ├── CheckInExportDto.cs
│   │   ├── CheckInListDto.cs
│   │   ├── CheckInStatsDto.cs
│   │   ├── CheckInStatusDto.cs
│   │   ├── CreateUserDto.cs
│   │   ├── DashboardDto.cs
│   │   ├── InviteUserDto.cs
│   │   ├── KursStatsDto.cs
│   │   ├── LoginDto.cs
│   │   ├── SetPasswordDto.cs
│   │   └── UserDto.cs
│   ├── Models/
│   │   ├── AttendanceStatus.cs
│   │   ├── CheckIn.cs
│   │   ├── JwtSettings.cs
│   │   ├── RefreshToken.cs
│   │   └── User.cs
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── CheckInService.cs
│   │   ├── DashboardService.cs
│   │   ├── EmailService.cs
│   │   ├── IAuthService.cs
│   │   ├── ICheckInService.cs
│   │   ├── IDashboardService.cs
│   │   ├── IEmailService.cs
│   │   ├── IInvitationService.cs
│   │   ├── IUserService.cs
│   │   ├── InvitationService.cs
│   │   └── UserService.cs
│   └── Program.cs
├── docs/                 documentation and screenshots
├── .github/workflows/    CI (backend, frontend, dependency scan)
├── CONTRIBUTING.md
├── tests.md              test overview and results
└── frontend/
    ├── e2e/                  Playwright tests (flows and axe accessibility checks)
    ├── playwright.config.js
    ├── src/
    │   ├── __tests__/        Vitest tests (api, components, pages, routes, utils)
    │   ├── api/
    │   │   └── api.jsx
    │   ├── assets/
    │   ├── components/
    │   │   ├── Button.jsx
    │   │   ├── DashboardCharts.jsx
    │   │   ├── DateTime.jsx
    │   │   ├── ExportTable.jsx
    │   │   ├── Footer.jsx
    │   │   ├── LanguageSwitch.jsx
    │   │   ├── Karte.jsx
    │   │   ├── LegalPage.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── PeriodBar.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── Toast.jsx
    │   │   ├── UserMenu.jsx
    │   │   └── chartConfig.js
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── i18n/
    │   │   ├── LanguageContext.jsx   provider and hook (t, lang, setLang)
    │   │   ├── i18n.js               translate, storage, month names
    │   │   ├── messages.de.js        German texts (default)
    │   │   └── messages.en.js        English texts
    │   ├── layout/
    │   │   └── MainLayout.jsx
    │   ├── pages/
    │   │   ├── AdminList.jsx
    │   │   ├── AdminManage.jsx
    │   │   ├── AdminPanel.jsx
    │   │   ├── CheckInPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Datenschutz.jsx
    │   │   ├── Impressum.jsx
    │   │   ├── Login.jsx
    │   │   ├── legal/            English imprint and privacy policy
    │   │   ├── Unauthorized.jsx
    │   │   └── UserView.jsx
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx
    │   ├── styles/
    │   │   ├── components.css
    │   │   ├── dashboard.css
    │   │   ├── index.css
    │   │   ├── legal.css
    │   │   ├── manage.css
    │   │   └── pages.css
    │   ├── test/             Vitest setup
    │   ├── utils/
    │   │   └── zeitraum.js
    │   └── main.jsx
    └── vite.config.js
```

## Languages

The frontend is German by default and can be switched to English with the `DE | EN` buttons (`LanguageSwitch`).

- `LanguageProvider` holds the language, stores it in `localStorage` (`checkin.lang`) and sets `<html lang>`. Components read it with `useLanguage()`, which returns `t(key, params)`, `lbl(value)`, `pct(n)`, the locale for dates and the month names. Without a provider (component tests) the language is German.
- All texts are keys in `messages.de.js` and `messages.en.js` with `{placeholders}`. A missing English text falls back to German.
- The backend is not translated. It returns weekday, month and department names in German, and the frontend maps the known values with `lbl()`. Unknown values, such as new departments, are shown unchanged. Status values (`Office`, `HomeOffice`, `Abwesend`) are the same in both languages and only their display names change.
- The imprint and the privacy policy are separate components per language (`Impressum.jsx`/`Datenschutz.jsx` and `pages/legal/*En.jsx`). The German text is authoritative, the English one says so.
- Dates use the locale of the language (`de-DE`, `en-GB`).

## Authentication flow

```
Login
  └─► Access Token (in-memory)  +  Refresh Token (HttpOnly Cookie)
              │
              ▼
       API request with Bearer token
              │
         401 Unauthorized?
              │
              ▼
       POST /api/Auth/refresh  ← cookie sent automatically by browser
              │
              ▼
       New Access Token → original request retried
              │
         Refresh failed?
              │
              ▼
       Forced logout → redirect to /login
```

- **Access tokens** expire after 15 minutes and are never written to `localStorage` or `sessionStorage`
- **Refresh tokens** are valid for 7 days, rotated on every use, and stored as `HttpOnly; Secure; SameSite=None` cookies — inaccessible to JavaScript
- The refresh call made at app start (to restore a session) never triggers a forced logout, so the public pages `/impressum` and `/datenschutz` stay reachable without login

## Domain terms

Since this app was built for a German-speaking workplace, some domain terms appear in the codebase and UI:

| German | English |
|--------|---------|
| Mitarbeiter | Employee |
| Abteilung | Department |
| Abwesend | Absent |
| Einloggen | Log in |
| Abmelden | Log out |
| Auswertungen | Analytics / Reports |
| Einchecken | Check in |
| Nachtragen | Add retroactively |
| Verwalten | Manage |
| Nachname / Vorname | Last name / First name |
| Datum | Date |
| Impressum / Datenschutz | Imprint / Privacy policy |

### Demo departments

| Department |
|------------|
| Softwareentwicklung |
| Administration |
| Kundenservice |
| Vertrieb |
