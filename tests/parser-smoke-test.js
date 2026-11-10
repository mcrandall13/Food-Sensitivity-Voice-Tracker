const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const file = fs.readFileSync(__dirname + '/../apps-script/VoiceParser.gs', 'utf8');
const begin = file.indexOf('function parseFoodReaction_(');
const end = file.indexOf('/** Local parser test', begin);
assert(begin >= 0 && end > begin, 'Parser function missing');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(file.substring(begin, end) + '\nthis.parse = parseFoodReaction_;', ctx);
const cases = [
 {text:'I ate two scrambled eggs at 8:30 this morning. Three hours later I developed moderate bloating and a mild headache.', food:'scrambled eggs', quantity:'2', unit:'each', type:'Reaction'},
 {text:'I ate one tablespoon of yogurt at 7 AM. Two hours later I had mild gas.', food:'yogurt', quantity:'1', unit:'tablespoon (tbsp)', type:'Reaction'},
 {text:'I ate two crackers at 9 AM. I felt fine and had no symptoms.', food:'crackers', quantity:'2', unit:'each', type:'Tolerated food'},
 {text:'Testing two eggs', food:'', quantity:'', unit:'', type:'Meal / exposure'}
];
for (const t of cases) {
 const o=ctx.parse(t.text);
 for(const field of ['food','quantity','unit','type']) assert.strictEqual(o[field],t[field],`${field}: ${t.text}`);
}
console.log('PASS: ' + cases.length + ' synthetic parser cases');
