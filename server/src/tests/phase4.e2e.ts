import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
let accessToken = '';
let refreshToken = '';

const pass = (n: number, msg: string) => console.log(`✅ Test ${n} PASSED — ${msg}`);
const fail = (n: number, msg: string) => console.log(`❌ Test ${n} FAILED — ${msg}`);

const request = async (
  method: string,
  path: string,
  body?: object,
  token?: string
) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  return { status: res.status, data };
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const run = async () => {
  console.log('\n🚀 PulseOps Phase 5 Fixes — E2E Test Suite\n');

  // ─── SETUP ────────────────────────────────────────────
  const ts = Date.now();
  const testEmail = `phase5_${ts}@pulseops.dev`;

  const regRes = await request('POST', '/api/auth/register', {
    name: 'Phase5 Tester',
    email: testEmail,
    password: 'SecurePass123',
    role: 'admin',
  });
  accessToken = regRes.data.accessToken;
  refreshToken = regRes.data.refreshToken;
  console.log('🔐 Auth setup complete\n');

  // ═══════════════════════════════════════════════════════
  // FIX 1 — JWT 1 HOUR
  // ═══════════════════════════════════════════════════════
  console.log('─── Fix 1: JWT 1 Hour ───\n');

  // Test 1 — Access token is valid JWT with 1h expiry
  try {
    const parts = accessToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const expiresIn = payload.exp - payload.iat;
    expiresIn === 3600
      ? pass(1, `JWT expiry is exactly 1 hour (${expiresIn}s)`)
      : fail(1, `Expected 3600s got ${expiresIn}s`);
  } catch (e) { fail(1, String(e)); }

  // Test 2 — Access token works for authenticated requests
  try {
    const { status } = await request('GET', '/api/incidents', undefined, accessToken);
    status === 200
      ? pass(2, 'Access token valid for authenticated requests')
      : fail(2, `Expected 200 got ${status}`);
  } catch (e) { fail(2, String(e)); }

  // ═══════════════════════════════════════════════════════
  // FIX 2 — REFRESH TOKEN ROTATION
  // ═══════════════════════════════════════════════════════
  console.log('\n─── Fix 2: Refresh Token Rotation ───\n');

  // Test 3 — Refresh returns new access AND refresh token
  try {
    const { status, data } = await request('POST', '/api/auth/refresh', { refreshToken });
    status === 200 && data.accessToken && data.refreshToken
      ? pass(3, 'Refresh returns both new access and refresh tokens')
      : fail(3, `Expected both tokens — got ${JSON.stringify(data)}`);

    // Store new tokens
    const newRefreshToken = data.refreshToken;
    const newAccessToken = data.accessToken;

    // Test 4 — New refresh token is different from old one
    newRefreshToken !== refreshToken
      ? pass(4, 'New refresh token is different from old one — rotation confirmed')
      : fail(4, 'Refresh token was NOT rotated — same token returned');

    // Test 5 — Old refresh token is now invalid
    const { status: oldStatus } = await request('POST', '/api/auth/refresh', { refreshToken });
    oldStatus === 401
      ? pass(5, 'Old refresh token rejected after rotation — 401 returned')
      : fail(5, `Expected 401 got ${oldStatus} — old token still works`);

    // Test 6 — New refresh token works
    const { status: newStatus, data: newData } = await request(
      'POST', '/api/auth/refresh',
      { refreshToken: newRefreshToken }
    );
    newStatus === 200 && newData.accessToken
      ? pass(6, 'New refresh token works correctly')
      : fail(6, `New refresh token failed — ${JSON.stringify(newData)}`);

    // Update tokens for remaining tests
    accessToken = newData.accessToken;
    refreshToken = newData.refreshToken;
  } catch (e) {
    fail(3, String(e));
  }

  // ═══════════════════════════════════════════════════════
  // FIX 3 — SOFT DELETE ON SERVICES
  // ═══════════════════════════════════════════════════════
  console.log('\n─── Fix 3: Soft Delete on Services ───\n');

  const softDeleteId = `svc-soft-${ts}`;

  // Test 7 — Register service
  try {
    const { status, data } = await request('POST', '/api/services', {
      serviceId: softDeleteId,
      name: 'Soft Delete Test Service',
      environment: 'production',
      version: '1.0.0',
    });
    status === 201 && data.success
      ? pass(7, `Service registered — ${data.data.name}`)
      : fail(7, `Register failed — ${JSON.stringify(data)}`);
  } catch (e) { fail(7, String(e)); }

  // Test 8 — Soft delete sets isDeleted true
  try {
    const { status, data } = await request(
      'DELETE', `/api/services/${softDeleteId}`,
      undefined, accessToken
    );
    status === 200 && data.success
      ? pass(8, 'Soft delete successful — service marked as deleted')
      : fail(8, `Soft delete failed — ${JSON.stringify(data)}`);
  } catch (e) { fail(8, String(e)); }

  // Test 9 — Deleted service not returned in list
  try {
    const { data } = await request('GET', '/api/services', undefined, accessToken);
    const found = data.data?.find((s: any) => s.serviceId === softDeleteId);
    !found
      ? pass(9, 'Deleted service not returned in list')
      : fail(9, 'Deleted service still appearing in list');
  } catch (e) { fail(9, String(e)); }

  // Test 10 — Deleted service not returned by ID
  try {
    const { status } = await request(
      'GET', `/api/services/${softDeleteId}`,
      undefined, accessToken
    );
    status === 404
      ? pass(10, 'Deleted service returns 404 on get by ID')
      : fail(10, `Expected 404 got ${status}`);
  } catch (e) { fail(10, String(e)); }

  // Test 11 — Re-registering deleted service restores it
  try {
    const { status, data } = await request('POST', '/api/services', {
      serviceId: softDeleteId,
      name: 'Restored Service',
      environment: 'staging',
      version: '2.0.0',
    });
    status === 201 && data.data.isDeleted === false
      ? pass(11, 'Re-registering deleted service restores it — isDeleted: false')
      : fail(11, `Restore failed — ${JSON.stringify(data)}`);
  } catch (e) { fail(11, String(e)); }

  // Test 12 — Restored service appears in list again
  try {
    const { data } = await request('GET', '/api/services', undefined, accessToken);
    const found = data.data?.find((s: any) => s.serviceId === softDeleteId);
    found
      ? pass(12, 'Restored service appears in list again')
      : fail(12, 'Restored service not in list');
  } catch (e) { fail(12, String(e)); }

  // Test 13 — Deleting already deleted service returns 404
  try {
    await request('DELETE', `/api/services/${softDeleteId}`, undefined, accessToken);
    const { status } = await request(
      'DELETE', `/api/services/${softDeleteId}`,
      undefined, accessToken
    );
    status === 404
      ? pass(13, 'Deleting already deleted service returns 404')
      : fail(13, `Expected 404 got ${status}`);
  } catch (e) { fail(13, String(e)); }

  // ═══════════════════════════════════════════════════════
  // FIX 4 — PAGINATION ON INCIDENTS
  // ═══════════════════════════════════════════════════════
  console.log('\n─── Fix 4: Pagination on Incidents ───\n');

  // Test 14 — Pagination fields present in response
  try {
    const { status, data } = await request(
      'GET', '/api/incidents?page=1&limit=5',
      undefined, accessToken
    );
    const hasPagination =
      data.pagination?.totalCount !== undefined &&
      data.pagination?.totalPages !== undefined &&
      data.pagination?.currentPage !== undefined &&
      data.pagination?.hasNextPage !== undefined &&
      data.pagination?.hasPrevPage !== undefined;

    status === 200 && hasPagination
      ? pass(14, `Pagination fields present — total: ${data.pagination.totalCount}, pages: ${data.pagination.totalPages}`)
      : fail(14, `Pagination fields missing — ${JSON.stringify(data.pagination)}`);
  } catch (e) { fail(14, String(e)); }

  // Test 15 — Page 1 has no previous page
  try {
    const { data } = await request(
      'GET', '/api/incidents?page=1&limit=5',
      undefined, accessToken
    );
    data.pagination?.hasPrevPage === false && data.pagination?.currentPage === 1
      ? pass(15, 'Page 1 has hasPrevPage: false')
      : fail(15, `Expected hasPrevPage false — got ${data.pagination?.hasPrevPage}`);
  } catch (e) { fail(15, String(e)); }

  // Test 16 — Limit is respected
  try {
    const { data } = await request(
      'GET', '/api/incidents?page=1&limit=3',
      undefined, accessToken
    );
    data.count <= 3
      ? pass(16, `Limit respected — got ${data.count} incidents with limit 3`)
      : fail(16, `Expected max 3 — got ${data.count}`);
  } catch (e) { fail(16, String(e)); }

  // Test 17 — Page 2 has hasPrevPage true
  try {
    const { data } = await request(
      'GET', '/api/incidents?page=2&limit=3',
      undefined, accessToken
    );
    data.pagination?.hasPrevPage === true
      ? pass(17, 'Page 2 has hasPrevPage: true')
      : fail(17, `Expected hasPrevPage true — got ${data.pagination?.hasPrevPage}`);
  } catch (e) { fail(17, String(e)); }

  // Test 18 — Limit capped at 100
  try {
    const { data } = await request(
      'GET', '/api/incidents?page=1&limit=999',
      undefined, accessToken
    );
    data.pagination?.limit <= 100
      ? pass(18, `Limit capped at 100 — got limit: ${data.pagination?.limit}`)
      : fail(18, `Expected limit <= 100 — got ${data.pagination?.limit}`);
  } catch (e) { fail(18, String(e)); }

  // Test 19 — Invalid page defaults to 1
  try {
    const { data } = await request(
      'GET', '/api/incidents?page=-5&limit=5',
      undefined, accessToken
    );
    data.pagination?.currentPage === 1
      ? pass(19, 'Invalid page defaults to 1')
      : fail(19, `Expected page 1 — got ${data.pagination?.currentPage}`);
  } catch (e) { fail(19, String(e)); }

  // ═══════════════════════════════════════════════════════
  // FIX 5 — WEBSOCKET JWT AUTH
  // ═══════════════════════════════════════════════════════
  console.log('\n─── Fix 5: WebSocket JWT Auth ───\n');

  // Test 20 — WS connection without token rejected
  try {
    const { WebSocket } = await import('ws');
    await new Promise<void>((resolve) => {
      const ws = new WebSocket('ws://localhost:3000');
      const timeout = setTimeout(() => {
        ws.close();
        fail(20, 'Connection not rejected — timeout');
        resolve();
      }, 3000);

      ws.on('close', (code) => {
        clearTimeout(timeout);
        code === 1008
          ? pass(20, 'Unauthenticated WS connection rejected with code 1008')
          : fail(20, `Expected close code 1008 got ${code}`);
        resolve();
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        pass(20, 'Unauthenticated WS connection rejected');
        resolve();
      });
    });
  } catch (e) { fail(20, String(e)); }

  // Test 21 — WS connection with invalid token rejected
  try {
    const { WebSocket } = await import('ws');
    await new Promise<void>((resolve) => {
      const ws = new WebSocket('ws://localhost:3000?token=invalid.token.here');
      const timeout = setTimeout(() => {
        ws.close();
        fail(21, 'Invalid token not rejected — timeout');
        resolve();
      }, 3000);

      ws.on('close', (code) => {
        clearTimeout(timeout);
        code === 1008
          ? pass(21, 'Invalid token rejected with code 1008')
          : fail(21, `Expected 1008 got ${code}`);
        resolve();
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        pass(21, 'Invalid token WS connection rejected');
        resolve();
      });
    });
  } catch (e) { fail(21, String(e)); }

  // Test 22 — WS connection with valid token accepted
  try {
    const { WebSocket } = await import('ws');
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://localhost:3000?token=${accessToken}`);
      const timeout = setTimeout(() => {
        ws.close();
        fail(22, 'Valid token connection timed out');
        resolve();
      }, 5000);

      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'connected') {
          clearTimeout(timeout);
          pass(22, `Authenticated WS connection accepted — userId: ${msg.data.userId}`);
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        fail(22, `WS error — ${err.message}`);
        resolve();
      });
    });
  } catch (e) { fail(22, String(e)); }

  // Test 23 — WS receives metrics:update within 10 seconds
  try {
    const { WebSocket } = await import('ws');
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://localhost:3000?token=${accessToken}`);
      const timeout = setTimeout(() => {
        ws.close();
        fail(23, 'Did not receive metrics:update within 10 seconds');
        resolve();
      }, 10000);

      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'metrics:update') {
          clearTimeout(timeout);
          pass(23, `metrics:update received — ${msg.data.services?.length} services`);
          ws.close();
          resolve();
        }
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        fail(23, 'WS error during metrics:update test');
        resolve();
      });
    });
  } catch (e) { fail(23, String(e)); }

  // Test 24 — WS receives agent:step when incident created
  try {
    const { WebSocket } = await import('ws');
    const agentServiceId = `svc-agent-ws-${Date.now()}`;

    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://localhost:3000?token=${accessToken}`);
      const timeout = setTimeout(() => {
        ws.close();
        fail(24, 'Did not receive agent:step within 30 seconds');
        resolve();
      }, 30000);

      ws.on('open', async () => {
        await sleep(300);
        await request('POST', '/api/metrics', {
          serviceId: agentServiceId,
          serviceName: 'agent-ws-service',
          metrics: { cpu: 95, memory: 97, latency: 3500, errorRate: 12 },
          metadata: { host: 'host-1', region: 'us-east-1', version: '1.0.0' },
        });
      });

      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'agent:step') {
          clearTimeout(timeout);
          pass(24, `agent:step received — tool: ${msg.data.tool} status: ${msg.data.status}`);
          ws.close();
          resolve();
        }
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        fail(24, 'WS error during agent:step test');
        resolve();
      });
    });
  } catch (e) { fail(24, String(e)); }

  // Test 25 — WS receives agent:complete
  try {
    const { WebSocket } = await import('ws');
    const agentServiceId2 = `svc-agent-complete-${Date.now()}`;

    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://localhost:3000?token=${accessToken}`);
      const timeout = setTimeout(() => {
        ws.close();
        fail(25, 'Did not receive agent:complete within 120 seconds');
        resolve();
      }, 120000);

      ws.on('open', async () => {
        await sleep(300);
        await request('POST', '/api/metrics', {
          serviceId: agentServiceId2,
          serviceName: 'agent-complete-service',
          metrics: { cpu: 95, memory: 97, latency: 3500, errorRate: 12 },
          metadata: { host: 'host-1', region: 'us-east-1', version: '1.0.0' },
        });
      });

      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'agent:complete') {
          clearTimeout(timeout);
          pass(25, `agent:complete received — confidence: ${(msg.data.confidence * 100).toFixed(0)}%`);
          ws.close();
          resolve();
        }
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        fail(25, 'WS error during agent:complete test');
        resolve();
      });
    });
  } catch (e) { fail(25, String(e)); }

  // ═══════════════════════════════════════════════════════
  // FIX 6 — FATAL LOG LEVEL
  // ═══════════════════════════════════════════════════════
  console.log('\n─── Fix 6: Fatal Log Level ───\n');

  // Test 26 — Ingest fatal log
  try {
    const { status, data } = await request('POST', '/api/logs', {
      serviceId: `svc-fatal-${ts}`,
      serviceName: 'fatal-test-service',
      level: 'fatal',
      message: 'System crash — out of memory',
      stackTrace: 'Error: ENOMEM at process.exit',
    });
    status === 201 && data.success
      ? pass(26, 'Fatal log ingested successfully')
      : fail(26, `Fatal log failed — ${JSON.stringify(data)}`);
  } catch (e) { fail(26, String(e)); }

  // Test 27 — Query fatal logs
  try {
    const { status, data } = await request(
      'GET', `/api/logs/svc-fatal-${ts}?level=fatal`,
      undefined, accessToken
    );
    status === 200 && data.count > 0 && data.data[0].level === 'fatal'
      ? pass(27, `Fatal logs queryable — found ${data.count} fatal log(s)`)
      : fail(27, `Fatal log query failed — ${JSON.stringify(data)}`);
  } catch (e) { fail(27, String(e)); }

  // Test 28 — Invalid log level still rejected
  try {
    const { status } = await request('POST', '/api/logs', {
      serviceId: `svc-fatal-${ts}`,
      serviceName: 'fatal-test-service',
      level: 'critical',
      message: 'This should fail',
    });
    status !== 201
      ? pass(28, 'Invalid log level critical rejected')
      : fail(28, 'Expected rejection for invalid level critical');
  } catch (e) { fail(28, String(e)); }

  console.log('\n✅ Phase 5 Fixes E2E Test Suite Complete\n');
  process.exit(0);
};

run();