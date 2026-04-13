const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { generateLetter, generateRFEResponse, deliverDocument } = require('../agents/documentDrafterAgent');
const { generateLetterPDF } = require('../utils/pdfGenerator');
const { LETTER_TEMPLATES } = require('../data/letterTemplates');

const router = express.Router();

// List all available letter types
router.get('/templates', (req, res) => {
  res.json(LETTER_TEMPLATES);
});

// Generate any document type
router.post('/generate/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { docType, context } = req.body;
  if (!docType) return res.status(400).json({ error: 'docType is required' });

  const profile = {
    ...user,
    pending_applications: JSON.parse(user.pending_applications || '[]')
  };

  try {
    const letter = await generateLetter(docType, profile, context || {});

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
      JSON.stringify({
        keyPoints: letter.keyPoints,
        attorneyNotes: letter.attorneyNotes,
        trustLayer: letter.trustLayer
      })
    );

    res.json({ success: true, documentId: id, letter });
  } catch (err) {
    console.error('Document generation error:', err);
    res.status(500).json({ error: 'Generation failed', details: err.message });
  }
});

// Generate RFE response
router.post('/rfe/:userId', async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = {
    ...user,
    pending_applications: JSON.parse(user.pending_applications || '[]')
  };

  try {
    const response = await generateRFEResponse(profile, req.body);

    const id = uuidv4();
    db.prepare(`
      INSERT INTO documents (id, user_id, doc_type, title, content, citations, confidence_score, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, user.id, 'rfe_response',
      `RFE Response - ${req.body.criterionChallenged || 'General'}`,
      response.coverLetterContent || '',
      JSON.stringify(response.citations || []),
      response.confidenceScore || 70,
      JSON.stringify({ rebuttalStrength: response.rebuttalStrength, evidenceRequested: response.evidenceRequested })
    );

    res.json({ success: true, documentId: id, response });
  } catch (err) {
    console.error('RFE response error:', err);
    res.status(500).json({ error: 'RFE generation failed', details: err.message });
  }
});

// Download document as PDF
router.get('/:documentId/pdf', async (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  try {
    const letterData = {
      title: doc.title,
      letterContent: doc.content,
      citations: JSON.parse(doc.citations || '[]'),
      trustLayer: JSON.parse(doc.metadata || '{}').trustLayer
    };

    const pdfBuffer = await generateLetterPDF(letterData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'PDF generation failed', details: err.message });
  }
});

// Get all documents for a user
router.get('/user/:userId', (req, res) => {
  const db = getDb();
  const docs = db.prepare(
    'SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.userId);

  res.json(docs.map(d => ({
    ...d,
    citations: JSON.parse(d.citations || '[]'),
    metadata: JSON.parse(d.metadata || '{}')
  })));
});

// Get single document
router.get('/:documentId', (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  res.json({
    ...doc,
    citations: JSON.parse(doc.citations || '[]'),
    metadata: JSON.parse(doc.metadata || '{}')
  });
});

// Mark as attorney reviewed
router.patch('/:documentId/review', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE documents SET attorney_reviewed = 1 WHERE id = ?').run(req.params.documentId);
  res.json({ success: true });
});

module.exports = router;
