import dotenv from 'dotenv';
dotenv.config();

const BASE = 'http://localhost:3000/api';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let passed = 0;
let failed = 0;
let adminToken = '';
let engineerToken = '';
let viewerToken = '';
let testServiceId = '';
let testIncidentId = '';
let testIncidentMongoId = '';

const ts = Date.now();

// ─── Helpers ──────────────────────────────────────────
const ok  = (name: string, msg = '') => { passed++; console.log(`  ✅ ${name} ${msg}`); };
const fail = (name: string, msg = '') => { failed++; console.error(`  ❌ ${name} ${msg}`); };

const req = async (
  method: string,
  path: string,
  body?: any,
  token?: string
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = {};
  try { data = await res.json(); } catch {}

  return { status: res.status, data };
};

const section = (title: string) => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(50));
};

// ─── AUTH TESTS ───────────────────────────────────────
const testAuth = async () => {
  section('AUTH TESTS');

  // Register admin
  let r = await req('POST', '/auth/register', {
    name: 'Test Admin',
    email: `admin_${ts}@test.com`,
    password: 'Admin@123!',
    role: 'admin',
  });
  r.status === 201 && r.data.success
    ? ok('Register admin')
    : fail('Register admin', JSON.stringify(r.data));
  adminToken = r.data.accessToken;

  // Register engineer
  r = await req('POST', '/auth/register', {
    name: 'Test Engineer',
    email: `eng_${ts}@test.com`,
    password: 'Engineer@123!',
    role: 'engineer',
  });
  r.status === 201 && r.data.success
    ? ok('Register engineer')
    : fail('Register engineer', JSON.stringify(r.data));
  engineerToken = r.data.accessToken;

  // Register viewer
  r = await req('POST', '/auth/register', {
    name: 'Test Viewer',
    email: `viewer_${ts}@test.com`,
    password: 'Viewer@123!',
    role: 'viewer',
  });
  r.status === 201 && r.data.success
    ? ok('Register viewer')
    : fail('Register viewer', JSON.stringify(r.data));
  viewerToken = r.data.accessToken;

  // Duplicate email
  r = await req('POST', '/auth/register', {
    name: 'Test Admin',
    email: `admin_${ts}@test.com`,
    password: 'Admin@123!',
    role: 'admin',
  });
  r.status === 409
    ? ok('Duplicate email → 409')
    : fail('Duplicate email → 409', `got ${r.status}`);

  // Missing fields
  r = await req('POST', '/auth/register', { email: 'x@x.com' });
  r.status === 400
    ? ok('Missing fields → 400')
    : fail('Missing fields → 400', `got ${r.status}`);

  // Weak password
  r = await req('POST', '/auth/register', {
    name: 'Test',
    email: `weak_${ts}@test.com`,
    password: 'weak',
    role: 'engineer',
  });
  r.status === 400 || r.status === 500
    ? ok('Weak password → error')
    : fail('Weak password → error', `got ${r.status}`);

  // Login valid
  r = await req('POST', '/auth/login', {
    email: `admin_${ts}@test.com`,
    password: 'Admin@123!',
  });
  r.status === 200 && r.data.accessToken
    ? ok('Login valid')
    : fail('Login valid', JSON.stringify(r.data));

  // Login wrong password
  r = await req('POST', '/auth/login', {
    email: `admin_${ts}@test.com`,
    password: 'WrongPass!',
  });
  r.status === 401
    ? ok('Login wrong password → 401')
    : fail('Login wrong password → 401', `got ${r.status}`);

  // Login wrong email
  r = await req('POST', '/auth/login', {
    email: 'nonexistent@test.com',
    password: 'Admin@123!',
  });
  r.status === 401 || r.status === 404
    ? ok('Login wrong email → 401/404')
    : fail('Login wrong email → 401/404', `got ${r.status}`);

  // Login missing fields
  r = await req('POST', '/auth/login', { email: 'x@x.com' });
  r.status === 400 || r.status === 401
    ? ok('Login missing password → error')
    : fail('Login missing password → error', `got ${r.status}`);

  // No token → 401
  r = await req('GET', '/services');
  r.status === 401
    ? ok('No token → 401')
    : fail('No token → 401', `got ${r.status}`);

  // Invalid token → 401
  r = await req('GET', '/services', undefined, 'invalidtoken123');
  r.status === 401
    ? ok('Invalid token → 401')
    : fail('Invalid token → 401', `got ${r.status}`);
};

