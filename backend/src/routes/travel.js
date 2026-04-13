const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { runTravelIntelAgent } = require('../agents/travelIntelAgent');
const { generateLetter } = require('../agents/documentDrafterAgent');

const router = express.Router();

// Get travel risk assessment
router.post('/assess/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { destination, purpose, travelDate, returnDate } = req.body;

  if (!destination || !purpose) {
    return res.status(400).json({ error: 'destination and purpose are required' });
  }

  const profile = {
    ...user,
    pending_applications: JSON.parse(user.pending_applications || '[]')
  };

  try {
    const assessment = await runTravelIntelAgent(profile, {
      destination, purpose, travelDate, returnDate
    });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO travel_advisories (
        id, user_id, destination_country, purpose,
        travel_date, return_date, risk_level,
        risk_factors, recommendations, document_checklist, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, user.id, destination, purpose,
      travelDate || null, returnDate || null,
      assessment.riskLevel,
      JSON.stringify(assessment.riskFactors || []),
      JSON.stringify(assessment.recommendations || []),
      JSON.stringify(assessment.documentChecklist || []),
      assessment.riskSummary || ''
    );

    res.json({ success: true, advisoryId: id, assessment });
  } catch (err) {
    console.error('Travel assessment error:', err);
    res.status(500).json({ error: 'Assessment failed', details: err.message });
  }
});

// Generate a specific travel letter
router.post('/letter/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { letterType, context } = req.body;

  if (!letterType) {
    return res.status(400).json({ error: 'letterType is required' });
  }

  const profile = {
    ...user,
    pending_applications: JSON.parse(user.pending_applications || '[]')
  };

  try {
    const letter = await generateLetter(letterType, profile, context || {});

    const id = uuidv4();
    db.prepare(`
      INSERT INTO documents (id, user_id, doc_type, title, content, citations, confidence_score, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, user.id, letterType,
      letter.title,
      letter.letterContent || letter.coverLetterContent || '',
      JSON.stringify(letter.citations || []),
      letter.trustLayer?.confidenceScore || 70,
      JSON.stringify({ keyPoints: letter.keyPoints, attorneyNotes: letter.attorneyNotes })
    );

    res.json({ success: true, documentId: id, letter });
  } catch (err) {
    console.error('Letter generation error:', err);
    res.status(500).json({ error: 'Letter generation failed', details: err.message });
  }
});

// Get all travel advisories for a user
router.get('/history/:userId', (req, res) => {
  const db = getDb();
  const advisories = db.prepare(
    'SELECT * FROM travel_advisories WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.userId);

  res.json(advisories.map(a => ({
    ...a,
    risk_factors: JSON.parse(a.risk_factors || '[]'),
    recommendations: JSON.parse(a.recommendations || '[]'),
    document_checklist: JSON.parse(a.document_checklist || '[]')
  })));
});

module.exports = router;
