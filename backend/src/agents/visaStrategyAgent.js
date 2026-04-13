// Visa Strategy Agent
// Matches user profile to visa categories, scores fit, identifies evidence gaps
//
// LLM: OpenAI GPT-4o (structured JSON output)
// RAG: VISA_RULES knowledge base (sponsor alt: LlamaIndex over LexisNexis corpus)
// Embeddings: OpenAI text-embedding-3-small (sponsor alt: HuggingFace legal-bert)

require('dotenv').config();
const { openai, MODEL } = require('../config/openai');
const { VISA_RULES } = require('../data/visaRules');
const { applyTrustLayer } = require('./trustLayer');

// Score how well a profile matches a single visa category
function scoreVisaMatch(profile, visaKey) {
  const visa = VISA_RULES[visaKey];
  if (!visa) return null;

  // Check if this visa is relevant for the user's persona
  if (visa.bestFor && !visa.bestFor.includes(profile.persona_type)) {
    return { visaKey, fitScore: 0, reason: 'Not applicable for your role' };
  }

  const profileText = JSON.stringify(profile).toLowerCase();
  let metCriteria = [];
  let missingCriteria = [];

  for (const criterion of visa.criteria) {
    const matched = criterion.signals.some(signal => profileText.includes(signal.toLowerCase()));
    if (matched) {
      metCriteria.push(criterion);
    } else {
      missingCriteria.push(criterion);
    }
  }

  const fitScore = Math.round((metCriteria.length / visa.criteria.length) * 100);

  return {
    visaKey,
    fitScore,
    metCriteria,
    missingCriteria,
    meetsMinimum: metCriteria.length >= visa.minCriteriaMet
  };
}

// Main agent function
async function runVisaStrategyAgent(profile) {
  // Step 1: Pre-score using rules engine (no LLM needed for initial ranking)
  const scores = Object.keys(VISA_RULES)
    .map(key => scoreVisaMatch(profile, key))
    .filter(s => s && s.fitScore > 0)
    .sort((a, b) => b.fitScore - a.fitScore);

  const topVisas = scores.slice(0, 4);

  // Step 2: Use GPT-4o to generate detailed analysis and evidence gaps
  const systemPrompt = `You are an expert US immigration attorney specializing in startup founders and tech professionals.
Analyze the user profile and provide detailed visa strategy advice.
Always cite specific USCIS regulations (e.g., "8 CFR 214.2(o)(3)(iii)(A)") and AAO decisions.
Be honest about weaknesses. Never guarantee outcomes.
Respond in valid JSON only.`;

  const userPrompt = `Analyze this profile for US immigration visa options:

Profile:
${JSON.stringify(profile, null, 2)}

Pre-scored visa candidates (from rules engine):
${JSON.stringify(topVisas.map(v => ({ visa: v.visaKey, score: v.fitScore, metCriteria: v.metCriteria?.map(c => c.name), missingCriteria: v.missingCriteria?.map(c => c.name) })), null, 2)}

Visa rules reference:
${JSON.stringify(topVisas.map(v => ({ visa: v.visaKey, ...VISA_RULES[v.visaKey] })), null, 2)}

Respond with this exact JSON structure:
{
  "topRecommendation": {
    "visaCategory": "string",
    "fitScore": number,
    "headline": "one sentence summary",
    "explanation": "2-3 sentences explaining why this is best",
    "citations": ["citation1", "citation2"],
    "confidenceScore": number (0-100)
  },
  "allPathways": [
    {
      "visaCategory": "string",
      "fitScore": number,
      "timelineMonths": number,
      "estimatedCostUsd": number,
      "criteriaMetCount": number,
      "criteriaTotalCount": number,
      "meetsMinimum": boolean,
      "summary": "string",
      "citations": ["string"],
      "pros": ["string"],
      "cons": ["string"]
    }
  ],
  "evidenceGaps": [
    {
      "visaCategory": "string",
      "missingCriterion": "string",
      "citation": "string",
      "actionable": "specific action to close this gap",
      "timeToClose": "estimated time",
      "difficulty": "easy|medium|hard"
    }
  ],
  "founderSpecificAdvice": "string or null",
  "urgentWarnings": ["string"]
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

  const analysis = JSON.parse(completion.choices[0].message.content);

  // Step 3: Apply trust layer
  const allCitations = [
    ...(analysis.topRecommendation?.citations || []),
    ...analysis.allPathways.flatMap(p => p.citations || [])
  ];

  const trustedOutput = await applyTrustLayer({
    content: JSON.stringify(analysis),
    citations: allCitations,
    criteriaCount: analysis.topRecommendation ? 1 : 0,
    totalCriteria: 1
  });

  return {
    ...analysis,
    trustLayer: trustedOutput.trustLayer
  };
}

module.exports = { runVisaStrategyAgent };
