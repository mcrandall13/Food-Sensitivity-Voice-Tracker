/**
 * Voice-to-prefilled-Google-Form web app.
 * Adapted from a working project; user-specific identifiers have been removed.
 * A GET query string with ?voice=... exposes transcription text in URLs / browser history.
 * This example does not submit or save responses automatically.
 * Do not publish your deployment link or health data. Review permissions carefully.
 */
function doGet(e) {
  const voice = String((e && e.parameter && e.parameter.voice) || '').trim().slice(0, 3000);
  if (!voice) return HtmlService.createHtmlOutput('<p>No voice description received.</p>');

  try {
    const formId = PropertiesService.getScriptProperties().getProperty('FOOD_TRACKER_FORM_ID');
    if (!formId) throw new Error('Run setupFoodReactionTracker first.');
    const form = FormApp.openById(formId);
    const extracted = parseFoodReaction_(voice);
    const prefill = form.createResponse();
    const byTitle = {};
    form.getItems().forEach(item => { byTitle[item.getTitle()] = item; });

    // Preserve original dictated content when extraction is incomplete.
    addAnswer_(prefill, byTitle, 'Voice notes / details', voice);
    addAnswer_(prefill, byTitle, 'Entry type', extracted.type);
    addAnswer_(prefill, byTitle, 'Food / meal / suspected ingredient', extracted.food);
    addAnswer_(prefill, byTitle, 'Brand / product name (if known)', extracted.brand);
    addAnswer_(prefill, byTitle, 'When eaten or exposed?', extracted.consumedAt);
    addAnswer_(prefill, byTitle, 'Quantity consumed (number or estimate)', extracted.quantity);
    addAnswer_(prefill, byTitle, 'Quantity unit', extracted.unit);
    addAnswer_(prefill, byTitle, 'Symptoms (select all present)', extracted.symptoms);
    addAnswer_(prefill, byTitle, 'Overall symptom severity', extracted.severity);
    addAnswer_(prefill, byTitle, 'Time from eating to first symptoms', extracted.onset);

    const url = prefill.toPrefilledUrl();
    const safeUrl = url.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    return HtmlService.createHtmlOutput(
      '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<body style="font:17px Arial,sans-serif;max-width:560px;margin:36px auto;padding:0 20px">' +
      '<h2>Food Reaction Tracker</h2>' +
      '<p>Please review the extracted values before submitting.</p>' +
      '<p><a href="' + safeUrl + '" target="_top">Review pre-filled Google Form</a></p>' +
      '<p>Nothing has been submitted yet.</p></body></html>'
    );
  } catch (err) {
    console.error('Form preparation failed: ' + err.message);
    return HtmlService.createHtmlOutput('<p>Could not prepare the form. Check your configuration and deployment permissions.</p>');
  }
}

function addAnswer_(response, items, title, value) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return;
  const item = items[title];
  if (!item) return; // Allows small changes to the form without breaking the parser.
  switch (item.getType()) {
    case FormApp.ItemType.TEXT:
      response.withItemResponse(item.asTextItem().createResponse(String(value)));
      break;
    case FormApp.ItemType.PARAGRAPH_TEXT:
      response.withItemResponse(item.asParagraphTextItem().createResponse(String(value)));
      break;
    case FormApp.ItemType.LIST:
      if (item.asListItem().getChoices().some(c => c.getValue() === value))
        response.withItemResponse(item.asListItem().createResponse(value));
      break;
    case FormApp.ItemType.MULTIPLE_CHOICE:
      if (item.asMultipleChoiceItem().getChoices().some(c => c.getValue() === value))
        response.withItemResponse(item.asMultipleChoiceItem().createResponse(value));
      break;
    case FormApp.ItemType.CHECKBOX:
      const choices = item.asCheckboxItem().getChoices().map(c => c.getValue());
      const selected = value.filter(v => choices.indexOf(v) !== -1);
      if (selected.length) response.withItemResponse(item.asCheckboxItem().createResponse(selected));
      break;
  }
}

