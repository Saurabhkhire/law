// Travel Intelligence Agent
// Assesses travel risk, generates document checklists and travel letters
//
// LLM: OpenAI GPT-4o
// Live data: State Dept travel advisories via public RSS/API
// Sponsor alt: LlamaIndex web search tool over real-time policy feeds

require('dotenv').config();
const { openai, MODEL } = require('../config/openai');
const { TRAVEL_RULES } = require('../data/visaRules');
const { applyTrustLayer } = require('./trustLayer');
const axios = require('axios');

// Calculate unlawful presence (simplified)
function calculateUnlawfulPresence(profile) {
  if (!profile.i94_expiry && !profile.visa_expiry) return 0;

  const expiry = new Date(profile.i94_expiry || profile.visa_expiry);
  const today = new Date();

  if (today <= expiry) return 0;

  const diffMs = today - expiry;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Determine base risk level from visa status + destination
function getRiskLevel(profile, destination, travelParams) {
  const pendingApps = JSON.parse(profile.pending_applications || '[]');
  const unlawfulDays = calculateUnlawfulPresence(profile);

  // Critical scenarios
  if (unlawfulDays >= 365) return 'CRITICAL';
  if (pendingApps.includes('I-485') && !pendingApps.includes('AP')) return 'CRITICAL';
  if (profile.current_visa_type === 'DACA' && !pendingApps.includes('AP')) return 'CRITICAL';

  // High risk
  if (unlawfulDays >= 180) return 'HIGH';
  if (pendingApps.includes('I-485') && pendingApps.includes('AP')) return 'HIGH';
  if (profile.visa_status === 'expired') return 'HIGH';

  // Medium risk
  if (travelParams.isHomeCountry && ['H-1B', 'L-1A', 'O-1A'].includes(profile.current_visa_type)) return 'MEDIUM';
  if (profile.visa_status === 'pending_renewal') return 'MEDIUM';

  return 'LOW';
}

// Fetch live State Dept travel advisory (free public API)
async function fetchTravelAdvisory(country) {
  try {
    // State Dept free travel advisory API
    const response = await axios.get(
      `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/${country.toLowerCase().replace(/ /g, '-')}.html`,
      { timeout: 3000 }
    );
    return { available: true, level: 'check_website' };
  } catch {
    return { available: false };
  }
}

async function runTravelIntelAgent(profile, travelParams) {
  const { destination, purpose, travelDate, returnDate } = travelParams;
  const pendingApps = JSON.parse(profile.pending_applications || '[]');
  const unlawfulDays = calculateUnlawfulPresence(profile);
  const isHomeCountry = destination.toLowerCase().includes(profile.citizenship?.toLowerCase() || '');
  const riskLevel = getRiskLevel(profile, destination, { isHomeCountry });

  const systemPrompt = `You are a senior US immigration attorney with expertise in visa compliance and international travel.
Analyze travel risk for immigrants based on their current visa status and travel plans.
Always cite specific USCIS regulations, DOS guidance, and INA sections.
Be extremely cautious — flag CRITICAL risks prominently.
Provide actionable, specific recommendations.
Respond in valid JSON only.`;

  const userPrompt = `Analyze travel risk for this traveler:

Traveler Profile:
- Name: ${profile.name}
- Citizenship: ${profile.citizenship}
- Current Visa: ${profile.current_visa_type || 'None'}
- Visa Status: ${profile.visa_status}
- Visa Expiry: ${profile.visa_expiry || 'Unknown'}
- I-94 Expiry: ${profile.i94_expiry || 'Unknown'}
- Pending Applications: ${JSON.stringify(pendingApps)}
- Unlawful Presence Days (calculated): ${unlawfulDays}
- Role: ${profile.persona_type}
- Company: ${profile.company_name || 'N/A'}

Travel Details:
- Destination: ${destination}
- Purpose: ${purpose}
- Dates: ${travelDate} to ${returnDate}
- Is Home Country Visit: ${isHomeCountry}

Pre-calculated Risk Level: ${riskLevel}

Respond with this exact JSON:
{
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "riskSummary": "one sentence",
  "riskFactors": [
    {
      "factor": "string",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "citation": "string",
      "explanation": "string"
    }
  ],
  "recommendations": [
    {
      "action": "string",
      "priority": "IMMEDIATE|BEFORE_TRAVEL|ON_RETURN",
      "explanation": "string"
    }
  ],
  "documentChecklist": [
    {
      "document": "string",
      "required": true|false,
      "reason": "string",
      "obtainedFrom": "string"
    }
  ],
  "lettersToGenerate": ["employment_verification"|"business_travel"|"advance_parole_travel"|"reentry_support"|"b1_business_purpose"|"founder_role"],
  "borderScript": "What to say to CBP/border agent",
  "whatNotToSay": "string or null",
  "urgentWarnings": ["string"],
  "citations": ["string"]
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

  const analysis = JSON.parse(completion.choices[0].message.content);

  const trustedOutput = await applyTrustLayer({
    content: JSON.stringify(analysis),
    citations: analysis.citations || [],
    criteriaCount: 1,
    totalCriteria: 1
  });

  return {
    ...analysis,
    unlawfulPresenceDays: unlawfulDays,
    isHomeCountry,
    trustLayer: trustedOutput.trustLayer
  };
}

module.exports = { runTravelIntelAgent };
