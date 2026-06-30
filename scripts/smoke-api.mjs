#!/usr/bin/env node
/**
 * SoftPoint API smoke test — run against local or production API.
 * Usage: node scripts/smoke-api.mjs [baseUrl]
 */
const base = (process.argv[2] || process.env.SOFTPOINT_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function get(path) {
  const res = await fetch(`${base}${path}`);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

function pass(label) {
  console.log(`✓ ${label}`);
}

function fail(label, detail) {
  console.error(`✗ ${label}`, detail ?? '');
  process.exitCode = 1;
}

console.log(`Smoke test → ${base}\n`);

const health = await get('/health');
if (health.ok && health.json.service === 'softpoint-api') {
  pass('GET /health');
} else {
  fail('GET /health', health);
}

const info = await get('/v1/paypoint/info');
if (info.ok && info.json.features?.includes('balance')) {
  pass('GET /v1/paypoint/info');
} else {
  fail('GET /v1/paypoint/info', info);
}

const balance = await get('/v1/paypoint/balance/U1');
if (balance.ok && balance.json.available) {
  pass(`GET /v1/paypoint/balance/U1 → ${balance.json.available} SP`);
} else {
  fail('GET /v1/paypoint/balance/U1', balance);
}

const products = await get('/v1/paypoint/credits/products');
if (products.ok && Array.isArray(products.json.items)) {
  pass(`GET /v1/paypoint/credits/products (${products.json.items.length} items)`);
} else {
  fail('GET /v1/paypoint/credits/products', products);
}

const market = await get('/v1/paypoint/market/listings');
if (market.ok && Array.isArray(market.json.items)) {
  pass(`GET /v1/paypoint/market/listings (${market.json.items.length} items)`);
} else {
  fail('GET /v1/paypoint/market/listings', market);
}

const activities = await get('/v1/paypoint/earn-activities');
if (activities.ok && Array.isArray(activities.json.items)) {
  pass('GET /v1/paypoint/earn-activities');
} else {
  fail('GET /v1/paypoint/earn-activities', activities);
}

const sandbox = await get('/v1/paypoint/partner/sandbox');
if (sandbox.ok && sandbox.json.sandbox === true) {
  pass('GET /v1/paypoint/partner/sandbox');
} else {
  fail('GET /v1/paypoint/partner/sandbox', sandbox);
}

const orderId = `SMOKE_${Date.now()}`;
const issue = await post('/v1/paypoint/issue', {
  user_id: 'U1',
  amount: '10',
  reason: 'smoke_test',
});
if (issue.ok || issue.status === 201) {
  pass('POST /v1/paypoint/issue');
} else {
  fail('POST /v1/paypoint/issue', issue);
}

console.log(process.exitCode ? '\nSome checks failed.' : '\nAll checks passed.');