function parseFoodReaction_(description) {
  const t = description.replace(/[\u2019]/g, "'").replace(/\s+/g, ' ').trim();
  const l = t.toLowerCase();
  const out = {type:'',food:'',brand:'',consumedAt:'',quantity:'',unit:'',symptoms:[],severity:'',onset:''};

  // Word-to-number conversion only for simple count/portion phrases.
  const numbers = {a:'1',an:'1',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',half:'0.5',quarter:'0.25'};
  const unitRules = [
    [/^(?:each|eggs?|cookies?|crackers?|pieces?|items?)\b/i, 'each'],
    [/^each\b/i, 'each'],
    [/^teaspoons?\b|^tsp\b/i, 'teaspoon (tsp)'],
    [/^tablespoons?\b|^tbsp\b/i, 'tablespoon (tbsp)'],
    [/^cups?\b/i, 'cup'],
    [/^fluid ounces?\b|^fl\.?\s*oz\b/i, 'fluid ounce (fl oz)'],
    [/^millilit(?:er|re)s?\b|^ml\b/i, 'milliliter (mL)'],
    [/^grams?\b|^g\b/i, 'gram (g)'],
    [/^ounces?\b|^oz\b/i, 'ounce (oz)'],
    [/^slices?\b/i, 'slice'],
    [/^pieces?\b/i, 'piece'],
    [/^servings?\b/i, 'serving'],
    [/^bites?\b|^tastes?\b/i, 'bite / taste']
  ];
  const symptomRules = [
    ['Headache', /\bheadaches?|migraine\b/i],
    ['Gas', /\b(?:gas|gassy|flatulence)\b/i],
    ['Bloating', /\b(?:bloat(?:ed|ing)?|distension)\b/i],
    ['Delayed stomachache', /\b(?:stomach\s*ache|stomachache|abdominal pain|belly ache|cramps?)\b/i],
    ['Brain fog', /\bbrain\s*fog|foggy\s*(?:head|brain)\b/i],
    ['Inattention', /\b(?:inattention|trouble focusing|difficulty concentrating|can't focus|cannot focus)\b/i],
    ['Emotional distress', /\b(?:emotional distress|anxiety|irritable|irritability|upset emotionally)\b/i]
  ];
  const negated = /\b(?:no symptoms?|no reaction|without symptoms?|felt fine|tolerated)\b/i.test(t);
  out.symptoms = negated ? ['None'] : symptomRules.filter(([,re]) => re.test(t)).map(([name]) => name);
  if (/\b(?:no reaction|tolerated|felt fine|no symptoms?)\b/i.test(l)) out.type='Tolerated food';
  else if (out.symptoms.length) out.type='Reaction';
  else if (/\b(?:symptoms? update|still have|still experiencing)\b/i.test(l)) out.type='Symptom update';
  else out.type='Meal / exposure';

  // Eat/exposure clause only; don't mistake severity or onset times for a meal.
  const eat = t.match(/\b(?:i\s+)?(?:ate|had|consumed|drank|eaten|eating)\s+([^.!?;]+)/i);
  // Intentionally conservative: if the beginning is not a recognizable eating phrase,
  // leave food blank rather than infer it from a sentence about symptoms.
  if (eat) {
    let phrase = eat[1].replace(/\s+and\s+(?:then\s+)?(?:developed|felt|noticed|experienced|got)\b.*$/i, '')
      .replace(/\s+(?:at|around)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?.*$/i, '')
      .replace(/\s+(?:this morning|yesterday|today|last night)\b.*$/i,'')
      .replace(/\s+(?:three|two|one|four|five|six|seven|eight|nine|ten|\d+)\s+(?:minutes?|hours?|days?)\s+later\b.*$/i,'').trim();
    const match = phrase.match(/^(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|half|quarter)\s+(.+)$/i);
    if (match) {
      out.quantity = numbers[match[1].toLowerCase()] || match[1];
      let rest = match[2].trim();
      // Count foods default to 'each' but explicit unit words take precedence.
      const explicit = unitRules.slice(1).find(([re]) => re.test(rest));
      if (explicit) {
        out.unit = explicit[1];
        rest = rest.replace(explicit[0], '').replace(/^\s*(?:of\s+)?/i,'').trim();
      } else if (/\b(?:eggs?|cookies?|crackers?|bananas?|apples?|muffins?)\b/i.test(rest)) {
        out.unit = 'each';
      }
      phrase = rest;
    }
    out.food = phrase.replace(/\s*,?\s*(?:and then|then)\s*$/i,'').trim();
    // Brand only when explicitly introduced; avoid inferring brand from product names.
    const brand = t.match(/\b(?:brand|made by|from the brand)\s+([\w &'-]{2,40})(?:[.,;]|$)/i);
    if (brand) out.brand = brand[1].trim();
  }

  // Date/time is preserved as spoken wording to avoid guessing calendar dates.
  const consumed = t.match(/\b(?:ate|had|consumed|drank|eaten|eating)\b[^.!?;]{0,110}?\b(?:at|around)\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)(?:\b|[.,])/i);
  if (consumed) out.consumedAt = consumed[1].trim();
  const consumedWithDate = t.match(/\b(?:ate|had|consumed|drank)\b[^.!?;]{0,120}\b(yesterday|today|this morning|last night)\b/i);
  if (consumedWithDate) out.consumedAt = (consumedWithDate[1] + ' ' + out.consumedAt).trim();

  // Only fill overall severity when there is an explicit severity adjective.
  if (out.symptoms.length && out.symptoms[0] === 'None') out.severity = '0 — None';
  else if (/\b(?:severe|very bad|intense)\b/i.test(t)) out.severity = '3 — Severe';
  else if (/\b(?:moderate|medium)\b/i.test(t)) out.severity = '2 — Moderate';
  else if (/\b(?:mild|slight|minor)\b/i.test(t)) out.severity = '1 — Mild';

  // Explicit delay, if stated. Clock-time arithmetic is intentionally not guessed.
  const delay = t.match(/\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|half)\s*(minutes?|hours?|days?)\s*(?:later|after(?:ward| eating| the meal)?|from eating)\b/i);
  if (out.symptoms[0] === 'None') out.onset='No symptoms';
  else if (delay) {
    const n = Number(numbers[delay[1].toLowerCase()] || delay[1]);
    const u = delay[2].toLowerCase();
    const mins = /day/.test(u) ? n*1440 : /hour/.test(u) ? n*60 : n;
    if (mins < 30) out.onset='Under 30 minutes';
    else if (mins < 120) out.onset='30 minutes–2 hours';
    else if (mins <= 360) out.onset='2–6 hours';
    else if (mins <= 720) out.onset='6–12 hours';
    else if (mins <= 1440) out.onset='12–24 hours';
    else out.onset='Over 24 hours';
  }
  return out;
}

/** Local parser test (does not access Google Forms). */
function testVoiceParser() {
  const sample = 'I ate two scrambled eggs at 8:30 this morning. Three hours later I developed moderate bloating and a mild headache.';
  Logger.log(JSON.stringify(parseFoodReaction_(sample), null, 2));
}

/** Connection test with a populated field; does not submit a response. */
function testDirectFormConnection() {
  const formId = PropertiesService.getScriptProperties().getProperty('FOOD_TRACKER_FORM_ID');
  if (!formId) throw new Error('Form ID is not configured.');
  const form = FormApp.openById(formId);
  Logger.log('Form items: ' + form.getItems().length);
  const notes = form.getItems().find(i => i.getTitle() === 'Voice notes / details');
  if (!notes) throw new Error('Voice notes field not found.');
  const response = form.createResponse();
  response.withItemResponse(notes.asParagraphTextItem().createResponse('Synthetic connection test'));
  Logger.log('Prefilled URL generated: ' + Boolean(response.toPrefilledUrl()));
}
