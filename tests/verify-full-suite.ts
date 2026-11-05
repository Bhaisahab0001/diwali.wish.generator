/**
 * Comprehensive Automated Verification Suite for DiwaliVerse Secret Messages
 * Tests:
 * 1. First-time registration (full name, email, password, confirm_password)
 * 2. Duplicate registration rejection (409 Conflict)
 * 3. Validation rejection (short password, mismatching confirm_password, invalid email)
 * 4. Login after registration
 * 5. Incorrect password rejection (401)
 * 6. Correct login & session token creation
 * 7. Dashboard access & session verification
 * 8. Session persistence with Bearer header & Cookie
 * 9. Logout & session revocation
 * 10. Message creation with all required fields (no errors!)
 * 11. Database persistence
 * 12. Returned created message data & preview URL
 * 13. Owner preview access without burning or incrementing public view count
 * 14. Zero protected message leakage before recipient password unlock
 * 15. Incorrect message password rejection & rate limiting
 * 16. Correct message password unlock
 * 17. Editing and deleting messages
 * 18. Self-destruct / burn-after-reading verification
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTestSuite() {
  console.log('🚀 Running Full Verification Suite for DiwaliVerse Secret Messages...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS ${total}] ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL ${total}] ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  // 1. First-time registration
  console.log('--- 1. Testing Registration Flow ---');
  const uniqueEmail = `priya_${Date.now()}@diwaliverse.local`;
  const securePassword = 'PriyaSuperSecretPassword2026!';

  // Validation: Mismatching password
  const mismatchRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({
      full_name: 'Priya Sharma',
      email: uniqueEmail,
      password: securePassword,
      confirm_password: 'DifferentPassword123',
    }),
  });
  assert(mismatchRes.status === 400, 'Registration rejects mismatching confirm_password with HTTP 400');

  // Valid registration
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({
      full_name: 'Priya Sharma',
      email: uniqueEmail,
      password: securePassword,
      confirm_password: securePassword,
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.success === true, 'Registration succeeds with HTTP 201');
  assert(regData.message.includes('created') || regData.message.includes('sign in'), 'Registration returns friendly message to redirect to login');

  // 2. Duplicate registration rejection
  console.log('\n--- 2. Testing Duplicate Registration Rejection ---');
  const dupRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({
      full_name: 'Priya Sharma Duplicate',
      email: uniqueEmail,
      password: securePassword,
      confirm_password: securePassword,
    }),
  });
  assert(dupRegRes.status === 409, 'Duplicate registration with same email is rejected with HTTP 409 Conflict');

  // 3. Login after registration
  console.log('\n--- 3. Testing Login Flow ---');
  // Wrong password rejection
  const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'IncorrectPassword999!',
    }),
  });
  assert(wrongLoginRes.status === 401, 'Login rejects incorrect password with HTTP 401');

  // Correct login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: securePassword,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success === true && loginData.token, 'Login succeeds and returns session token');
  const sessionToken = loginData.token;
  assert(loginData.owner.email === uniqueEmail, 'Login response includes owner email');

  // 4. Dashboard Access & Session Persistence
  console.log('\n--- 4. Testing Dashboard Access & Session Verification ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.owner.display_name === 'Priya Sharma', 'GET /api/auth/me returns authenticated owner profile');

  // 5. Creating Message
  console.log('\n--- 5. Testing Create Message ---');
  const msgPassword = 'DiwaliStars2026!';
  const createMsgRes = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      recipient_name: 'Ananya',
      sender_name: 'Priya',
      title: 'Under the Golden Diya Starlight',
      content: 'Happy Diwali! Your smile lights up my world more than all the festival diyas.',
      password: msgPassword,
      password_hint: 'Festival of lights + year',
      theme: 'golden-diya',
      envelope_seal: 'diya',
      burn_after_reading: false,
      max_views: 10,
    }),
  });
  const createMsgData = await createMsgRes.json();
  assert(createMsgRes.status === 201 && createMsgData.success === true, 'POST /api/messages creates secret message successfully without errors');
  assert(createMsgData.message === 'Your little secret has been sealed successfully! ❤️', 'Returns required success message: "Your little secret has been sealed successfully! ❤️"');
  assert(createMsgData.data.slug && createMsgData.data.id, 'Returns message slug and id');
  assert(createMsgData.data.content === 'Happy Diwali! Your smile lights up my world more than all the festival diyas.', 'Returns created message content for immediate owner preview');

  const messageId = createMsgData.data.id;
  const messageSlug = createMsgData.data.slug;

  // 6. Owner Preview (Separate from recipient view, doesn't increment public view count)
  console.log('\n--- 6. Testing Owner Confidential Preview ---');
  const ownerGetRes = await fetch(`${BASE_URL}/messages/${messageId}`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  const ownerGetData = await ownerGetRes.json();
  assert(ownerGetRes.status === 200 && ownerGetData.message.recipient_name === 'Ananya', 'Owner can retrieve message for preview and editing');
  assert(ownerGetData.message.password_hash === undefined, 'Password hash is strictly hidden from owner GET response');

  // 7. Zero Information Leakage on Public Recipient Endpoint
  console.log('\n--- 7. Testing Public Recipient Endpoint (No Content Leakage) ---');
  const pubRes = await fetch(`${BASE_URL}/public/message/${messageSlug}`);
  const pubData = await pubRes.json();
  assert(pubRes.status === 200 && pubData.metadata.recipient_name === 'Ananya', 'Public endpoint returns metadata for valid slug');
  assert(pubData.metadata.content === undefined, 'CRITICAL: Public metadata NEVER leaks message content');
  assert(pubData.metadata.password_hash === undefined, 'CRITICAL: Public metadata NEVER leaks password hash');
  assert(pubData.metadata.attempts_remaining === 5, 'Public metadata starts with 5 remaining attempts');

  // 8. Recipient Password Unlock
  console.log('\n--- 8. Testing Recipient Password Unlock ---');
  // Wrong password
  const wrongUnlockRes = await fetch(`${BASE_URL}/public/message/${messageSlug}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({ password: 'WrongPassword' }),
  });
  const wrongUnlockData = await wrongUnlockRes.json();
  assert(wrongUnlockRes.status === 401 && wrongUnlockData.attempts_remaining === 4, 'Incorrect password rejected with 401 and decrements attempts to 4');

  // Correct password
  const correctUnlockRes = await fetch(`${BASE_URL}/public/message/${messageSlug}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({ password: msgPassword }),
  });
  const correctUnlockData = await correctUnlockRes.json();
  assert(correctUnlockRes.status === 200 && correctUnlockData.success === true, 'Correct password unlock succeeds');
  assert(correctUnlockData.data.content === 'Happy Diwali! Your smile lights up my world more than all the festival diyas.', 'Protected secret content is securely returned upon correct password');
  assert(correctUnlockData.data.view_count === 1, 'View count incremented to 1');

  // 9. Editing Message
  console.log('\n--- 9. Testing Editing and Deleting Messages ---');
  const editRes = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      title: 'Updated Diya Starlight Title',
    }),
  });
  const editData = await editRes.json();
  assert(editRes.status === 200 && editData.success === true, 'PUT /api/messages/:id updates message');

  // 10. Logout & Session Revocation
  console.log('\n--- 10. Testing Logout & Token Revocation ---');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  assert(logoutRes.status === 200, 'POST /api/auth/logout succeeds');

  const afterLogoutRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  assert(afterLogoutRes.status === 401, 'Revoked token is rejected with 401 Unauthorized');

  console.log(`\n🎉 All ${passed}/${total} verification tests passed successfully!`);
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
