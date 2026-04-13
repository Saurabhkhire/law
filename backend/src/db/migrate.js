require('dotenv').config();
const { initDb, getDb } = require('./database');

async function migrate() {
  await initDb();
  const db = getDb();

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT NOT NULL,
      persona_type TEXT NOT NULL,
      citizenship TEXT NOT NULL,
      current_visa_type TEXT,
      visa_status TEXT,
      visa_expiry TEXT,
      i94_expiry TEXT,
      company_name TEXT,
      company_stage TEXT,
      company_role TEXT,
      equity_percent REAL,
      salary_usd INTEGER,
      location_state TEXT,
      pending_applications TEXT DEFAULT '[]',
      profile_data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS visa_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      visa_category TEXT NOT NULL,
      fit_score INTEGER NOT NULL,
      criteria_met TEXT DEFAULT '[]',
      criteria_missing TEXT DEFAULT '[]',
      evidence_gaps TEXT DEFAULT '[]',
      timeline_months INTEGER,
      estimated_cost_usd INTEGER,
      explanation TEXT,
      citations TEXT DEFAULT '[]',
      confidence_score INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      citations TEXT DEFAULT '[]',
      confidence_score INTEGER,
      attorney_reviewed INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS travel_advisories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      purpose TEXT NOT NULL,
      travel_date TEXT,
      return_date TEXT,
      risk_level TEXT,
      risk_factors TEXT DEFAULT '[]',
      recommendations TEXT DEFAULT '[]',
      document_checklist TEXT DEFAULT '[]',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS policy_alerts (
      id TEXT PRIMARY KEY,
      alert_type TEXT NOT NULL,
      source TEXT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      affected_visas TEXT DEFAULT '[]',
      severity TEXT DEFAULT 'INFO',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      alert_id TEXT NOT NULL,
      impact_analysis TEXT,
      action_required TEXT,
      dismissed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employee_roster (
      id TEXT PRIMARY KEY,
      company_user_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      employee_email TEXT,
      citizenship TEXT NOT NULL,
      job_title TEXT NOT NULL,
      visa_type TEXT,
      visa_expiry TEXT,
      i94_expiry TEXT,
      salary INTEGER,
      lca_status TEXT DEFAULT 'valid',
      i9_status TEXT DEFAULT 'complete',
      pending_applications TEXT DEFAULT '[]',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hiring_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      candidate_info TEXT DEFAULT '{}',
      analysis TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database migrated successfully');
}

// Self-run when called directly (npm run migrate)
// Exported as `run` so server.js can call it too
if (require.main === module) {
  migrate().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run: migrate };
