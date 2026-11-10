/**
 * One-time setup. Creates a fresh Google Form and a linked Google Sheet.
 * All IDs stay in this user's Apps Script Properties and are NOT committed to GitHub.
 * Running again creates a second form and sheet; do so only intentionally.
 */
function setupFoodReactionTracker() {
  const ss = SpreadsheetApp.create('Food Reaction Tracker - Responses and Research');
  const form = FormApp.create('Food & Symptom Quick Log');
  form.setDescription('Use this form for meal exposures and reactions. Review voice-pre-filled values before submitting.');
  form.setConfirmationMessage('Saved. You may submit another entry.');
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  form.addMultipleChoiceItem().setTitle('Entry type')
    .setChoiceValues(['Reaction','Meal / exposure','Tolerated food','Symptom update']).setRequired(true);
  form.addTextItem().setTitle('Food / meal / suspected ingredient').setRequired(true);
  form.addTextItem().setTitle('Brand / product name (if known)');
  form.addTextItem().setTitle('When eaten or exposed?');
  form.addTextItem().setTitle('Quantity consumed (number or estimate)');
  form.addListItem().setTitle('Quantity unit')
    .setChoiceValues(['each','teaspoon (tsp)','tablespoon (tbsp)','cup','fluid ounce (fl oz)',
      'milliliter (mL)','gram (g)','ounce (oz)','slice','piece','serving','bite / taste','other / unknown']);
  form.addTextItem().setTitle('Estimated suspected ingredient amount (optional)');
  form.addCheckboxItem().setTitle('Symptoms (select all present)')
    .setChoiceValues(['None','Headache','Gas','Bloating','Delayed stomachache','Brain fog',
      'Inattention','Emotional distress','Other']);
  form.addMultipleChoiceItem().setTitle('Overall symptom severity')
    .setChoiceValues(['0 — None','1 — Mild','2 — Moderate','3 — Severe','Not sure']);
  form.addMultipleChoiceItem().setTitle('Time from eating to first symptoms')
    .setChoiceValues(['No symptoms','Under 30 minutes','30 minutes–2 hours','2–6 hours',
      '6–12 hours','12–24 hours','Over 24 hours','Unknown']);
  form.addParagraphTextItem().setTitle('Voice notes / details')
    .setHelpText('Original spoken description, symptoms, duration, or product details.');

  form.setDestination(FormApp.DestinationType.SPREADSHEET,ss.getId());
  const research = ss.getSheets()[0];
  research.setName('Ingredient Research');
  research.getRange(1,1,1,4).setValues([['Ingredient','Investigation status','Potential family','Notes']]);
  research.setFrozenRows(1);
  research.getRange('A1:D1').setFontWeight('bold').setBackground('#e8eaed');
  research.setColumnWidths(1,4,205);

  PropertiesService.getScriptProperties().setProperties({
    FOOD_TRACKER_FORM_ID:form.getId(),
    FOOD_TRACKER_SPREADSHEET_ID:ss.getId()
  });
  Logger.log('FORM EDITOR: ' + form.getEditUrl());
  Logger.log('RESPONDENT FORM: ' + form.getPublishedUrl());
  Logger.log('GOOGLE SHEET: ' + ss.getUrl());
}
