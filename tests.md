# Tests

CheckIn hat automatisierte Tests für Backend und Frontend: **105 Backend-Tests** und **182 Frontend-Tests** (zusammen 287), alle grün.

Zuletzt ausgeführt auf dem Branch `chore/upgrade-dotnet-10` mit .NET 10 (ASP.NET Core und EF Core 10.0.15, SQL Server LocalDB für die Migrationsprüfung).

| Bereich | Werkzeug | Tests | Ort |
|---------|----------|-------|-----|
| Backend, Unit | xUnit, EF Core InMemory, echter `UserManager` | 54 | `backend.Tests/Unit` |
| Backend, Integration | xUnit, `WebApplicationFactory` (komplette API im Speicher) | 51 | `backend.Tests/Integration` |
| Frontend | Vitest, React Testing Library, jsdom | 182 | `frontend/src/__tests__` |

## Ausführen

```bash
# Backend (aus dem Repo-Root)
dotnet test backend.Tests/backend.Tests.csproj

# Frontend
cd frontend
npm test                # einmal ausführen
npm run test:watch      # bei jeder Änderung neu
npm run test:coverage   # mit Abdeckungsbericht (frontend/coverage)
```

Backend und Testprojekt laufen auf .NET 10 (`net10.0`). Das Testprojekt braucht dafür das SDK 10.

Zusätzlich zu den Tests habe ich nach dem Upgrade geprüft, dass `dotnet ef migrations has-pending-model-changes` keine Modelländerung meldet, die vier Migrationen angewendet sind, der Login gegen die echte LocalDB funktioniert und Swagger (`/swagger/v1/swagger.json`) 23 Pfade samt Bearer-Schema liefert.

## Screenshots

**Backend**

![Backend-Tests](docs/screenshots/tests-backend.png)

**Frontend**

![Frontend-Tests](docs/screenshots/tests-frontend.png)

**Frontend, Abdeckung** (86 % der Anweisungen, 93 % der Verzweigungen)

![Frontend-Abdeckung](docs/screenshots/tests-frontend-coverage.png)

Die Bilder sind aus der echten Konsolenausgabe der Läufe erzeugt (Backend: Ergebnis je Testklasse aus der TRX-Datei).

## Backend

Die Integrationstests starten die echte API mit Authentifizierung und Rollen, aber mit In-Memory-Datenbank. Im Environment `Testing` wird nichts geseedet. Seit EF Core 9 hinterlegt `AddDbContext` die `UseSqlServer`-Konfiguration zusätzlich als `IDbContextOptionsConfiguration<AppDbContext>`. Die Test-Fabrik entfernt sie, sonst sind zwei Datenbank-Provider gleichzeitig aktiv. Dafür legt `Program.cs` Demo-Konten und Demodaten jetzt nur noch in `Development` an.

| Testklasse | Tests | Prüft |
|------------|-------|-------|
| `DashboardServiceTests` | 21 | Zeiträume inklusive Enddatum, Filter, Abteilungsvergleich, Rangliste (max. 5), Verlauf, ISO-Wochen der Heatmap, Wochenraster ohne Admins |
| `UserServiceTests` | 11 | Nachtragen, Konflikt, Überschreiben, unbekannte Person, Mitarbeiterliste ohne Admins, Export |
| `CheckInServiceTests` | 11 | Einchecken, kein Doppeleintrag, Zukunftseinträge werden ignoriert, Statistik |
| `SeedDataTests` | 11 | Rollen und Admin, neue Abteilungsnamen, alle Werktage 2026, idempotent, deterministisch |
| `AuthApiTests` | 16 | Login, HttpOnly-Cookie, Refresh-Rotation, Wiederverwendung, Logout, 401 ohne Token |
| `DashboardApiTests` | 14 | 401/403, Form der Antworten, Mitarbeiter sehen nur eigene Daten (keine Rangliste, keine fremden Namen) |
| `AdminCheckInApiTests` | 13 | POST, 409 mit bestehendem Status, PUT, Zukunft 400, unbekannt 404, Mitarbeiter 403 |
| `EmployeeApiTests` | 8 | Einchecken, zweiter Check-in ändert nichts, Zukunftseinträge verstecken heute nicht, eigene Statistik |

## Frontend

| Datei | Tests | Prüft |
|-------|-------|-------|
| `utils/zeitraum.test.js` | 22 | Wochen, Monate, Quartale, ISO-Woche (2026 hat 53), Jahresgrenzen |
| `api/api.test.js` | 11 | Bearer-Header, Token nur im Speicher, 401 mit Refresh und Wiederholung, Forced-Logout |
| `components/*` | 65 | Karten, Footer, Perioden-Leiste, Navigation je Rolle, Benutzer-Icon (Menü, Escape, Klick daneben), Ziel-Meter, Wochenraster, Heatmap, Leerzustände, Layout, CSV-Export |
| `routes/ProtectedRoute.test.jsx` | 6 | Weiterleitung auf `/login` und bei falscher Rolle |
| `pages/*` | 78 | Verwalten, Check-in-Seite, Login, Impressum, Datenschutz, Auth-Kontext, Admin- und Mitarbeiter-Dashboard |

## Regressionstests

Diese Fehler traten auf und sind jetzt abgesichert:

- Zukunftsdaten (vorab erzeugte Demodaten) zählten als „letzter Check-in“.
- Der Refresh-Aufruf beim App-Start löste einen Logout und die Weiterleitung auf `/login` aus, deshalb waren Impressum und Datenschutz nicht erreichbar.
- Impressum und Admin-Konto nannten unterschiedliche Namen.
- Mitarbeiter-Endpunkte dürfen keine Daten anderer Personen enthalten.

Zur Kontrolle habe ich einzelne Korrekturen testweise zurückgenommen. Die jeweiligen Tests schlugen dann fehl.

## Bekannte Lücken

- Ohne Tests sind `App.jsx`, `DateTime.jsx`, `Toast.jsx`, `AdminList.jsx` und `Unauthorized.jsx` (0 % laut Abdeckungsbericht); `main.jsx` ist aus der Messung ausgenommen. Die Diagramme `TrendChart`, `WeekdayChart` usw. sind mit echten Daten nicht getestet, weil Recharts im jsdom eine Pixelgröße braucht. Getestet werden nur deren Leerzustände.
- Ein Teil der `Dashboards.test.jsx`-Tests ersetzt die Diagramme durch Platzhalter. Sie prüfen Datenfluss und Parameter, nicht das Aussehen.
- Es gibt keine End-to-End-Tests im Browser und keine CI-Pipeline.
