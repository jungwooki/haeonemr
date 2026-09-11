// Offline interaction guards: never access live services or patient data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let inputs = [];
const next = { disabled: false };
const hint = {};
const shell = {
  querySelectorAll: () => inputs,
  querySelector: selector => selector.includes('next-btn') ? next : hint
};
const context = vm.createContext({
  window: { addEventListener() {} },
  document: {
    documentElement: { style: { removeProperty() {}, setProperty() {} } },
    getElementById: id => id === 'pain-app-shell' ? shell : null
  }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/scripts/survey-ux.js'), 'utf8'), context);
const ux = vm.runInContext('SurveyUX', context);
assert.equal(ux.validBirth('2000-02-29'), true, 'Leap day should be accepted');
assert.equal(ux.validBirth('2001-02-29'), false, 'Nonexistent date must be rejected');
assert.equal(ux.validBirth('9999-01-01'), false, 'Future birth date must be rejected');
assert.equal(ux.validBirth(''), false);
assert.equal(ux.validBirth('2000-13-01'), false);
const input = (value, type = 'text', required = true) => ({
  value, type, required, validity: {}, dataset: {}, id: 'test',
  focus() { this.focused = true; }, scrollIntoView() { this.scrolled = true; }
});
inputs = [input('   '), input('2000-01-01', 'date')];
assert.equal(ux.canAdvance('pain-', 1), true, 'Intro should not require form fields');
assert.equal(ux.canAdvance('pain-', 2), false, 'Direct calls cannot bypass required fields');
assert.equal(next.disabled, true);
assert.equal(inputs[0].focused, true);
inputs = [input('테스트'), input('2000-02-29', 'date'), input('', 'number', false)];
assert.equal(ux.canAdvance('pain-', 2), true, 'Optional blank measurements must not block');
assert.equal(next.disabled, false);
inputs[2] = input('-1', 'number', false);
inputs[2].validity.rangeUnderflow = true;
assert.equal(ux.canAdvance('pain-', 2), false, 'Invalid measurement must block progression');
inputs[2] = input('-1', 'number', false); // Change in weight can legitimately be negative.
assert.equal(ux.canAdvance('pain-', 2), true);
console.log('Survey UX: date, required-field, optional-field and numeric guards passed');
