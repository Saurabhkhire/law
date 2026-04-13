// Document Drafter Agent
// Generates all legal letters, petitions, and RFE responses
//
// LLM: OpenAI GPT-4o
// Legal corpus: LETTER_TEMPLATES + VISA_RULES knowledge base
// Sponsor: LexisNexis API for case law citation (ALT: CourtListener free API)
// Sponsor: Filevine API for case management push (ALT: local PDF export)

require('dotenv').config();
const { openai, MODEL } = require('../config/openai');
const { LETTER_TEMPLATES } = require('../data/letterTemplates');
const { VISA_RULES } = require('../data/visaRules');
const { applyTrustLayer } = require('./trustLayer');
const axios = require('axios');

// Fetch supporting case law
// SPONSOR: LexisNexis API
// ALT: CourtListener free API (https://www.courtlistener.com/api/)
async function fetchCaseLaw(query) {
  if (process.env.LEXISNEXIS_API_KEY) {
    try {
      const response = await axios.get(`${process.env.LEXISNEXIS_BASE_URL}/search`, {
        headers: { 'Authorization': `Bearer ${process.env.LEXISNEXIS_API_KEY}` },
        params: { q: query, jurisdiction: 'federal', category: 'immigration', limit: 3 }
      });
      return response.data.results;
    } catch {
      // fall through to free alternative
    }
  }

  // ALT: CourtListener free API
  try {
    const response = await axios.get('https://www.courtlistener.com/api/rest/v4/search/', {
      params: { q: query, type: 'o', court: 'bia', order_by: 'score desc', page_size: 3 },
      timeout: 5000
    });
    return response.data.results?.map(r => ({
      title: r.caseName,
      citation: r.citation,
      url: `https://www.courtlistener.com${r.absolute_url}`
    })) || [];
  } catch {
    return [];
  }
}

// Push document to Filevine (SPONSOR)
// ALT: Returns document for local PDF export
async function deliverDocument(document, userId) {
  if (process.env.FILEVINE_API_KEY && process.env.FILEVINE_ORG_ID) {
    try {
      await axios.post('https://api.filevine.io/v2/documents', {
        orgId: process.env.FILEVINE_ORG_ID,
        fileName: `${document.title}.pdf`,
        content: document.content,
        metadata: { userId, docType: document.doc_type }
      }, {
        headers: { 'Authorization': `Bearer ${process.env.FILEVINE_API_KEY}` }
      });
      return { delivery: 'filevine', success: true };
    } catch {
      // fall through to local
    }
  }
  return { delivery: 'local_pdf', success: true };
}

async function generateLetter(letterType, profile, context = {}) {
  const template = LETTER_TEMPLATES[letterType];
  if (!template) throw new Error(`Unknown letter type: ${letterType}`);

  // Fetch relevant case law to enrich citations
  const caselaw = await fetchCaseLaw(`${template.title} immigration ${profile.current_visa_type || ''}`);

  const systemPrompt = `You are an experienced US immigration attorney drafting a formal legal letter.
Write in professional legal language. Use formal letterhead format.
Every claim must be grounded in specific USCIS regulations or case law.
Always include the legal basis citation (e.g., "pursuant to 8 CFR 214.2(o)").
Never fabricate case citations. Only use citations from the provided legal basis.
Include a disclaimer that this letter does not constitute legal advice if it's AI-generated.`;

  const userPrompt = `Draft a "${template.title}" for the following person.

Template info:
${JSON.stringify(template, null, 2)}

User Profile:
${JSON.stringify({
  name: profile.name,
  citizenship: profile.citizenship,
  persona: profile.persona_type,
  visa: profile.current_visa_type,
  visaStatus: profile.visa_status,
  visaExpiry: profile.visa_expiry,
  company: profile.company_name,
  role: profile.company_role,
  equity: profile.equity_percent,
  companyStage: profile.company_stage
}, null, 2)}

Additional context:
${JSON.stringify(context, null, 2)}

Legal basis for this letter: ${template.legalBasis}
Use case: ${template.useCase}

Available case law references:
${JSON.stringify(caselaw, null, 2)}

Respond with this JSON:
{
  "title": "string",
  "date": "string",
  "letterContent": "full letter text with proper formatting and line breaks",
  "citations": ["citation1", "citation2"],
  "confidenceScore": number (0-100),
  "attorneyNotes": "notes for reviewing attorney",
  "keyPoints": ["bullet point summaries of key claims"]
}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  const draft = JSON.parse(completion.choices[0].message.content);

  // Apply trust layer
  const trusted = await applyTrustLayer({
    content: draft.letterContent,
    citations: draft.citations || [],
    criteriaCount: 1,
    totalCriteria: 1
  });

  return {
    ...draft,
    letterType,
    templateInfo: template,
    caselaw,
    trustLayer: trusted.trustLayer
  };
}

async function generateRFEResponse(profile, rfeDetails) {
  const { rfeText, criterionChallenged, receiptNumber, deadline } = rfeDetails;

  const caselaw = await fetchCaseLaw(`O-1A RFE response ${criterionChallenged} extraordinary ability`);

  const systemPrompt = `You are an expert immigration attorney drafting a response to a USCIS Request for Further Evidence (RFE).
Be precise, cite specific regulations, and directly address the USCIS concerns.
Structure the response with: (1) Summary of RFE concern, (2) Legal standard, (3) Evidence provided, (4) Conclusion.
Every claim must cite a specific regulation or AAO precedent.
Respond in valid JSON only.`;

  const userPrompt = `Draft an RFE response for:

Petitioner: ${profile.name}
Receipt Number: ${receiptNumber}
Response Deadline: ${deadline}
Criterion Challenged: ${criterionChallenged}
Visa Category: ${profile.current_visa_type}

RFE Text:
${rfeText}

Profile:
${JSON.stringify({ name: profile.name, company: profile.company_name, role: profile.company_role }, null, 2)}

Case law references:
${JSON.stringify(caselaw, null, 2)}

Respond with:
{
  "coverLetterContent": "string",
  "legalAnalysis": "string",
  "evidenceRequested": ["list of evidence to gather"],
  "rebuttalStrength": "STRONG|MODERATE|WEAK",
  "citations": ["string"],
  "recommendedStrategy": "string",
  "confidenceScore": number
}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  });

  const response = JSON.parse(completion.choices[0].message.content);

  const trusted = await applyTrustLayer({
    content: response.coverLetterContent,
    citations: response.citations || [],
    criteriaCount: 1,
    totalCriteria: 1
  });

  return { ...response, caselaw, trustLayer: trusted.trustLayer };
}

module.exports = { generateLetter, generateRFEResponse, deliverDocument };
