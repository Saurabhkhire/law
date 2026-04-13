const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { runHiringIntelAgent, generateComplianceReport } = require('../agents/hiringIntelAgent');
const { generateLetter } = require('../agents/documentDrafterAgent');

const router = express.Router();

// ─── Analyze a prospective hire ──────────────────────────────────────────────
router.post('/hiring-analysis/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const companyProfile = {
    companyName: user.company_name,
    industry: JSON.parse(user.profile_data || '{}').industry || 'Technology',
    companySize: JSON.parse(user.profile_data || '{}').companySize || 'Unknown',
    hasExistingH1bProgram: JSON.parse(user.profile_data || '{}').hasH1bProgram || false,
    location: user.location_state || 'CA'
  };

  try {
    const analysis = await runHiringIntelAgent(companyProfile, req.body);

    const id = uuidv4();
    db.prepare(`
      INSERT INTO hiring_analyses (id, user_id, candidate_info, analysis, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, user.id, JSON.stringify(req.body), JSON.stringify(analysis));

    res.json({ success: true, analysisId: id, analysis });
  } catch (err) {
    console.error('Hiring analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// ─── Get hiring history ───────────────────────────────────────────────────────
router.get('/hiring-history/:userId', (req, res) => {
  const db = getDb();
  const analyses = db.prepare(
    'SELECT * FROM hiring_analyses WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.userId);

  res.json(analyses.map(a => ({
    ...a,
    candidate_info: JSON.parse(a.candidate_info || '{}'),
    analysis: JSON.parse(a.analysis || '{}')
  })));
});

// ─── Get employee roster ──────────────────────────────────────────────────────
router.get('/roster/:userId', (req, res) => {
  const db = getDb();
  const roster = db.prepare(
    'SELECT * FROM employee_roster WHERE company_user_id = ? ORDER BY visa_expiry ASC'
  ).all(req.params.userId);

  res.json(roster.map(e => ({
    ...e,
    pending_applications: JSON.parse(e.pending_applications || '[]')
  })));
});

// ─── Add employee to roster ───────────────────────────────────────────────────
router.post('/roster/:userId', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const {
    employeeName, employeeEmail, citizenship, jobTitle,
    visaType, visaExpiry, i94Expiry, salary,
    lcaStatus, i9Status, pendingApplications, notes
  } = req.body;

  db.prepare(`
    INSERT INTO employee_roster (
      id, company_user_id, employee_name, employee_email,
      citizenship, job_title, visa_type, visa_expiry,
      i94_expiry, salary, lca_status, i9_status,
      pending_applications, notes
    ) VALUES (?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?)
  `).run(
    id, req.params.userId, employeeName, employeeEmail || null,
    citizenship, jobTitle, visaType, visaExpiry || null,
    i94Expiry || null, salary || null, lcaStatus || 'valid', i9Status || 'complete',
    JSON.stringify(pendingApplications || []), notes || null
  );

  res.status(201).json({ success: true, id });
});

// ─── Compliance report for entire roster ─────────────────────────────────────
router.post('/compliance-report/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const roster = db.prepare(
    'SELECT * FROM employee_roster WHERE company_user_id = ?'
  ).all(req.params.userId);

  if (roster.length === 0) {
    return res.json({ overallRisk: 'LOW', summary: 'No employees in roster.', criticalAlerts: [], expiringWithin90Days: [], recommendations: [] });
  }

  const companyProfile = { companyName: user.company_name };
  const employees = roster.map(e => ({
    name: e.employee_name,
    visa: e.visa_type,
    expiry: e.visa_expiry,
    i9Status: e.i9_status,
    lcaStatus: e.lca_status,
    pending: JSON.parse(e.pending_applications || '[]')
  }));

  try {
    const report = await generateComplianceReport(companyProfile, employees);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Report failed', details: err.message });
  }
});

// ─── Generate sponsorship document ───────────────────────────────────────────
router.post('/sponsorship-doc/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { docType, employeeInfo } = req.body;

  const profile = {
    ...user,
    pending_applications: JSON.parse(user.pending_applications || '[]'),
    // Override name/role for document with employee info
    name: user.name,
    company_name: user.company_name,
    company_role: user.company_role
  };

  try {
    const letter = await generateLetter(docType, profile, {
      employeeName: employeeInfo?.name,
      jobTitle: employeeInfo?.jobTitle,
      salary: employeeInfo?.salary,
      startDate: employeeInfo?.startDate,
      citizenship: employeeInfo?.citizenship,
      visaType: employeeInfo?.visaType,
      ...employeeInfo
    });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO documents (id, user_id, doc_type, title, content, citations, confidence_score, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, user.id, docType,
      letter.title,
      letter.letterContent || '',
      JSON.stringify(letter.citations || []),
      letter.trustLayer?.confidenceScore || 70,
      JSON.stringify({ employeeInfo, keyPoints: letter.keyPoints })
    );

    res.json({ success: true, documentId: id, letter });
  } catch (err) {
    res.status(500).json({ error: 'Document generation failed', details: err.message });
  }
});

module.exports = router;
