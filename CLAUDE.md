# ChickInn Web – Projekt-Kontext

## Was ist das?
Eine mobile-first Web-PWA zum Verwalten von Hühnern und deren Eierproduktion. Mehrere Nutzer teilen sich eine "Farm" und sehen alle Hühner/Eier gemeinsam. Die App ersetzt eine native iOS-App und läuft auf allen Geräten ohne App Store.

## Tech-Stack
| Schicht | Technologie |
|---------|------------|
| Frontend | React 19 + Vite 8 + TypeScript 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` Plugin) |
| Icons | Lucide React (SVG, **keine Emojis als Icons!**) |
| Routing | React Router v7 (client-side) |
| Charts | Recharts (BarChart auf Reports-Seite) |
| Backend | PHP 8 + MySQL (REST-API) |
| Auth | Token-basiert (64-Byte Hex, 90 Tage, Bearer Header) |
| PWA | manifest.json + viewport-fit=cover |
| Deploy | SFTP via `deploy.py` (Python/paramiko) |

## Hosting
- **Server**: IONOS Webspace
- **URL**: `https://montolio.de/chickinn/`
- **Serverpfad**: `/MLP_MultiAccount_App/chickinn/`
- **SFTP**: Port 22, Credentials in `.ftp-credentials` (nicht im Repo)
- **Vite base**: `/chickinn/`

## Verzeichnisstruktur
```
api/                        # PHP Backend (wird auf Server deployed)
  config.php               # DB-Verbindung, requireAuth(), CORS, jsonResponse()
  auth.php                 # Login, Register, Logout, Token-Check, Password-Reset
  chickens.php             # Hühner CRUD (GET/POST/PUT/DELETE)
  eggs.php                 # Eier CRUD (GET/POST/DELETE)
  farm.php                 # Farm-Management (create/join/leave/transfer/remove)
  health.php               # Gesundheits-Logs (GET/POST mit Upsert)
  medications.php          # Medikation CRUD pro Huhn
  moult.php                # Mauser-Perioden CRUD pro Huhn
  upload.php               # Foto-Upload (multipart/form-data)
  schema.sql               # Basis-Schema (users, auth_tokens, chickens, eggs, moult_periods, medications)
  migrate_farms.sql         # Migration: farms + farm_members + farm_id auf chickens/eggs
  migrate_fix.sql           # Aktuelle Nachmigrationen (zuletzt: farm_id + nullable end_date für v1.4)
  run_migration.php         # Migration-Runner (GET mit ?key=chickinn2026migrate)
  .htaccess                # Schutz für config.php
  uploads/                 # Hochgeladene Fotos (auf Server, nicht im Repo)

src/
  api.ts                   # API-Client: apiFetch<T>(), Token aus localStorage
  types.ts                 # TypeScript Interfaces: Chicken, Egg, MoultPeriod, Medication
  App.tsx                  # Router-Setup
  main.tsx                 # Entry Point
  index.css                # Tailwind Import
  context/
    AuthContext.tsx         # AppUser, login/register/logout/refreshUser
  hooks/
    useChickens.ts         # CRUD Hook: chickens[], addChicken, updateChicken, deleteChicken
    useEggs.ts             # CRUD Hook: eggs[], addEgg, deleteEgg
    useMedications.ts      # CRUD Hook: medications[], add/update/delete
    useMoultPeriods.ts     # CRUD Hook: moultPeriods[], add/update/delete
    usePhotoUpload.ts      # uploadPhoto(): Client-side Resize + Upload
  utils/
    date.ts                # Stabile YYYY-MM-DD <-> Unix-ms Konvertierung
  components/
    Layout.tsx             # Outlet + BottomNav Wrapper
    BottomNav.tsx          # Fixed bottom nav, 4 Tabs (Dashboard, Hühner, Reports, Settings)
    LoginPage.tsx          # Login/Register/Password-Reset Screen
    PhotoPicker.tsx        # Foto-Auswahl mit Komprimierung, optional placeholder
    InstallPrompt.tsx      # PWA Install-Prompt
  pages/
    Dashboard.tsx          # Stats-Grid + Quick Egg Log (nur lebende Hühner) + Letzte Eier
    ChickensPage.tsx       # Hühner-Liste + Add-Form + CSV-Import + Ahnengalerie (tote Hühner)
    ChickenDetail.tsx      # Eier + Gesundheit + Medikation inkl. Mauser/Medikations-CRUD, Edit-Mode + Ei-Modal
    ReportsPage.tsx        # BarChart (12 Wochen) + Pro-Huhn-Balken
    SettingsPage.tsx       # Farm-Management + Account + App-Info

public/
  .htaccess                # SPA-Routing (alle Pfade -> index.html)
  manifest.json            # PWA-Manifest
  favicon.svg, icons.svg   # App-Icons

deploy.py                  # SFTP Deploy-Script (python deploy.py)
.ftp-credentials           # FTP-Zugangsdaten (NICHT im Repo, .gitignore)
```

