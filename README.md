# Blouse Stitching Assistant – Phase 1 MVP

Status: customer/order, design combinations, measurements with validation, fabric tips, a **draft** pattern engine, progress tracking and Google Sheets saving. Phase 2 (AI image analysis) and Phase 3 (validated princess/katori rules, fitting assistant) are not built yet.

## Try it now (demo mode)
Open `index.html` in a browser. Data stays in that browser (localStorage).

## Connect Google Sheets
1. Create a Google Sheet and copy its ID from the URL (`/d/<ID>/edit`).
2. In the sheet: Extensions > Apps Script. Paste `Code.gs`.
3. Project Settings > Script properties: add `SPREADSHEET_ID` = your ID.
4. Run `setup` once and approve permissions. This creates the sheets and headers.
5. Deploy > New deployment > Web app. Execute as: **Me**. Access: **Anyone with the link** (use a hard-to-guess URL; add a shared token check before real customer use).
6. Copy the Web App URL into `config.js` as `BACKEND_URL`.
7. Test: save an order from the Progress step, then check the Orders sheet. Saving the same Order ID again updates the row.

## Phase 2: AI setup (Groq)
1. Script properties: `AI_API_KEY` (Groq key), `APP_TOKEN` (any long random string), optional `AI_MODEL` (default `meta-llama/llama-4-scout-17b-16e-instruct`, a vision model).
2. Put the same string in `config.js` as `TOKEN`. On a public GitHub repo this is visible to anyone, so it only stops casual misuse.
3. Run `setup` again (adds 2 sheets) and approve the Drive permission.
4. Deploy > Manage deployments > Edit > New version > Deploy (the URL stays the same).
5. Test: Design step > upload a photo > Analyse photos.

## Troubleshooting
- "Unknown action" or HTML response: redeploy a new version after editing `Code.gs`.
- CORS errors: the app posts as `text/plain` on purpose; do not add custom headers.
- Nothing saved: confirm `SPREADSHEET_ID` and that `setup` ran.

## Safety notes
Pattern rules in `patternEngine.js` are unapproved drafts. A master tailor must review them, then set `approved:true`. Always make a trial blouse for complex designs.