// ─── SERVICES TESTS ───────────────────────────────────
const testServices = async () => {
  section('SERVICES TESTS');

  testServiceId = `svc-test-${ts}`;

  // Register service
  let r = await req('POST', '/services', {
    serviceId: testServiceId,
    name: 'Test Service',
    environment: 'production',
    version: '1.0.0',
    description: 'API test service',
  }, adminToken);
  r.status === 201 && r.data.success
    ? ok('Register service')
    : fail('Register service', JSON.stringify(r.data));

  // Duplicate serviceId
  r = await req('POST', '/services', {
    serviceId: testServiceId,
    name: 'Duplicate',
    environment: 'production',
    version: '1.0.0',
  }, adminToken);
  r.status === 409
    ? ok('Duplicate serviceId → 409')
    : fail('Duplicate serviceId → 409', `got ${r.status}`);

  // Missing serviceId
  r = await req('POST', '/services', {
    name: 'No ID Service',
    environment: 'production',
  }, adminToken);
  r.status === 400 || r.status === 500
    ? ok('Missing serviceId → error')
    : fail('Missing serviceId → error', `got ${r.status}`);

  // Get all services
  r = await req('GET', '/services', undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get all services')
    : fail('Get all services', JSON.stringify(r.data));

  // Get service by ID
  r = await req('GET', `/services/${testServiceId}`, undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get service by ID')
    : fail('Get service by ID', JSON.stringify(r.data));

  // Get non-existent service
  r = await req('GET', '/services/nonexistent-xyz', undefined, adminToken);
  r.status === 404
    ? ok('Non-existent service → 404')
    : fail('Non-existent service → 404', `got ${r.status}`);

  // Update status
  r = await req('PATCH', `/services/${testServiceId}/status`,
    { status: 'degraded' }, adminToken);
  r.status === 200 && r.data.data?.status === 'degraded'
    ? ok('Update service status → degraded')
    : fail('Update service status', JSON.stringify(r.data));

  // Update status back to healthy
  r = await req('PATCH', `/services/${testServiceId}/status`,
    { status: 'healthy' }, adminToken);
  r.status === 200 && r.data.data?.status === 'healthy'
    ? ok('Update service status → healthy')
    : fail('Update service status → healthy', JSON.stringify(r.data));

  // Invalid status
  r = await req('PATCH', `/services/${testServiceId}/status`,
    { status: 'invalid_status' }, adminToken);
  r.status === 400
    ? ok('Invalid status → 400')
    : fail('Invalid status → 400', `got ${r.status}`);

  // Engineer can view services
  r = await req('GET', '/services', undefined, engineerToken);
  r.status === 200
    ? ok('Engineer can view services')
    : fail('Engineer can view services', `got ${r.status}`);

  // Viewer can view services
  r = await req('GET', '/services', undefined, viewerToken);
  r.status === 200
    ? ok('Viewer can view services')
    : fail('Viewer can view services', `got ${r.status}`);
};

// ─── METRICS TESTS ────────────────────────────────────
const testMetrics = async () => {
  section('METRICS TESTS');

  // Push normal metric
  let r = await req('POST', '/metrics', {
    serviceId: testServiceId,
    serviceName: 'Test Service',
    metrics: { cpu: 30, memory: 40, latency: 100, errorRate: 0.5 },
    metadata: { host: 'host-1', region: 'us-east-1', version: '1.0.0' },
  });
  r.status === 201 && r.data.success
    ? ok('Push normal metric')
    : fail('Push normal metric', JSON.stringify(r.data));

  // Push high metric
  r = await req('POST', '/metrics', {
    serviceId: testServiceId,
    serviceName: 'Test Service',
    metrics: { cpu: 95, memory: 97, latency: 4000, errorRate: 20 },
    metadata: { host: 'host-1', region: 'us-east-1', version: '1.0.0' },
  });
  r.status === 201
    ? ok('Push high/anomalous metric')
    : fail('Push high metric', JSON.stringify(r.data));

  // Missing serviceId
  r = await req('POST', '/metrics', {
    metrics: { cpu: 30, memory: 40 },
  });
  r.status === 400
    ? ok('Missing serviceId → 400')
    : fail('Missing serviceId → 400', `got ${r.status}`);

  // Get latest metric
  await sleep(500);
  r = await req('GET', `/metrics/${testServiceId}/latest`, undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get latest metric')
    : fail('Get latest metric', JSON.stringify(r.data));

  // Get metrics history
  r = await req('GET', `/metrics/${testServiceId}?limit=10`, undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get metrics history')
    : fail('Get metrics history', JSON.stringify(r.data));
};

// ─── INCIDENTS TESTS ──────────────────────────────────
const testIncidents = async () => {
  section('INCIDENTS TESTS');

  // Get all incidents
  let r = await req('GET', '/incidents', undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get all incidents')
    : fail('Get all incidents', JSON.stringify(r.data));

  // Get incident stats
  r = await req('GET', '/incidents/stats?hoursBack=24', undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get incident stats')
    : fail('Get incident stats', JSON.stringify(r.data));

  // Filter by status
  r = await req('GET', '/incidents?status=open', undefined, adminToken);
  r.status === 200
    ? ok('Filter incidents by status')
    : fail('Filter by status', `got ${r.status}`);

  // Filter by severity
  r = await req('GET', '/incidents?severity=critical', undefined, adminToken);
  r.status === 200
    ? ok('Filter incidents by severity')
    : fail('Filter by severity', `got ${r.status}`);

  // Pagination
  r = await req('GET', '/incidents?page=1&limit=5', undefined, adminToken);
  r.status === 200 && r.data.pagination
    ? ok('Pagination works')
    : fail('Pagination', JSON.stringify(r.data));

  // Get non-existent incident
  r = await req('GET', '/incidents/nonexistentid123', undefined, adminToken);
  r.status === 400 || r.status === 404 || r.status === 500
    ? ok('Non-existent incident → error')
    : fail('Non-existent incident', `got ${r.status}`);

  // Get first incident for further tests
  r = await req('GET', '/incidents?status=open&limit=1', undefined, adminToken);
  if (r.data.data?.length > 0) {
    testIncidentMongoId = r.data.data[0]._id;
    testIncidentId = r.data.data[0].incidentId;
    ok(`Got test incident: ${testIncidentId}`);

    // Get by ID
    r = await req('GET', `/incidents/${testIncidentMongoId}`, undefined, adminToken);
    r.status === 200 && r.data.success
      ? ok('Get incident by ID')
      : fail('Get incident by ID', JSON.stringify(r.data));

    // Assign incident
    r = await req('PATCH', `/incidents/${testIncidentMongoId}/assign`,
      { assignedTo: `eng_${ts}@test.com` }, adminToken);
    r.status === 200 && r.data.data?.assignedTo
      ? ok('Assign incident')
      : fail('Assign incident', JSON.stringify(r.data));

    // Assign without assignedTo
    r = await req('PATCH', `/incidents/${testIncidentMongoId}/assign`,
      {}, adminToken);
    r.status === 400
      ? ok('Assign without assignedTo → 400')
      : fail('Assign without assignedTo → 400', `got ${r.status}`);

    // Resolve without rootCause
    r = await req('PATCH', `/incidents/${testIncidentMongoId}/resolve`,
      { notes: 'Fixed it' }, adminToken);
    r.status === 400
      ? ok('Resolve without rootCause → 400')
      : fail('Resolve without rootCause → 400', `got ${r.status}`);

    // Resolve with rootCause
    r = await req('PATCH', `/incidents/${testIncidentMongoId}/resolve`,
      { rootCause: 'Memory leak in payment service', notes: 'Restarted pods' },
      adminToken);
    r.status === 200 && r.data.data?.status === 'resolved'
      ? ok('Resolve incident')
      : fail('Resolve incident', JSON.stringify(r.data));

    // Close resolved incident
    r = await req('PATCH', `/incidents/${testIncidentMongoId}/close`,
      {}, adminToken);
    r.status === 200 && r.data.data?.status === 'closed'
      ? ok('Close incident')
      : fail('Close incident', JSON.stringify(r.data));

    // Close already closed incident
    r = await req('PATCH', `/incidents/${testIncidentMongoId}/close`,
      {}, adminToken);
    r.status === 400
      ? ok('Close already closed → 400')
      : fail('Close already closed → 400', `got ${r.status}`);

    // Viewer cannot resolve
    r = await req('GET', '/incidents?status=open&limit=1', undefined, adminToken);
    if (r.data.data?.length > 0) {
      const openId = r.data.data[0]._id;
      r = await req('PATCH', `/incidents/${openId}/resolve`,
        { rootCause: 'test' }, viewerToken);
      r.status === 403
        ? ok('Viewer cannot resolve → 403')
        : fail('Viewer cannot resolve → 403', `got ${r.status}`);
    }
  } else {
    console.log('  ⚠️  No open incidents found — push anomalous metrics first');
  }
};

// ─── LOGS TESTS ───────────────────────────────────────
const testLogs = async () => {
  section('LOGS TESTS');

  const levels = ['info', 'warn', 'error', 'debug', 'fatal'];

  for (const level of levels) {
    const r = await req('POST', '/logs', {
      serviceId: testServiceId,
      serviceName: 'Test Service',
      level,
      message: `Test ${level} log message`,
      metadata: { host: 'host-1' },
    });
    r.status === 201 && r.data.success
      ? ok(`Push ${level} log`)
      : fail(`Push ${level} log`, JSON.stringify(r.data));
    await sleep(100);
  }

  // Get logs
  let r = await req('GET', `/logs?serviceId=${testServiceId}`, undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get logs by serviceId')
    : fail('Get logs', JSON.stringify(r.data));

  // Filter by level
  r = await req('GET', `/logs?serviceId=${testServiceId}&level=error`, undefined, adminToken);
  r.status === 200
    ? ok('Filter logs by level')
    : fail('Filter logs by level', `got ${r.status}`);

  // Missing serviceId on push
  r = await req('POST', '/logs', { level: 'info', message: 'test' });
  r.status === 400
    ? ok('Missing serviceId → 400')
    : fail('Missing serviceId → 400', `got ${r.status}`);

  // Invalid log level
  r = await req('POST', '/logs', {
    serviceId: testServiceId,
    level: 'invalid',
    message: 'test',
  });
  r.status === 400 || r.status === 500
    ? ok('Invalid log level → error')
    : fail('Invalid log level → error', `got ${r.status}`);
};

// ─── DEPLOYMENTS TESTS ────────────────────────────────
const testDeployments = async () => {
  section('DEPLOYMENTS TESTS');

  // Create deployment
  let r = await req('POST', '/deployments', {
    serviceId: testServiceId,
    serviceName: 'Test Service',
    version: '2.0.0',
    environment: 'production',
    deployedBy: `admin_${ts}@test.com`,
    commitHash: 'abc123def456',
    branch: 'main',
    notes: 'API test deployment',
  }, adminToken);
  r.status === 201 && r.data.success
    ? ok('Create deployment')
    : fail('Create deployment', JSON.stringify(r.data));

  // Get all deployments
  r = await req('GET', '/deployments', undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get all deployments')
    : fail('Get all deployments', JSON.stringify(r.data));

  // Get by service
  r = await req('GET', `/deployments?serviceId=${testServiceId}`, undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Get deployments by serviceId')
    : fail('Get deployments by serviceId', JSON.stringify(r.data));

  // Missing fields
  r = await req('POST', '/deployments', {
    serviceId: testServiceId,
  }, adminToken);
  r.status === 400 || r.status === 500
    ? ok('Missing deployment fields → error')
    : fail('Missing deployment fields → error', `got ${r.status}`);

  // Viewer cannot create deployment
  r = await req('POST', '/deployments', {
    serviceId: testServiceId,
    serviceName: 'Test',
    version: '1.0.0',
    environment: 'production',
    deployedBy: 'viewer@test.com',
  }, viewerToken);
  r.status === 403
    ? ok('Viewer cannot create deployment → 403')
    : fail('Viewer cannot create deployment → 403', `got ${r.status}`);
};

// ─── NLQ TESTS ────────────────────────────────────────
const testNLQ = async () => {
  section('NLQ TESTS');

  const questions = [
    'How many incidents are open?',
    'Are there any critical incidents?',
    'What services are registered?',
    'Show me recent deployments',
    'How many fatal logs are there?',
  ];

  for (const question of questions) {
    const r = await req('POST', '/nlq/query',
      { question }, adminToken);
    r.status === 200 && r.data.success && r.data.data?.answer
      ? ok(`NLQ: "${question.substring(0, 40)}..."`)
      : fail(`NLQ: "${question}"`, JSON.stringify(r.data));
    await sleep(300);
  }

  // Empty question
  let r = await req('POST', '/nlq/query', { question: '' }, adminToken);
  r.status === 400
    ? ok('Empty question → 400')
    : fail('Empty question → 400', `got ${r.status}`);

  // No token
  r = await req('POST', '/nlq/query', { question: 'test' });
  r.status === 401
    ? ok('No token → 401')
    : fail('No token → 401', `got ${r.status}`);

  // Viewer can use NLQ
  r = await req('POST', '/nlq/query',
    { question: 'How many services?' }, viewerToken);
  r.status === 200
    ? ok('Viewer can use NLQ')
    : fail('Viewer can use NLQ', `got ${r.status}`);
};

// ─── DELETE SERVICE TEST ──────────────────────────────
const testDeleteService = async () => {
  section('DELETE SERVICE TESTS');

  // Viewer cannot delete
  let r = await req('DELETE', `/services/${testServiceId}`, undefined, viewerToken);
  r.status === 403
    ? ok('Viewer cannot delete → 403')
    : fail('Viewer cannot delete → 403', `got ${r.status}`);

  // Engineer cannot delete
  r = await req('DELETE', `/services/${testServiceId}`, undefined, engineerToken);
  r.status === 403
    ? ok('Engineer cannot delete → 403')
    : fail('Engineer cannot delete → 403', `got ${r.status}`);

  // Admin can delete
  r = await req('DELETE', `/services/${testServiceId}`, undefined, adminToken);
  r.status === 200 && r.data.success
    ? ok('Admin can delete service')
    : fail('Admin can delete service', JSON.stringify(r.data));

  // Delete already deleted
  r = await req('DELETE', `/services/${testServiceId}`, undefined, adminToken);
  r.status === 404
    ? ok('Delete already deleted → 404')
    : fail('Delete already deleted → 404', `got ${r.status}`);
};

// ─── MAIN ─────────────────────────────────────────────
const main = async () => {
  console.log('\n🚀 PulseOps — Full API Test Suite\n');
  console.log(`Base URL: ${BASE}`);
  console.log(`Timestamp: ${ts}\n`);

  try {
    await testAuth();
    await testServices();
    await testMetrics();
    await testIncidents();
    await testLogs();
    await testDeployments();
    await testNLQ();
    await testDeleteService();
  } catch (err) {
    console.error('\n💥 Unexpected error:', err);
  }

  // ─── Summary ────────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total:  ${passed + failed}`);
  console.log(`  Score:  ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('═'.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
};

main();
import fs from 'fs';

// At the end of main() replace the summary with:
const summary = {
  passed,
  failed,
  total: passed + failed,
  score: ((passed / (passed + failed)) * 100).toFixed(1) + '%',
};

// Write full results to file
fs.writeFileSync(
  'test-results.json',
  JSON.stringify({ summary, timestamp: new Date().toISOString() }, null, 2)
);

console.log(`\n${'═'.repeat(50)}`);
console.log('  TEST SUMMARY');
console.log('═'.repeat(50));
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  📊 Total:  ${passed + failed}`);
console.log(`  Score:    ${summary.score}`);
console.log('═'.repeat(50));
console.log('\n📄 Full results saved to: test-results.json\n');