## Datenmodell (MySQL)

### `users`
```sql
id INT PK AUTO_INCREMENT
email VARCHAR(255) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL          -- bcrypt
display_name VARCHAR(100) NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

### `auth_tokens`
```sql
id INT PK, user_id FK -> users
token VARCHAR(64) UNIQUE               -- 64-Byte Hex, oder "reset:XXXXXX" für PW-Reset
expires_at DATETIME                     -- 90 Tage (Login) oder 15 Min (Reset)
```

### `farms`
```sql
id INT PK, name VARCHAR(100)
invite_code VARCHAR(8) UNIQUE           -- 6-stellig, uppercase hex
created_by INT FK -> users
created_at TIMESTAMP
```

### `farm_members`
```sql
id INT PK
farm_id FK -> farms, user_id FK -> users
role ENUM('owner','member')             -- genau ein owner pro farm
UNIQUE(farm_id, user_id)
```

### `chickens`
```sql
id INT PK, user_id FK, farm_id INT NULL
name VARCHAR(100), breed VARCHAR(100) NULL, notes TEXT NULL
photo_url VARCHAR(500) NULL             -- Huhn-Foto
egg_photo_url VARCHAR(500) NULL         -- Ei-Referenzfoto (wie sieht das Ei aus?)
hatched_at DATE NULL                    -- Schlüpfdatum
died_at DATE NULL                       -- Todestag (-> Ahnengalerie)
created_at BIGINT                       -- Unix ms
```

### `eggs`
```sql
id INT PK, chicken_id FK, user_id FK, farm_id INT NULL
laid_at BIGINT                          -- Unix ms
notes TEXT NULL
```

### `health_logs`
```sql
id INT PK, chicken_id FK, user_id FK, farm_id INT NULL
log_date DATE
checks_json TEXT                        -- JSON: {"eating": true, "drinking": false, ...}
notes TEXT NULL
UNIQUE(chicken_id, log_date)            -- ein Eintrag pro Huhn pro Tag (Upsert)
```

### `moult_periods`
```sql
id INT PK, chicken_id FK, user_id FK, farm_id INT NULL
start_date BIGINT                       -- Unix ms
end_date BIGINT NULL                    -- NULL = läuft noch
notes TEXT NULL
```

### `medications`
```sql
id INT PK, chicken_id FK, user_id FK, farm_id INT NULL
name VARCHAR(200) NOT NULL
start_date BIGINT                       -- Unix ms
end_date BIGINT NULL                    -- NULL = Behandlung läuft noch
notes TEXT NULL
```

## Farm-Sharing Konzept
- Jeder User kann eine Farm erstellen oder per **6-stelligem Invite-Code** beitreten
- Beim Erstellen/Beitreten werden bestehende Hühner/Eier/Medikationen/Mauser-Daten (`farm_id IS NULL`) in die Farm migriert
- Alle Queries filtern per `farm_id` wenn User einer Farm angehört, sonst per `user_id`
- **Owner** (Admin): sieht Invite-Code, kann Mitglieder entfernen, Admin-Rechte übertragen, Farm umbenennen
- **Member**: kann Farm verlassen
- Beim Verlassen bleiben Hühner/Eier/Medikationen/Mauser-Daten in der Farm (User verliert nur Zugriff)
- Owner mit anderen Mitgliedern muss erst Admin-Rechte übertragen
- Alleiniger Owner kann Farm auflösen (eigene Hühner/Eier/Medikationen/Mauser-Daten werden ihm zurückgegeben)

## Auth-System
- Token wird bei Login/Register generiert (64-Byte Hex, 90 Tage)
- Gespeichert in `localStorage` als `chickinn_token`
- Jeder API-Call sendet `Authorization: Bearer <token>`
- `requireAuth()` in config.php: validiert Token, gibt User + Farm-Daten zurück (LEFT JOIN auf farm_members + farms)
- Password-Reset: 6-stelliger Code per E-Mail, 15 Min gültig

## API-Endpoints
```
# Auth
POST   /api/auth.php?action=register       { email, password, displayName }
POST   /api/auth.php?action=login           { email, password }
GET    /api/auth.php?action=me              Token prüfen -> user + farmId/farmName/farmRole
POST   /api/auth.php?action=logout          Token löschen
POST   /api/auth.php?action=reset-request   { email } -> 6-stelliger Code per Mail
POST   /api/auth.php?action=reset-confirm   { email, code, newPassword }

