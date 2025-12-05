const assert = require('assert');

// Wire globals expected by rule-optimizer
global.PatternMatcher = require('../pattern-matcher');
const RuleOptimizer = require('../rule-optimizer');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

// PatternMatcher tests
const PM = global.PatternMatcher;

test('wildcard matches prefix', () => {
  assert.strictEqual(PM.match('username', 'user*'), true);
  assert.strictEqual(PM.match('user', 'user*'), true);
  assert.strictEqual(PM.match('admin', 'user*'), false);
});

test('question-mark wildcard', () => {
  assert.strictEqual(PM.match('user1', 'user?'), true);
  assert.strictEqual(PM.match('user12', 'user?'), false);
});

test('regex match and invalid regex', () => {
  assert.strictEqual(PM.match('abc123', '\\d+', true), true);
  const originalError = console.error;
  console.error = () => {};
  assert.strictEqual(PM.match('abc', '[', true), false);
  console.error = originalError;
});

test('hasWildcards detects * and ?', () => {
  assert.strictEqual(PM.hasWildcards('user*'), true);
  assert.strictEqual(PM.hasWildcards('user?'), true);
  assert.strictEqual(PM.hasWildcards('user'), false);
});

// RuleOptimizer tests
const sampleRules = [
  { id: 'a', sitePattern: 'example.com', siteMatchType: 'host', fieldType: 'name', fieldPattern: 'email', fieldUseRegex: false, value: 'a@example.com', enabled: true },
  { id: 'b', sitePattern: 'www.example.com', siteMatchType: 'host', fieldType: 'name', fieldPattern: 'email', fieldUseRegex: false, value: 'a@example.com', enabled: true },
  { id: 'c', sitePattern: 'other.com', siteMatchType: 'host', fieldType: 'name', fieldPattern: 'email', fieldUseRegex: false, value: 'a@example.com', enabled: true },
  { id: 'd', sitePattern: 'third.com', siteMatchType: 'host', fieldType: 'name', fieldPattern: 'user_name', fieldUseRegex: false, value: 'bob', enabled: true },
  { id: 'dup', sitePattern: 'example.com', siteMatchType: 'host', fieldType: 'name', fieldPattern: 'email', fieldUseRegex: false, value: 'a@example.com', enabled: true },
];

test('duplicate detection finds exact duplicates', () => {
  const suggestions = RuleOptimizer.findDuplicates(sampleRules);
  assert(suggestions.some(s => s.type === 'duplicate'));
});

test('cross-site duplicate detection', () => {
  const suggestions = RuleOptimizer.findCrossSiteDuplicates(sampleRules);
  assert(suggestions.some(s => s.type === 'cross-site-duplicate'));
});

test('simplification suggests wildcard', () => {
  const suggestions = RuleOptimizer.findSimplificationOpportunities(sampleRules);
  assert(suggestions.some(s => s.type === 'simplify'));
});

test('report contains stats fields', () => {
  const report = RuleOptimizer.generateReport(sampleRules);
  assert(report.totalRules === sampleRules.length);
  assert(typeof report.criticalIssues === 'number');
});

if (process.exitCode && process.exitCode !== 0) {
  console.error('Some tests failed');
  process.exit(process.exitCode);
} else {
  console.log('All tests executed');
}
