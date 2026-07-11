# ChickInn Web – Roadmap

## Abgeschlossen

### v1.0 — Grundgerüst
- [x] React 19 + Vite + TypeScript + Tailwind v4 Setup
- [x] PHP/MySQL Backend auf IONOS (statt Firebase)
- [x] Token-basierte Auth (Login, Register, Logout)
- [x] Bottom Navigation (4 Tabs: Dashboard, Hühner, Reports, Settings)
- [x] PWA Manifest + viewport-fit=cover für iPhone-Homescreen
- [x] Dashboard: Stats-Grid (Heute/Woche/Monat/Jahr) + Quick Egg Log + Letzte Eier
- [x] Hühner-Liste: Anlegen, Anzeigen
- [x] Hühner-Detail: Tab-View (Eier / Gesundheit / Medikation)
- [x] Reports: BarChart (letzte 12 Wochen) + Pro-Huhn-Auswertung
- [x] Einstellungen: Konto-Info, Logout, PWA-Hinweis
- [x] SFTP Deploy-Script (`deploy.py` mit paramiko)

### v1.1 — Core Features
- [x] Foto-Upload für Hühner (Client-side Resize 800px, JPEG 80%)
- [x] Hühner bearbeiten (Name, Rasse, Notizen, Foto)
- [x] Hühner löschen mit Bestätigungsdialog
- [x] Ei mit Datum + Anzahl eintragen (Modal mit DatePicker)
- [x] Ei-Anzahl direkt tippbar (nicht nur +/- Buttons)
- [x] Eier löschen mit Inline-Confirm (Trash-Icon + Ja/Nein)
- [x] Ei-Referenzfoto pro Huhn (wie sieht das Ei aus? Hilft bei Zuordnung)
- [x] Password-Reset per E-Mail (6-stelliger Code)
- [x] PWA Install-Prompt

### v1.2 — Farm-Sharing + Lifecycle
- [x] Farm erstellen (mit auto-generiertem Invite-Code)
- [x] Farm beitreten per Code
- [x] Farm-Mitglieder anzeigen (Owner/Member Rollen)
- [x] Admin-Rechte übertragen
- [x] Mitglied entfernen (Owner only)
- [x] Farm verlassen / auflösen
- [x] Invite-Code nur für Owner sichtbar
- [x] Bestehende Hühner/Eier werden beim Erstellen/Beitreten in die Farm migriert
- [x] Schlüpfdatum (hatched_at) + Todestag (died_at) pro Huhn
- [x] Ahnengalerie: Tote Hühner ausgegraut + separiert angezeigt
- [x] Tote Hühner aus Dashboard Quick-Log + Ei-Erfassung ausgeschlossen
- [x] CSV-Import: Hühner + historische Eier mit Zeitraum-Verteilung
- [x] Gesundheits-Checks (8 tägliche Checkboxen + 30-Tage-Verlauf)

---

### v1.3 — Farm-Leave Refactor + Gesundheit v2
- [x] **Farm-Leave: Daten bleiben in Farm**
  - Beim Verlassen bleiben Hühner/Eier in der Farm
  - Farm bleibt unter ihrem Invite-Code bestehen, User kann per Code wieder beitreten
  - Nur der alleinige Owner bekommt beim Auflösen seine Daten zurück

- [x] **Gesundheitsscreen: Nur Abweichungen erfassen**
  - 12 Symptom-Chips statt 8 täglicher "alles OK"-Checkboxen
  - Nur antippen wenn etwas nicht stimmt, Freitext-Notiz
  - Verlauf zeigt nur Tage mit gemeldeten Auffälligkeiten

### v1.4 — Medikation + Mauser
- [x] **Medikation vollständig erfasst**
  - CRUD für Medikation: Name, Start/Ende, Notizen
  - Laufende Behandlungen ohne Enddatum möglich (`Läuft`)
  - Eigener Backend-Endpoint `api/medications.php`
  - Medikation-Tab in `ChickenDetail.tsx` zeigt Liste + Add/Edit/Delete

- [x] **Mauser im Gesundheitsscreen integriert**
  - CRUD für Mauser-Perioden: Start/Ende, Notizen
  - Laufende Mauser ohne Enddatum möglich (`Läuft`)
  - Eigener Backend-Endpoint `api/moult.php`
  - UI bewusst in Gesundheit integriert, nicht als vierter Tab

- [x] **Farm-Sharing für Medikation + Mauser nachgezogen**
  - `medications` und `moult_periods` haben jetzt `farm_id`
  - Farm create/join/leave migriert diese Daten analog zu Hühnern/Eiern
  - Migration deployt und auf Produktion ausgeführt

### v1.5 — UX Polish
- [x] **Loading Skeletons statt leere Screens**
  - `Skeleton`, `StatCardSkeleton`, `ListRowSkeleton` in `src/components/Skeleton.tsx`
  - Integriert in Dashboard (Stats + letzte Eier) und Hühner-Liste
- [x] **Toast/Snackbar für Aktions-Feedback**
  - `ToastProvider` Context mit `success`/`error`/`info` + Auto-Hide nach 2.8 s
  - Bottom-Stack über `safe-area-inset-bottom`, `slideUp` Animation
  - Verwendet in Dashboard, ChickensPage, ChickenDetail und SettingsPage (ersetzt alle `alert()`)
