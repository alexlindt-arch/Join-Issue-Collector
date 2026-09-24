# Join – Issue Collector

Kanban-Board „Join“ (Vanilla JS + Firebase Realtime Database), erweitert um einen **KI-gestützten Issue Collector mit n8n**:
Stakeholder schicken Feature Requests und Bug-Meldungen per E-Mail, n8n analysiert die Mail per KI und legt automatisch ein
Ticket in der **Triage**-Spalte an.

Demo nutzen
-----------
1. **Stakeholder**: Startseite `index.html` → „Create request“. Die Landing Page erklärt den Ablauf und nennt die
   E-Mail-Adresse. „Create Email Request“ öffnet eine vorbereitete Mail.
2. Innerhalb von ca. 1 Minute liest n8n die Mail, die KI bestimmt Kategorie, Titel, Priorität und Deadline, und das Ticket
   erscheint in der Triage-Spalte. Der Absender bekommt eine Bestätigungsmail.
3. **Team**: Startseite → „Member login“ (oder Gast-Login) → Board. Im Task-Detail steht der Ersteller mit dem Badge
   **Extern** (per E-Mail) oder **Intern** (im Board angelegt).
4. Wird ein Ticket in eine andere Spalte gezogen, bekommt der Ersteller automatisch eine E-Mail.
5. Tageslimit: max. **10 Tickets pro Tag** per E-Mail (Kostenairbag für die KI). Der Zähler steht auf der Landing Page;
   ist das Limit erreicht, zeigt sie den Limit-Hinweis, und n8n antwortet auf weitere Mails mit einem Hinweis statt ein
   Ticket anzulegen.

Features
--------
- **Triage-Spalte** als Standard-Backlog: alle neuen Tasks (manuell im Board / auf „Add Task“ und per E-Mail) landen dort;
  „Accept to To do“ im Task-Detail.
- **Ersteller** an jedem Task (`creator: { name, email, type: 'internal' | 'external' }`), sichtbar im Task-Detail.
- **Status-Benachrichtigung**: Das Board meldet Spaltenwechsel an einen n8n-Webhook, n8n mailt dem Ersteller.
- **Stakeholder-Landing-Page** (`html/request.html`): semantisches HTML5, Schriftgrößen ≥ 16 px, Limit-Anzeige.
- **Summary**: Kachel „Email requests“ zeigt die Anzahl offener Tickets in der Triage.
- **Kontakt-Avatare**: Foto-Upload (200 px, Base64) statt Initialen – kein Firebase Storage nötig.

n8n (Ordner [n8n/](n8n))
------------------------
| Workflow | Datei | Aufgabe |
| --- | --- | --- |
| Join Issue Collector | [n8n/join-issue-collector.json](n8n/join-issue-collector.json) | Gmail-Postfach abrufen → Tageslimit prüfen → KI-Analyse (Basic LLM Chain + Structured Output Parser) → Ticket in Firebase anlegen → Antwortmail → Mail in Ordner **erledigt** bzw. bei Fehler/Limit **zu bearbeiten** verschieben |
| Join Status Notifier | [n8n/join-status-notifier.json](n8n/join-status-notifier.json) | Webhook `POST /webhook/join-status-change` mit `{ taskId }` → Task + Ersteller aus Firebase lesen → Mail an den Ersteller (nur einmal pro neuer Spalte, `lastNotifiedStatus`) |
| Join Error Notifier | [n8n/join-error-notifier.json](n8n/join-error-notifier.json) | Error Trigger: schlägt einer der beiden Workflows fehl, geht eine Mail mit Workflow, Node und Fehlermeldung ans Anfrage-Postfach (Betreff `[Join Error] …`, wird vom Collector ignoriert) |

- Die Code-Nodes liegen mit JSDoc als eigene Dateien in [n8n/src/](n8n/src); `node n8n/build.js` baut daraus die
  Workflow-JSONs.
- Priorität: Schlüsselwörter in der Mail („dringend“, „asap“, „kritisch“ → urgent; „nicht dringend“, „nice to have“ → low),
  sonst der KI-Vorschlag. Deadline: KI-Wert, gegengeprüft mit Datumsangaben im Text.
- Jede KI-Beschreibung endet mit „🤖 Dieses Ticket wurde KI-generiert.“
- Tageszähler: Firebase `issueCollector/daily/<YYYY-MM-DD>` (Zeitzone Europe/Berlin).
- Fehler-Logging: Kann eine Mail nicht in ein Ticket umgewandelt werden, schickt der Collector zusätzlich einen
  Fehlerbericht (Schritt + Fehlermeldung) ans Anfrage-Postfach; die Mail landet im Ordner **zu bearbeiten**.
- Gast-Login: Gäste sehen neben den Demo-Tasks auch die echten E-Mail-Tickets aus Firebase (Board und Summary).

### Einrichtung
1. Eigenes Gmail-Postfach für Anfragen anlegen und darin die Labels **erledigt** und **zu bearbeiten** erstellen.
2. In n8n alle drei JSON-Dateien importieren (oder die bereits angelegten Workflows öffnen).
3. Credentials in n8n auswählen: **Gmail OAuth2** (alle Gmail-Nodes) und ein **OpenAI-kompatibles** Modell
   (Node „AI Chat Model“, Modell `gemma4:31b` über Ollama Cloud – austauschbar).
4. Collector und Status Notifier veröffentlichen/aktivieren und in deren Einstellungen den Join Error Notifier als
   Error Workflow wählen.
5. In [js/config.js](js/config.js) `JOIN_REQUEST_EMAIL` auf die Postfach-Adresse setzen; `JOIN_STATUS_WEBHOOK_URL`
   zeigt auf den Webhook des Status Notifiers.

**Keine Zugangsdaten im Repository:** Die Exporte enthalten keine Credentials; `.env`, Schlüssel und der
`N8N_ENCRYPTION_KEY` sind per [.gitignore](.gitignore) ausgeschlossen.

Konfiguration
-------------
Alle Einstellungen stehen zentral in [js/config.js](js/config.js): `JOIN_DB_URL`, `JOIN_REQUEST_EMAIL`,
`JOIN_STATUS_WEBHOOK_URL`, `JOIN_DAILY_REQUEST_LIMIT`.

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

