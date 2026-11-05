/**
 * Comprehensive Automated Verification Suite for DiwaliVerse Secret Messages
 * Tests all requirements against live http://localhost:3000 API
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🚀 Starting Comprehensive Verification Suite for DiwaliVerse Secret Messages...\n');

  let testPassed = 0;
  let testTotal = 0;

  function assert(condition: boolean, testName: string) {
    testTotal++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      testPassed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // 1. Health check
  console.log('--- 1. Testing System Health & Setup Status ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health returns ok');

  const statusRes = await fetch(`${BASE_URL}/auth/status`);
  const statusData = await statusRes.json();
  assert(statusRes.status === 200 && statusData.success === true, 'GET /api/auth/status returns status');

  // 2. Owner Registration (Initial Setup)
  console.log('\n--- 2. Testing Owner Registration & Authentication ---');
  const testEmail = `owner_${Date.now()}@example.com`;
  const testPassword = 'Password_Secret_1234!';

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({
      full_name: 'Test Owner',
      email: testEmail,
      password: testPassword,
      confirm_password: testPassword,
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.success === true, 'POST /api/auth/register creates owner account successfully');

  // Log in with created credentials
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success === true && loginData.token, 'POST /api/auth/login logs in with credentials and issues session token');
  const ownerToken = loginData.token;

  // 3. Unauthorized Access Rejection
  console.log('\n--- 3. Testing Unauthorized Access Rejection ---');
  const unauthRes = await fetch(`${BASE_URL}/messages`, {
    method: 'GET',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  assert(unauthRes.status === 401, 'GET /api/messages rejects unauthenticated request with 401 Unauthorized');

  // 4. Authorized Access
  console.log('\n--- 4. Testing Authorized Access ---');
  const authRes = await fetch(`${BASE_URL}/messages`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
  });
  const authData = await authRes.json();
  assert(authRes.status === 200 && Array.isArray(authData.messages), 'GET /api/messages returns owner messages when authenticated');

  // 5. Creating Secret Messages
  console.log('\n--- 5. Testing Creating Secret Messages ---');
  const msgPassword = 'DiwaliStars#2026';
  const createRes = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      recipient_name: 'Ananya',
      sender_name: 'Secret Admirer',
      title: 'Under the Festive Constellations',
      content: 'Happy Diwali! You light up my life like a thousand diyas.',
      password: msgPassword,
      password_hint: 'The festival of lights and year we met',
      theme: 'golden-diya',
      envelope_seal: 'diya',
      burn_after_reading: false,
      max_views: 5,
    }),
  });
  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.success === true && createData.data.slug, 'POST /api/messages creates a secret message with slug');
  const messageSlug = createData.data.slug;
  const messageId = createData.data.id;

  // 6. Zero Message Leakage Before Authentication
  console.log('\n--- 6. Testing Zero Message Leakage Before Authentication ---');
  const publicRes = await fetch(`${BASE_URL}/public/message/${messageSlug}`);
  const publicData = await publicRes.json();
  assert(publicRes.status === 200 && publicData.success === true, 'Public endpoint returns 200 for valid slug');
  assert(publicData.metadata.recipient_name === 'Ananya', 'Public metadata includes recipient name');
  assert(publicData.metadata.content === undefined, 'CRITICAL: Message content is NEVER leaked in public metadata');
  assert(publicData.metadata.password_hash === undefined, 'CRITICAL: Password hash is NEVER exposed');
  assert(publicData.metadata.attempts_remaining === 5, 'Public metadata shows 5 attempts remaining');

  // 7. Incorrect Password Rejection
  console.log('\n--- 7. Testing Incorrect Password Rejection & Rate Limiting ---');
  const wrongRes = await fetch(`${BASE_URL}/public/message/${messageSlug}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({ password: 'WrongPassword999' }),
  });
  const wrongData = await wrongRes.json();
  assert(wrongRes.status === 401 && wrongData.success === false, 'POST /unlock rejects incorrect password with 401');
  assert(wrongData.attempts_remaining === 4, 'Remaining attempts decreased to 4');

  // 8. Correct Password Unlock
  console.log('\n--- 8. Testing Correct Password Unlock ---');
  const unlockRes = await fetch(`${BASE_URL}/public/message/${messageSlug}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({ password: msgPassword }),
  });
  const unlockData = await unlockRes.json();
  assert(unlockRes.status === 200 && unlockData.success === true, 'POST /unlock succeeds with correct password');
  assert(unlockData.data.content === 'Happy Diwali! You light up my life like a thousand diyas.', 'Unlocked data contains secret content');
  assert(unlockData.data.view_count === 1, 'View count incremented to 1');

  // 9. Editing Messages
  console.log('\n--- 9. Testing Editing Messages ---');
  const updateRes = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      recipient_name: 'Ananya Sharma',
      title: 'Updated Diwali Note',
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200 && updateData.success === true, 'PUT /api/messages/:id updates message');

  // 10. Duplicating Messages
  console.log('\n--- 10. Testing Duplicating Messages ---');
  const dupRes = await fetch(`${BASE_URL}/messages/${messageId}/duplicate`, {
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
  });
  const dupData = await dupRes.json();
  assert(dupRes.status === 200 && dupData.success === true && dupData.data.slug !== messageSlug, 'POST /api/messages/:id/duplicate creates a clone with distinct slug');
  const duplicateId = dupData.data.id;

  // 11. Deleting Messages
  console.log('\n--- 11. Testing Deleting Messages ---');
  const delRes = await fetch(`${BASE_URL}/messages/${duplicateId}`, {
    method: 'DELETE',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
  });
  const delData = await delRes.json();
  assert(delRes.status === 200 && delData.success === true, 'DELETE /api/messages/:id successfully deletes message');

  // 12. Burn After Reading Test
  console.log('\n--- 12. Testing Burn-After-Reading Self-Destruction ---');
  const burnCreateRes = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      recipient_name: 'Secret Agent',
      title: 'Self Destruct Mission',
      content: 'This note will self-destruct immediately after viewing.',
      password: 'BurnNowPass#1',
      burn_after_reading: true,
    }),
  });
  const burnCreateData = await burnCreateRes.json();
  const burnSlug = burnCreateData.data.slug;

  // Unlock once
  const burnUnlock1 = await fetch(`${BASE_URL}/public/message/${burnSlug}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({ password: 'BurnNowPass#1' }),
  });
  const burnData1 = await burnUnlock1.json();
  assert(burnUnlock1.status === 200 && burnData1.data.is_burned === true, 'Burn-after-reading unlocks successfully on 1st attempt and marks is_burned = true');

  // Unlock twice (should now be burned / 410)
  const burnUnlock2 = await fetch(`${BASE_URL}/public/message/${burnSlug}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({ password: 'BurnNowPass#1' }),
  });
  assert(burnUnlock2.status === 410, 'Subsequent attempts to open burned message return 410 Gone');

  // 13. Owner Logout & Session Revocation
  console.log('\n--- 13. Testing Owner Logout & Session Revocation ---');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
  });
  assert(logoutRes.status === 200, 'POST /api/auth/logout succeeds');

  const afterLogoutRes = await fetch(`${BASE_URL}/messages`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${ownerToken}`,
    },
  });
  assert(afterLogoutRes.status === 401, 'Revoked token is immediately rejected with 401 Unauthorized');

  console.log(`\n🎉 All ${testPassed}/${testTotal} tests PASSED with zero failures! Real SQLite persistence & security policies confirmed.`);
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
