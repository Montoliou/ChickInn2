# ChickInn Web – Claude Code Kontext

## Was ist das?
Eine mobile-first Web-PWA zum Verwalten von Hühnern und deren Eierproduktion. Sie ersetzt eine native iOS-App (Swift/CoreData) durch eine React-Webapp mit PHP/MySQL-Backend, die auf allen Geräten läuft und ohne App-Store-Konto installiert werden kann.

## Tech-Stack
- **React 19 + Vite + TypeScript** – Bundler und Framework
- **Tailwind CSS v4** (via `@tailwindcss/vite`) – Styling, mobile-first
- **Lucide React** – SVG-Icons (keine Emojis als Icons!)
- **PHP 8 + MySQL** – REST-API Backend auf IONOS Server
- **React Router v7** – Client-seitiges Routing
- **Recharts** – Bar-Chart auf der Reports-Seite
- **PWA** – manifest.json + viewport-fit=cover für iPhone-Homescreen

## Hosting
- **Server**: IONOS Webspace (Vertrag 456364)
- **Domain**: montolio.de/chickinn
- **Serverpfad**: /MLP_MultiAccount_App/chickinn/
- **Deploy**: SFTP (Port 22)

## Verzeichnisstruktur
```
api/                    # PHP Backend (wird auf Server deployed)
  config.php           # DB-Verbindung, Auth-Helper, CORS
  auth.php             # Login, Register, Logout, Token-Check
  chickens.php         # Hühner CRUD
  eggs.php             # Eier CRUD
  upload.php           # Foto-Upload
  schema.sql           # MySQL Tabellen-Definition
  .htaccess            # Schutz für config.php
  uploads/             # Hochgeladene Fotos (auf Server)

src/
  api.ts               # API-Client (fetch + Token-Management)
  types.ts             # Shared TypeScript Interfaces
  context/
    AuthContext.tsx    # Email/Password Auth, Token-basiert
  hooks/
    useChickens.ts     # REST-API CRUD für Hühner
    useEggs.ts         # REST-API CRUD für Eier
    usePhotoUpload.ts  # Foto komprimieren + Upload
  components/
    Layout.tsx         # Outlet + BottomNav Wrapper
    BottomNav.tsx      # Fixed bottom navigation, 4 Tabs (Lucide Icons)
    LoginPage.tsx      # Login/Register Screen
  pages/
    Dashboard.tsx      # Stats-Grid + Quick Egg Log + Recent Eggs
    ChickensPage.tsx   # Hühner-Liste + Add-Form mit Foto
    ChickenDetail.tsx  # Tab-View: Eier / Mauser / Medikation + Foto-Upload
    ReportsPage.tsx    # BarChart (Recharts) + Pro-Huhn-Auswertung
    SettingsPage.tsx   # Konto-Info, Logout, PWA-Hinweis

public/
  .htaccess            # SPA-Routing (alle Pfade → index.html)
  manifest.json        # PWA-Manifest
```

## Datenmodell (MySQL)

### `users`
```sql
id INT PK, email VARCHAR UNIQUE, password VARCHAR (bcrypt), display_name VARCHAR, created_at TIMESTAMP
```

### `auth_tokens`
```sql
id INT PK, user_id FK, token VARCHAR(64) UNIQUE, expires_at DATETIME
```

### `chickens`
```sql
id INT PK, user_id FK, name VARCHAR, breed VARCHAR?, notes TEXT?, photo_url VARCHAR?, created_at BIGINT
```

### `eggs`
```sql
id INT PK, chicken_id FK, user_id FK, laid_at BIGINT, notes TEXT?
```

### `moult_periods` / `medications` — Schema vorbereitet, noch nicht implementiert

Alle Timestamps sind **Unix milliseconds** (Date.now()). Alle Queries filtern per `user_id`.

## Auth-System
- **Token-basiert**: Bei Login/Register wird ein 64-Byte Hex-Token generiert
- **Token-Speicherung**: `localStorage` im Browser, `auth_tokens`-Tabelle in MySQL
- **Token-Laufzeit**: 90 Tage
- **Header**: `Authorization: Bearer <token>`

## API-Endpoints
```
POST   /api/auth.php?action=register   — { email, password, displayName }
POST   /api/auth.php?action=login      — { email, password }
GET    /api/auth.php?action=me         — Token prüfen
POST   /api/auth.php?action=logout     — Token löschen

GET    /api/chickens.php               — Alle Hühner
GET    /api/chickens.php?id=1          — Ein Huhn
POST   /api/chickens.php               — Huhn anlegen
PUT    /api/chickens.php?id=1          — Huhn bearbeiten
DELETE /api/chickens.php?id=1          — Huhn löschen

GET    /api/eggs.php                   — Alle Eier
GET    /api/eggs.php?chickenId=1       — Eier eines Huhns
POST   /api/eggs.php                   — Ei anlegen
DELETE /api/eggs.php?id=1              — Ei löschen

POST   /api/upload.php                 — Foto hochladen (multipart/form-data)
```

## Lokale Entwicklung
```bash
npm install
npm run dev            # http://localhost:5173/chickinn/
```

Für lokale API-Entwicklung kann ein PHP-Server gestartet werden:
```bash
cd api && php -S localhost:8080
```

## Wichtige Designentscheidungen
- **PHP/MySQL statt Firebase**: Läuft auf eigenem IONOS-Server, keine Cloud-Abhängigkeit, Fotos auf Disk
- **Tailwind v4**: Import via `@import "tailwindcss"` in CSS
- **Lucide Icons**: SVG-Icons statt Emojis (ui-ux-pro-max Regel)
- **Token-Auth statt Sessions**: Einfach, stateless, kein Cookie-Handling
- **Foto-Komprimierung**: Client-seitig auf 800px max + JPEG 80% Qualität
- **userId-basierte Isolation**: Jeder Nutzer sieht nur seine eigenen Daten
- **Timestamps als number**: Einfacher zu sortieren/filtern
- **Kein Redux**: React Context reicht für Auth; Daten kommen direkt aus Hooks
- **iPhone 13 Mini als Primär-Gerät**: 375px Breakpoint, min 44px Touch-Targets
