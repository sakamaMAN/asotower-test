#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesPath = path.join(__dirname, '..', 'src', 'engine', 'rules.js');
const rules = await import('file://' + rulesPath + '?v=' + Date.now());

const computeDamage = rules.computeDamage;

function makeUnit(job, atk, def, name='unit'){
  return { job, stats: { attack: atk, defense: def }, name };
}

function testCase(att, def){
  const dmg = computeDamage(att, def);
  console.log(`att=${att.job} atk=${att.stats.attack} def=${def.job} def=${def.stats.defense} => dmg=${dmg}`);
  return dmg;
}

let failed = 0;

console.log('Running computeDamage tests...');

// 1) High defense scenario
const a1 = makeUnit('soldier', 10, 5, 'attacker1');
const d1 = makeUnit('guardian', 50, 80, 'defender1');
let dmg = testCase(a1, d1);
if (dmg < 1) { console.error('FAIL: dmg < 1'); failed++; }

// 2) Equal stats
const a2 = makeUnit('soldier', 30, 20);
const d2 = makeUnit('lancer', 20, 20);
dmg = testCase(a2, d2);
if (dmg < 1) { console.error('FAIL: dmg < 1'); failed++; }

// 3) Very low attack
const a3 = makeUnit('scout', 1, 1);
const d3 = makeUnit('guardian', 100, 50);
dmg = testCase(a3, d3);
if (dmg < 1) { console.error('FAIL: dmg < 1'); failed++; }

// 4) Affinity checks (ensure multiplier applies if configured)
const a4 = makeUnit('assassin', 40, 10);
const d4 = makeUnit('lancer', 10, 10);
dmg = testCase(a4, d4);
if (dmg < 1) { console.error('FAIL: dmg < 1'); failed++; }

console.log(failed === 0 ? 'All tests passed' : `${failed} tests failed`);
process.exit(failed === 0 ? 0 : 2);
