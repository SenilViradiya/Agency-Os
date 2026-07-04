import { execSync } from 'child_process';

async function globalSetup() {
  console.log('--- GLOBAL SETUP: Seeding database ---');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('--- GLOBAL SETUP: Database seed completed ---');
  } catch (error) {
    console.error('--- GLOBAL SETUP ERROR: Database seed failed ---', error);
  }
}

export default globalSetup;