# Chickens
GET    /api/chickens.php                    Alle Hühner (farm_id oder user_id)
GET    /api/chickens.php?id=1               Ein Huhn
POST   /api/chickens.php                    Huhn anlegen { name, breed?, notes?, photoUrl?, hatchedAt? }
PUT    /api/chickens.php?id=1               Huhn bearbeiten { name?, breed?, notes?, photoUrl?, eggPhotoUrl?, hatchedAt?, diedAt? }
DELETE /api/chickens.php?id=1               Huhn + Fotos löschen

# Eggs
GET    /api/eggs.php                        Alle Eier
GET    /api/eggs.php?chickenId=1            Eier eines Huhns
POST   /api/eggs.php                        Ei anlegen { chickenId, laidAt?, notes? }
DELETE /api/eggs.php?id=1                   Ei löschen

# Farm
GET    /api/farm.php                        Farm-Info + Mitglieder
POST   /api/farm.php?action=create          Farm erstellen { name? }
POST   /api/farm.php?action=join            Beitreten { code }
POST   /api/farm.php?action=leave           Farm verlassen
POST   /api/farm.php?action=transfer        Admin übertragen { userId }
POST   /api/farm.php?action=remove          Mitglied entfernen { userId }
PUT    /api/farm.php                        Farm umbenennen { name }
POST   /api/farm.php?action=new-code        Neuen Invite-Code generieren

# Health
GET    /api/health.php?chickenId=1          Gesundheits-Logs (optional &from=&to=)
POST   /api/health.php                      Log anlegen/updaten { chickenId, logDate, checks, notes? }

# Medications
GET    /api/medications.php?chickenId=1     Medikationen eines Huhns
POST   /api/medications.php                 Medikation anlegen { chickenId, name, startDate, endDate?, notes? }
PUT    /api/medications.php?id=1            Medikation bearbeiten { name?, startDate?, endDate?, notes? }
DELETE /api/medications.php?id=1            Medikation löschen

# Moult
GET    /api/moult.php?chickenId=1           Mauser-Perioden eines Huhns
POST   /api/moult.php                       Mauser anlegen { chickenId, startDate, endDate?, notes? }
PUT    /api/moult.php?id=1                  Mauser bearbeiten { startDate?, endDate?, notes? }
DELETE /api/moult.php?id=1                  Mauser löschen

