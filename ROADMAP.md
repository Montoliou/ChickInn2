# ChickInn Web – Roadmap

## ✅ Version 1.0 (gebaut)
- [x] React + Vite + TypeScript + Tailwind v4 Projekt-Setup
- [x] Firebase Integration (Firestore + Auth + Storage-Vorbereitung)
- [x] Google Login (AuthContext, LoginPage)
- [x] Geschützte Routen (nur für eingeloggte Nutzer)
- [x] Bottom Navigation (mobil-optimiert, 4 Tabs)
- [x] PWA Manifest + viewport-fit für iPhone Homescreen
- [x] Dashboard: Stats-Grid (Heute/Woche/Monat/Jahr) + Quick Egg Log
- [x] Hühner-Liste: Anlegen, Anzeigen, Löschen
- [x] Hühner-Detail: Tab-View mit Eier-Liste + Löschen
- [x] Reports: Balken-Chart letzte 12 Wochen + Pro-Huhn-Auswertung
- [x] Einstellungen: Konto-Info, Logout, PWA-Hinweis

## 🔜 Version 1.1 – Core vervollständigen
- [ ] Foto-Upload für Hühner (Firebase Storage, resize vor Upload)
- [ ] Mauser-Perioden: Anlegen, Anzeigen, Löschen in ChickenDetail
- [ ] Medikation: Anlegen, Anzeigen, Löschen in ChickenDetail
- [ ] Hühner bearbeiten (Name, Notiz, Foto)
- [ ] Ei mit manuellem Datum eintragen
- [ ] Bestätigungs-Dialog (nativer, nicht `confirm()`)
- [ ] Firestore Security Rules deployen

## 🔜 Version 1.2 – UX & Offline
- [ ] Firestore offline persistence (`enableIndexedDbPersistence`)
- [ ] Loading Skeletons statt Leer-States
- [ ] Pull-to-Refresh Geste
- [ ] Toast/Snackbar für Aktions-Feedback (z.B. "Ei erfasst ✓")
- [ ] Eingabe-Validierung mit Fehlermeldungen
- [ ] Swipe-to-delete auf Listeneinträgen

## 🔮 Version 2.0 – Sharing & Notifications
- [ ] Mehrere Nutzer teilen einen Hof (Farm-Konzept mit Einladungslink)
- [ ] Web Push Notifications ("kein Ei seit 3 Tagen")
- [ ] CSV/Excel Export
- [ ] Dark Mode (Tailwind `dark:` classes)
- [ ] Internationale Übersetzung (i18n)

## Deployment-Optionen
| Option | Kosten | Empfehlung |
|--------|--------|------------|
| Firebase Hosting | Kostenlos (Spark) | ✅ Einfachste Option, gleiche Firebase-Konsole |
| Vercel | Kostenlos | ✅ Sehr gut für Vite-Apps |
| Netlify | Kostenlos | ✅ Alternativ zu Vercel |

### Firebase Hosting deployen:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # dist, SPA: yes
npm run build
firebase deploy
```
