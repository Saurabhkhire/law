const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const router = express.Router();

// Create or update user profile
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const {
    email, name, persona_type, citizenship,
    current_visa_type, visa_status, visa_expiry, i94_expiry,
    company_name, company_stage, company_role,
    equity_percent, salary_usd, location_state,
    pending_applications, profile_data
  } = req.body;

  if (!name || !persona_type || !citizenship) {
    return res.status(400).json({ error: 'name, persona_type, and citizenship are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO users (
      id, email, name, persona_type, citizenship,
      current_visa_type, visa_status, visa_expiry, i94_expiry,
      company_name, company_stage, company_role,
      equity_percent, salary_usd, location_state,
      pending_applications, profile_data
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?
    )
  `);

  stmt.run(
    id, email || null, name, persona_type, citizenship,
    current_visa_type || null, visa_status || 'valid', visa_expiry || null, i94_expiry || null,
    company_name || null, company_stage || null, company_role || null,
    equity_percent || null, salary_usd || null, location_state || null,
    JSON.stringify(pending_applications || []),
    JSON.stringify(profile_data || {})
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.status(201).json(parseUser(user));
});

// Get user by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(parseUser(user));
});

// Update user
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const updates = { ...existing, ...req.body, updated_at: new Date().toISOString() };

  db.prepare(`
    UPDATE users SET
      name=?, persona_type=?, citizenship=?,
      current_visa_type=?, visa_status=?, visa_expiry=?, i94_expiry=?,
      company_name=?, company_stage=?, company_role=?,
      equity_percent=?, salary_usd=?, location_state=?,
      pending_applications=?, profile_data=?, updated_at=?
    WHERE id=?
  `).run(
    updates.name, updates.persona_type, updates.citizenship,
    updates.current_visa_type, updates.visa_status, updates.visa_expiry, updates.i94_expiry,
    updates.company_name, updates.company_stage, updates.company_role,
    updates.equity_percent, updates.salary_usd, updates.location_state,
    typeof updates.pending_applications === 'string' ? updates.pending_applications : JSON.stringify(updates.pending_applications),
    typeof updates.profile_data === 'string' ? updates.profile_data : JSON.stringify(updates.profile_data),
    updates.updated_at,
    req.params.id
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(parseUser(user));
});

// Get all users (for dev/demo)
router.get('/', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json(users.map(parseUser));
});

function parseUser(user) {
  return {
    ...user,
    pending_applications: JSON.parse(user.pending_applications || '[]'),
    profile_data: JSON.parse(user.profile_data || '{}')
  };
}

module.exports = router;
