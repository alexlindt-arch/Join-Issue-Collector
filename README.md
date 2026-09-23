# Join – Issue Collector

Solo-Version von Join-groupe (Vanilla JS) mit eigener Firebase-Datenbank.

Neue Features
-------------
- **Issue Collector** (`html/request.html`): öffentliches Formular ohne Login für Feature Requests und Bug Reports, landet in der Triage-Spalte
- **Triage-Spalte** im Board mit Zähler und „Accept to To do“
- **Kontakt-Avatare**: Foto-Upload (200 px, Base64) statt Initialen – kein Firebase Storage / Blaze-Tarif nötig

Konfiguration
-------------
Die Datenbank-URL steht zentral in [js/config.js](js/config.js) (`JOIN_DB_URL`).

---


Kurzbeschreibung
-----------------
Join-groupe ist eine einfache, client-seitige Projekt-/Task-Board-Anwendung (HTML/CSS/Vanilla JS). Sie unterstützt angemeldete Nutzer über Firebase-REST-Endpunkte und einen Gastmodus mit Demo Daten die im Session-Storage gespeicherten Gästetasks kombiniert.

Wichtige Features
------------------
- Board mit Drag & Drop für Tasks
- Add-Task-Formular (separate Seite und Modal)
- Lokale Gästetasks werden im `sessionStorage` gehalten (keine Überschreibung der Datei-Tasks)
- Login/Registrierung mit clientseitiger Validierung und gezielter Anzeige von Hinweisen (z. B. erst nach Blur)

Voraussetzungen
--------------
- moderner Browser (Chrome/Firefox/Safari)
- Lokaler Static-Server empfohlen für Fetch-Zugriffe auf lokale JSON-Dateien

Daten & Gastmodus
------------------
- Gästetasks werden in `sessionStorage.guestTasks` als JSON-Array gespeichert.
- Beim Laden werden die Dateitasks und die Guest-Tasks zusammengeführt; bei ID-Konflikten gewinnt die lokale (`sessionStorage`) Task-Version.
- Neue Gästetasks bekommen eine ID = max(maxIdDatei, maxIdLocal) + 1, damit keine vorhandenen Aufgaben verschwinden.

Wichtige Dateien
----------------
- [index.html](index.html) — Welcome (Rollenwahl: Request oder Login)
- [login.html](login.html) — Login / Registrierung
- [html/board.html](html/board.html) — Board-View
- [js/board.js](js/board.js) — Board-Rendering, Drag & Drop, Merge-Logik
- [js/add_task.js](js/add_task.js) — Seite zum Erstellen von Tasks
- [js/add_task_board.js](js/add_task_board.js) — Modal-Task-Erstellung
- [js/summary.js](js/summary.js) — Zusammenfassung / Statistiken (merged guest + file tasks)
- [js/login.js](js/login.js) — Login / Registrierung UI-Logik


Mitwirkende
-----------
Rudolf Schultz, Alexander Lindt und Ben Bronner

