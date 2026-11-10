# Parser tests

Run `node parser-smoke-test.js` from this directory. The smoke test reads `../apps-script/VoiceParser.gs`, extracts the pure `parseFoodReaction_` function and runs synthetic examples. It does not call Google APIs, create forms, or use personal data.

A passing smoke test confirms only the specified examples, not general NLP accuracy or the form's deployed behavior.
