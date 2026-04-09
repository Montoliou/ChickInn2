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

---

## Offen

### v1.4 — Medikation + Mauser
- [ ] Medikation erfassen: Name, Start/Ende, Notizen
  - Schema existiert (`medications` Tabelle), Frontend fehlt
  - Tab "Medikation" in ChickenDetail.tsx zeigt aktuell nur Placeholder
  - **Dateien**: neues `api/medications.php`, `src/pages/ChickenDetail.tsx` (Medikation-Tab)

- [ ] Mauser-Perioden erfassen: Start/Ende, Notizen
  - Schema existiert (`moult_periods` Tabelle), Frontend fehlt
  - **Dateien**: neues `api/moult.php`, ggf. eigener Tab oder in Gesundheit integrieren

### v1.5 — UX Polish
- [ ] Loading Skeletons statt leere Screens
- [ ] Toast/Snackbar für Aktions-Feedback ("Ei erfasst", "Gespeichert")
- [ ] Swipe-to-delete auf Listeneinträgen
- [ ] Pull-to-Refresh Geste
- [ ] Offline-Caching (Service Worker)

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