# Upload
POST   /api/upload.php                      Foto hochladen (multipart/form-data, field: "photo")
```

## Aktueller Stand
- `v1.5` (UX Polish) ist implementiert und deployt.
- `v1.4` (Medikation + Mauser) ist implementiert, deployt und die Migration wurde auf Produktion ausgeführt.
- Medikation hat vollen CRUD im eigenen Tab von `ChickenDetail.tsx`.
- Mauser hat vollen CRUD innerhalb des Gesundheit-Screens von `ChickenDetail.tsx`.
- `medications.end_date` ist nullable; offene Einträge werden im UI als `Läuft` dargestellt.
- Neue Endpunkte antworten produktiv korrekt und verlangen Auth (`401` ohne Token).

### v1.5 — UX Polish
- `ToastProvider` (`src/context/ToastContext.tsx`) ist in `App.tsx` verdrahtet; alle Pages nutzen `useToast()` statt `alert()`.
- `Skeleton`/`StatCardSkeleton`/`ListRowSkeleton` (`src/components/Skeleton.tsx`) ersetzen leere Loading-Screens.
- `SwipeableRow` (`src/components/SwipeableRow.tsx`) erlaubt Swipe-to-Delete auf der Eier-Liste in `ChickenDetail`.
- `PullToRefresh` (`src/components/PullToRefresh.tsx`) wrap't Dashboard + ChickensPage. `Layout.tsx` nutzt jetzt Body-Scroll (kein `overflow-y-auto` auf `<main>`).
- `vite-plugin-pwa` liefert Service Worker mit Workbox (Precache + NetworkFirst für API, CacheFirst für Uploads). Bestehendes `public/manifest.json` bleibt maßgeblich (`manifest: false`).
- Eigenes PWA-Icon-Set (`icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, `favicon.svg`) via `scripts/generate-icons.mjs` (Canvas API, @napi-rs/canvas, System-Georgia).
- Version wird aus `package.json` über Vite-define `__APP_VERSION__` in `SettingsPage` angezeigt.

## Lokale Entwicklung
```bash
npm install
npm run dev              # http://localhost:5173/chickinn/
```

API lokal testen (optional):
```bash
cd api && php -S localhost:8080
```

## Build & Deploy
```bash
npm run build            # tsc + vite build -> dist/
python deploy.py         # SFTP Upload zu IONOS
```

## DB-Migrationen ausführen
Neue Spalten/Tabellen als SQL in `api/migrate_fix.sql` schreiben, dann:
```
https://montolio.de/chickinn/api/run_migration.php?key=chickinn2026migrate
```
Der Runner führt alle Statements aus und zeigt OK/ERR pro Statement.

## Wichtige Designentscheidungen
- **PHP/MySQL statt Firebase**: Eigener IONOS-Server, keine Cloud-Abhängigkeit
- **Tailwind v4**: Import via `@import "tailwindcss"` in CSS, Plugin via Vite
- **Lucide Icons**: SVG-Icons, **niemals Emojis als UI-Icons** verwenden
- **Token-Auth statt Sessions**: Stateless, kein Cookie-Handling
- **Foto-Komprimierung**: Client-seitig (800px max, JPEG 80%) vor Upload
- **Farm-basierte Isolation**: Queries filtern per farm_id wenn vorhanden, sonst user_id
- **Alle Timestamps als Unix ms**: `Date.now()` / `BIGINT` — einfacher zu sortieren
- **Kein State-Management-Library**: React Context für Auth, Daten direkt aus Hooks
- **iPhone 13 Mini als Primärgerät**: 375px, min 44px Touch-Targets
- **Ahnengalerie**: Tote Hühner (diedAt gesetzt) werden ausgegraut separiert angezeigt, nicht gelöscht
- **Ei-Referenzfoto**: Pro Huhn ein Foto wie dessen Ei aussieht (nicht pro einzelnem Ei)
- **CSV-Import**: Unterstützt Name;Eier Format, Separator-Erkennung (`;` vs `,`)

## Workflow-Regeln
- Immer auf Branch `chickinn-web` arbeiten
- Nach jeder Änderung committen
- `npm run build` muss fehlerfrei durchlaufen bevor deployed wird
- TypeScript strict mode — keine ungenutzten Imports/Variablen