- [x] **Swipe-to-delete auf Listeneinträgen**
  - `SwipeableRow` (Touch-basiert, Richtungs-Lock, 60 px Threshold / 88 px Reveal)
  - Aktiv in ChickenDetail (Eier-Liste) mit Toast-Feedback beim Löschen
- [x] **Pull-to-Refresh Geste**
  - `PullToRefresh` wrapper, nur bei `window.scrollY === 0`, 70 px Threshold, 110 px Max
  - Layout umgebaut (Body-Scroll statt `overflow-y-auto` im `<main>`)
  - Integriert in Dashboard + ChickensPage
- [x] **Offline-Caching (Service Worker)**
  - `vite-plugin-pwa` mit `autoUpdate` + Workbox
  - Precache für JS/CSS/HTML/Icons, NetworkFirst für `/api/`, CacheFirst für `/uploads/`
  - `navigateFallback` auf `/chickinn/index.html` für SPA Offline-Start

- [x] **PWA Home-Screen Icon**
  - Eigenes Icon-Set (512/192/180 PNG) via `scripts/generate-icons.mjs` (Canvas)
  - "CHICK INN EST 2014" Holzschild-Motiv in cremefarbenem Maskable-Safe-Zone-Layout
  - `favicon.svg` mit Chicken-Only-Silhouette als Browser-Icon

- [x] **Versionspflege**
  - `package.json` auf `1.5.0`
  - Dynamische Anzeige in Settings über `__APP_VERSION__` Vite define

### v1.5.1 — Steckbrief
- [x] Steckbrief-Card auf der Huhn-Detailseite (`ChickenDetail.tsx`)

### v1.6 — Ei-Erfassung + Detail-Feinschliff
- [x] Anfangs-Eierzahl beim Anlegen eines Huhns (v1.6.0)
- [x] Eier auch für tote Hühner erfassbar (v1.6.0)
- [x] Ei-Autor + Log-Timestamp in der Ei-Liste sichtbar (v1.6.1)
- [x] Dashboard-Quicklog erlaubt Eier auch für „gestern" (v1.6.2)
- [x] Kalender-Wochen/Monatsliste korrigiert, „letztes Ei"-Label, Hold-to-log (v1.6.3)
- [x] iOS-Image-Callout beim Halten unterdrückt + Ei-Sound (swell/womp) (v1.6.4)

### v1.7 — Statistik + Modal-Fixes
- [x] Pro-Huhn-Statistik-Tab in `ChickenDetail.tsx` (v1.7.0)
- [x] Modals zentriert über der Bottom-Nav, Action-Buttons bleiben tappbar/sichtbar (v1.7.1 / v1.7.2)

---

## Offen

### v2.0 — Erweitert
- [ ] CSV/Excel Export
- [ ] Web Push Notifications ("kein Ei seit 3 Tagen")
- [ ] Dark Mode (Tailwind `dark:` classes)
- [ ] Mehrsprachigkeit (i18n)

---

## Architektur-Hinweise für Agents

### Neues API-Endpoint erstellen
1. Neue PHP-Datei in `api/` anlegen (z.B. `medications.php`)
2. Immer mit `require_once __DIR__ . '/config.php';` starten
3. `$user = requireAuth($pdo);` für Auth
4. `$farmId = $user['farm_id'] ?? null;` für Farm-Filterung
5. Queries immer per `farm_id` ODER `user_id` filtern (nie beides weglassen)
6. Response immer über `jsonResponse($data, $statusCode)` senden
7. Input über `jsonInput()` (POST/PUT Body) oder `$_GET` (Query-Params)

### Neue Tabelle/Spalte hinzufügen
1. SQL in `api/migrate_fix.sql` schreiben (alten Inhalt ersetzen)
2. Auch `api/schema.sql` aktualisieren (als Referenz)
3. Nach Deploy: `https://montolio.de/chickinn/api/run_migration.php?key=chickinn2026migrate` aufrufen
4. TypeScript-Interface in `src/types.ts` aktualisieren

### Neues Frontend-Feature
1. Hooks in `src/hooks/` für API-Kommunikation
2. Seiten in `src/pages/`, Komponenten in `src/components/`
3. Icons nur aus `lucide-react`, keine Emojis als UI-Icons
4. Mobile-first: 375px Breakpoint, min 44px Touch-Targets
5. Tailwind v4 Syntax (kein `@apply`, CSS-Import via `@import "tailwindcss"`)
6. `npm run build` muss fehlerfrei sein (TypeScript strict, keine unused vars/imports)

### Deploy-Workflow
```bash
npm run build                # TypeScript-Check + Vite Build
python deploy.py             # SFTP Upload (Frontend + Backend)
# Ggf. Migration ausführen:  run_migration.php?key=chickinn2026migrate
git add . && git commit      # Immer committen nach Änderung
```

### Konventionen
- Branch: immer `chickinn-web`
- Sprache im UI: Deutsch
- Sprache im Code: Englisch (Variablen, Funktionen)
- Timestamps: Unix Millisekunden (`Date.now()`, MySQL `BIGINT`)
- Dates (Schlüpfdatum etc.): `YYYY-MM-DD` String, MySQL `DATE`
- API-Feld-Mapping: camelCase (Frontend) <-> snake_case (DB), Mapping in PHP
- Keine auto-Farm-Erstellung bei Registration
