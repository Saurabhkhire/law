require('dotenv').config();
const { initDb, getDb } = require('./database');

if (!process.argv.includes('--confirm')) {
  console.log('\n⚠️  This will delete ALL data in the database.');
  console.log('   Run with --confirm to proceed:\n');
  console.log('   npm run db:reset -- --confirm\n');
  process.exit(0);
}

async function reset() {
  await initDb();
  const db = getDb();

  console.log('\n🗑️  Resetting ImmigAI database...\n');

  const tables = [
    'user_alerts', 'policy_alerts', 'documents',
    'travel_advisories', 'visa_assessments', 'users'
  ];

  for (const table of tables) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get();
      const count = row ? row.n : 0;
      db.prepare(`DELETE FROM ${table}`).run();
      console.log(`  🗑️  ${table}: deleted ${count} rows`);
    } catch {
      console.log(`  ⏭️  ${table}: skipped (does not exist)`);
    }
  }

  console.log('\n✅ Database reset complete. All tables are empty.');
  console.log('   Run "npm run db:seed" to add demo data back.\n');
}

reset().catch(err => { console.error(err); process.exit(1); });
