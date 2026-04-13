const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { runVisaStrategyAgent } = require('../agents/visaStrategyAgent');

const router = express.Router();

// Run visa strategy analysis for a user
router.post('/analyze/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = {
    ...user,
    pending_applications: JSON.parse(user.pending_applications || '[]'),
    profile_data: JSON.parse(user.profile_data || '{}'),
    // Merge any extra context from request body
    ...req.body
  };

  try {
    const analysis = await runVisaStrategyAgent(profile);

    // Save each pathway as a separate assessment record
    const assessments = [];
    for (const pathway of (analysis.allPathways || [])) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO visa_assessments (
          id, user_id, visa_category, fit_score,
          criteria_met, criteria_missing, evidence_gaps,
          timeline_months, estimated_cost_usd,
          explanation, citations, confidence_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, user.id, pathway.visaCategory, pathway.fitScore,
        JSON.stringify(pathway.pros || []),
        JSON.stringify(pathway.cons || []),
        JSON.stringify(analysis.evidenceGaps?.filter(g => g.visaCategory === pathway.visaCategory) || []),
        pathway.timelineMonths || null,
        pathway.estimatedCostUsd || null,
        pathway.summary || '',
        JSON.stringify(pathway.citations || []),
        analysis.topRecommendation?.confidenceScore || 70
      );
      assessments.push(id);
    }

    res.json({
      success: true,
      analysis,
      assessmentIds: assessments
    });
  } catch (err) {
    console.error('Visa analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// Get all visa assessments for a user
router.get('/assessments/:userId', (req, res) => {
  const db = getDb();
  const assessments = db.prepare(
    'SELECT * FROM visa_assessments WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.userId);

  res.json(assessments.map(a => ({
    ...a,
    criteria_met: JSON.parse(a.criteria_met || '[]'),
    criteria_missing: JSON.parse(a.criteria_missing || '[]'),
    evidence_gaps: JSON.parse(a.evidence_gaps || '[]'),
    citations: JSON.parse(a.citations || '[]')
  })));
});

module.exports = router;
