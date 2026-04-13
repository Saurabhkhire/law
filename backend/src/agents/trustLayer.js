// Trust & Safety Layer
// Runs on every AI output before it reaches the user
//
// SPONSOR: Trust Foundry API (set TRUST_FOUNDRY_API_KEY in .env)
// ALT:     Built-in citation checker + confidence scorer (default)

const { VISA_RULES } = require('../data/visaRules');

// Known authoritative citations in our knowledge base
const KNOWN_CITATIONS = new Set([
  'INA §101(a)(15)(O)',
  'INA §101(a)(15)(H)(i)(b)',
  'INA §101(a)(15)(L)',
  'INA §101(a)(15)(E)(ii)',
  'INA §203(b)(1)(A)',
  'INA §203(b)(2)(B)',
  'INA §214',
  'INA §212(d)(5)',
  'INA §235',
  'INA §291',
  '8 CFR 214.2(o)',
  '8 CFR 214.2(h)',
  '8 CFR 214.2(l)',
  '8 CFR 214.2(e)',
  '8 CFR 214.2(b)',
  '8 CFR 204.5(h)',
  '8 CFR 204.5(h)(3)',
  '8 CFR 245.2(a)(4)(ii)',
  '8 CFR 103.2(b)(8)',
  '8 CFR 235.1',
  'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)',
  'USMCA Annex 16-A',
  '20 CFR 655.731',
  '9 FAM 402.2'
]);

// If Trust Foundry is configured, use their API
async function checkWithTrustFoundry(content, citations) {
  const axios = require('axios');
  try {
    const response = await axios.post('https://api.trustfoundry.ai/v1/verify', {
      content,
      citations,
      domain: 'immigration_law'
    }, {
      headers: { 'Authorization': `Bearer ${process.env.TRUST_FOUNDRY_API_KEY}` },
      timeout: 5000
    });
    return response.data;
  } catch {
    // Fall back to built-in checker
    return null;
  }
}

// Built-in citation verifier (default/fallback)
function verifyCitations(citations = []) {
  return citations.map(citation => ({
    citation,
    verified: KNOWN_CITATIONS.has(citation),
    source: KNOWN_CITATIONS.has(citation) ? 'knowledge_base' : 'unverified'
  }));
}

// Calculate confidence score (0-100)
function calculateConfidence({ criteriaMatched, totalCriteria, citationsVerified, totalCitations, hasLegalBasis }) {
  let score = 0;

  // Criteria coverage (40 points)
  if (totalCriteria > 0) {
    score += (criteriaMatched / totalCriteria) * 40;
  }

  // Citation verification (40 points)
  if (totalCitations > 0) {
    score += (citationsVerified / totalCitations) * 40;
  } else {
    score += 20; // No citations to verify — neutral
  }

  // Has legal basis (20 points)
  if (hasLegalBasis) score += 20;

  return Math.round(Math.min(score, 100));
}

// Hallucination firewall — flag if output looks suspicious
function detectHallucination(content) {
  const suspiciousPatterns = [
    /guaranteed approval/i,
    /100% success rate/i,
    /definitely will be approved/i,
    /no chance of denial/i,
    /always approved/i,
    /I am not an attorney but I guarantee/i
  ];

  const flags = suspiciousPatterns
    .filter(pattern => pattern.test(content))
    .map(p => p.source);

  return {
    flagged: flags.length > 0,
    flags
  };
}

// Main trust layer function — wraps every AI output
async function applyTrustLayer(aiOutput) {
  const { content, citations = [], criteriaCount = 0, totalCriteria = 0 } = aiOutput;

  // Use Trust Foundry if configured
  if (process.env.TRUST_FOUNDRY_API_KEY) {
    const tfResult = await checkWithTrustFoundry(content, citations);
    if (tfResult) {
      return {
        ...aiOutput,
        trustLayer: { provider: 'trust_foundry', ...tfResult }
      };
    }
  }

  // Built-in trust layer (default)
  const verifiedCitations = verifyCitations(citations);
  const verifiedCount = verifiedCitations.filter(c => c.verified).length;

  const confidenceScore = calculateConfidence({
    criteriaMatched: criteriaCount,
    totalCriteria,
    citationsVerified: verifiedCount,
    totalCitations: citations.length,
    hasLegalBasis: citations.length > 0
  });

  const hallucinationCheck = detectHallucination(content);

  const requiresAttorneyReview = confidenceScore < 60 || hallucinationCheck.flagged;

  return {
    ...aiOutput,
    trustLayer: {
      provider: 'built_in',
      confidenceScore,
      verifiedCitations,
      hallucinationCheck,
      requiresAttorneyReview,
      disclaimer: 'This analysis is AI-generated and does not constitute legal advice. Always consult a licensed immigration attorney before taking action.'
    }
  };
}

module.exports = { applyTrustLayer, verifyCitations, calculateConfidence };
