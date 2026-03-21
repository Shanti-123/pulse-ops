import dotenv from 'dotenv';
dotenv.config();

const BASE = 'http://localhost:3000/api';

const users = [
  { name: 'PW Admin',    email: 'pw_admin@pulseops.dev',   password: 'Admin@Test123!',    role: 'admin'    },
  { name: 'PW Engineer', email: 'pw_eng@pulseops.dev',     password: 'Engineer@Test123!', role: 'engineer' },
  { name: 'PW Viewer',   email: 'pw_viewer@pulseops.dev',  password: 'Viewer@Test123!',   role: 'viewer'   },
];

const seed = async () => {
  console.log('🌱 Seeding Playwright test users...\n');
  for (const user of users) {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Created: ${user.email}`);
    } else {
      console.log(`ℹ️  ${user.email}: ${data.message}`);
    }
  }
  console.log('\n✅ Done — run: npx playwright test\n');
  process.exit(0);
};

seed();