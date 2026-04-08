# ChickInn Web – Claude Code Kontext

## Was ist das?
Eine mobile-first Web-PWA zum Verwalten von Hühnern und deren Eierproduktion. Sie ersetzt eine native iOS-App (Swift/CoreData) durch eine React-Webapp mit Firebase-Backend, die auf allen Geräten läuft und ohne App-Store-Konto installiert werden kann.

## Tech-Stack
- **React 19 + Vite + TypeScript** – Bundler und Framework
- **Tailwind CSS v4** (via `@tailwindcss/vite`) – Styling, mobile-first
- **Firebase** – Firestore (Datenbank), Auth (Google Login), Storage (Fotos geplant)
- **React Router v6** – Client-seitiges Routing
- **Recharts** – Bar-Chart auf der Reports-Seite
- **PWA** – manifest.json + viewport-fit=cover für iPhone-Homescreen

## Verzeichnisstruktur
```
src/
  firebase.ts          # Firebase App Init (Werte aus .env)
  types.ts             # Shared TypeScript Interfaces
  context/
    AuthContext.tsx    # Google Login, onAuthStateChanged, useAuth() hook
  hooks/
    useChickens.ts     # Firestore CRUD für Hühner (realtime onSnapshot)
    useEggs.ts         # Firestore CRUD für Eier (optional gefiltert nach chickenId)
  components/
    Layout.tsx         # Outlet + BottomNav Wrapper
    BottomNav.tsx      # Fixed bottom navigation, 4 Tabs
    LoginPage.tsx      # Google-Login Screen
  pages/
    Dashboard.tsx      # Stats-Grid + Quick Egg Log + Recent Eggs
    ChickensPage.tsx   # Hühner-Liste + Inline Add-Form
    ChickenDetail.tsx  # Tab-View: Eier / Mauser / Medikation
    ReportsPage.tsx    # BarChart (Recharts) + Pro-Huhn-Auswertung
    SettingsPage.tsx   # Konto-Info, Logout, PWA-Hinweis
```

## Datenmodell (Firestore Collections)

### `chickens/{id}`
```ts
{ id, userId, name, notes?, photoUrl?, createdAt: number }
```

### `eggs/{id}`
```ts
{ id, chickenId, userId, laidAt: number, notes? }
```

### `moultPeriods/{id}` (noch nicht implementiert)
```ts
{ id, chickenId, userId, startDate: number, endDate?: number, notes? }
```

### `medications/{id}` (noch nicht implementiert)
```ts
{ id, chickenId, userId, name, startDate: number, endDate: number, notes? }
```

Alle Timestamps sind **Unix milliseconds** (Date.now()). Alle Queries filtern per `where('userId', '==', user.uid)`.

## Firestore Security Rules (noch einzurichten!)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Environment Variables
Kopiere `.env.example` zu `.env` und fülle die Werte aus Firebase Console aus:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Lokale Entwicklung
```bash
cp .env.example .env   # Firebase-Config eintragen
npm install
npm run dev            # http://localhost:5173
```

## Was NOCH FEHLT (Roadmap)

### Dringend vor erstem echten Einsatz
1. **Firebase Projekt anlegen** – console.firebase.google.com → `.env` befüllen
2. **Firestore Security Rules** setzen (oben dokumentiert)
3. **Google Auth aktivieren** in Firebase → Authentication → Google
4. **PWA Icons** (`/public/icon-192.png`, `/public/icon-512.png`) erstellen (512×512px Hühner-Icon)

### Feature-Backlog (Version 1.1)
- [ ] Foto-Upload für Hühner (Firebase Storage)
- [ ] Mauser-Perioden erfassen in ChickenDetail
- [ ] Medikation erfassen in ChickenDetail
- [ ] Hühner bearbeiten (Name/Notiz/Foto ändern)
- [ ] Ei manuell mit Datum erfassen (nicht nur "jetzt")
- [ ] Offline-Support (Firestore persistence aktivieren)

### Feature-Backlog (Version 1.2)
- [ ] Mehrere Nutzer teilen eine Farm (shared userId / subcollections)
- [ ] Push-Notifications (kein Ei seit 3 Tagen)
- [ ] CSV-Export
- [ ] Dark Mode

## Wichtige Designentscheidungen
- **Tailwind v4**: Import via `@import "tailwindcss"` in CSS, kein separates config-File nötig
- **Firestore realtime**: Alle Hooks nutzen `onSnapshot` – Daten aktualisieren sich live
- **userId-basierte Isolation**: Jeder Nutzer sieht nur seine eigenen Daten
- **Timestamps als number**: Einfacher zu sortieren/filtern als Firestore Timestamps
- **Kein Vuex/Redux**: React Context reicht für Auth; Daten kommen direkt aus Hooks
