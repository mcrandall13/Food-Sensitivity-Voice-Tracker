# Food Sensitivity Voice Tracker

A reusable **iPhone Siri → Apple Shortcuts → Google Apps Script → Google Forms → Google Sheets** prototype for logging meal exposures and self-reported reactions.

> **Status:** working proof of concept, with rule-based parsing. Not an AI medical classifier, diagnostic tool, automatic submission service, or ingredient-scanning app.

## What it does

- Captures a short dictated description using iPhone Shortcuts
- Encodes the transcript in a web-app URL and processes it using Google Apps Script
- Extracts recognizable food, portion, unit, approximate time, symptom names, general severity, and delay when explicitly stated
- Builds a Google Forms **pre-filled** URL and presents a review link
- Keeps the **original dictated text** in `Voice notes / details`
- Saves to the connected Google Sheet **only when a user reviews and submits the form**

## Architecture

```text
iPhone Siri → Dictate Text → URL Encode → Replace VOICEENTRY in URL
       → Apps Script doGet(?voice=...) → rule-based parse → FormApp response
       → review-link page → Google Form (user reviews/submits) → Sheet
```

## Installation

1. Create a new project at [Google Apps Script](https://script.google.com/).
2. Copy `apps-script/FormSetup.gs` and `apps-script/VoiceParser.gs` into separate `.gs` files in the project.
3. Run **`setupFoodReactionTracker` once**, reviewing the Google authorization prompts. It creates a new Form and Sheet and stores their IDs privately in **Script Properties**. **Do not run it again** unless you actually want another set.
4. Run `testVoiceParser`, then `testDirectFormConnection` from the function dropdown.
5. Deploy as **Web app** executing as **Me** and with **Only myself** access where available. Test from Safari while signed into the correct Google account. Google authentication/redirect behavior can vary.
6. Record the web-app `/exec` URL **privately** and follow [iPhone Shortcut setup](shortcuts/iPhone-Shortcut-Setup.md). The Shortcut's Text action is `<WEB_APP_EXEC_URL>?voice=VOICEENTRY`.
7. Test using synthetic wording, check the review link, and verify the prefilled Form. Submit only deliberate entries.

If modifying an **existing** Google Form, do **not** run setup. Instead use Apps Script editor **Project Settings → Script properties** and set `FOOD_TRACKER_FORM_ID` to its editor ID. Form question titles and choice strings must match `VoiceParser.gs` or be mapped carefully.

## Speaking pattern

> “I ate **two** **crackers** at **9 AM**. **Two hours later** I had **mild bloating**.”

For better results, use: **I ate → quantity + unit + food → time → delay → symptom + severity**. The parser is intentionally conservative and may leave unfamiliar wording blank. Always inspect the Form before submission.

## Safety and privacy

**This prototype sends the dictated text in a URL query parameter (`?voice=`).** Such URLs may appear in browser history, synced devices, system logs, or screenshots. It is **not suitable for highly sensitive health details without a redesigned, authenticated transport**. Deploy only to your own account and do not post live form links, tokens, or responses publicly. A form with a public response link can accept submissions from anyone with access to it.

- Never commit real reaction logs, medical details, exact live URLs, or deployment identifiers
- No responses are saved by the parser; Google Forms saves only after a user taps Submit
- Apps Script permissions are broad; review the requested scopes before approving
- This tool records observations, not proof of causality or medical diagnoses
- Do not use for deliberate food challenges without clinician advice when severe reactions or allergies are possible

## Repository contents

- [`apps-script/FormSetup.gs`](apps-script/FormSetup.gs) — one-time form + workbook creation
- [`apps-script/VoiceParser.gs`](apps-script/VoiceParser.gs) — voice parsing and pre-fill web app
- [`shortcuts/iPhone-Shortcut-Setup.md`](shortcuts/iPhone-Shortcut-Setup.md) — six-action setup
- [`docs/Food_Reaction_Tracker_Workflow.docx`](docs/Food_Reaction_Tracker_Workflow.docx) — illustrated architecture and operating guide
- [`examples/synthetic_reactions.csv`](examples/synthetic_reactions.csv) — fabricated example data
- [`tests/parser-smoke-test.js`](tests/parser-smoke-test.js) — local synthetic parser checks

## Limitations and roadmap

**Implemented:** Siri dictation, basic food and dose extraction, a rule-based symptom parser, review page, Google Form prefill and linked spreadsheet.  
**Not implemented:** reliable extraction of multiple foods, general-purpose natural-language understanding, automatic Google Form submission, MyFitnessPal ingestion, barcode/ingredient analysis, secure POST transport, direct redirect that avoids the review page, and statistical dose-response modeling.

The next sensible improvement is to secure the transport and add better disambiguation and test coverage before expanding features.

## License

MIT — see [LICENSE](LICENSE).
