// Hiring Intelligence Agent
// For companies/employers: analyze a prospective international hire
// and return the best visa sponsorship strategy, timeline, cost, and risks.

require('dotenv').config();
const { openai, MODEL } = require('../config/openai');
const { VISA_RULES } = require('../data/visaRules');
const { applyTrustLayer } = require('./trustLayer');

const EMPLOYER_VISA_KNOWLEDGE = {
  'H-1B': {
    sponsorRequired: true,
    employerLiabilities: [
      'Pay LCA-required prevailing wage for the entire H-1B period',
      'Pay return transportation if employee is dismissed before petition end',
      'Maintain Public Access File (PAF) at place of employment',
      'Notify USCIS of material changes (role, location, salary)',
      'Cannot "bench" H-1B worker without pay'
    ],
    legalBasis: 'INA §212(n); 20 CFR 655.731; 8 CFR 214.2(h)',
    estimatedSponsorCost: { min: 5000, max: 12000 },
    timelineMonths: { lottery: 10, capExempt: 3 },
    risks: ['Annual lottery — 50% selection odds', 'Oct 1 start date only for cap', 'Ownership >50% problematic']
  },
  'O-1A': {
    sponsorRequired: true,
    employerLiabilities: [
      'File I-129 petition with USCIS',
      'No LCA required (no prevailing wage obligation)',
      'Must demonstrate extraordinary ability of beneficiary',
      'Can be filed any time — no lottery or cap'
    ],
    legalBasis: 'INA §101(a)(15)(O); 8 CFR 214.2(o)',
    estimatedSponsorCost: { min: 6000, max: 15000 },
    timelineMonths: { regular: 4, premium: 0.5 },
    risks: ['Must prove extraordinary ability', 'High evidentiary bar', 'Not for ordinary workers']
  },
  'TN': {
    sponsorRequired: false,
    employerLiabilities: [
      'Provide offer letter specifying TN-eligible profession',
      'No USCIS filing needed for Canadians (approved at border)',
      'Annual renewal or 3-year initial period'
    ],
    legalBasis: 'INA §214(e); USMCA Annex 16-A',
    estimatedSponsorCost: { min: 500, max: 2000 },
    timelineMonths: { canadian: 0, mexican: 1 },
    risks: ['Only for Canadian/Mexican nationals', 'Limited profession list', 'No path to Green Card directly']
  },
  'L-1A': {
    sponsorRequired: true,
    employerLiabilities: [
      'Must have qualifying relationship between foreign and US entity',
      'Blanket L petition available for large companies',
      'Must document managerial/executive role clearly'
    ],
    legalBasis: 'INA §101(a)(15)(L); 8 CFR 214.2(l)',
    estimatedSponsorCost: { min: 5000, max: 15000 },
    timelineMonths: { regular: 4, premium: 0.5 },
    risks: ['Requires 1 year abroad with related entity', 'Staffing companies restricted']
  },
  'EB-2-NIW': {
    sponsorRequired: false,
    employerLiabilities: ['No employer sponsorship required — employee self-petitions'],
    legalBasis: 'INA §203(b)(2)(B); Matter of Dhanasar',
    estimatedSponsorCost: { min: 0, max: 3000 },
    timelineMonths: { filing: 18 },
    risks: ['Employee self-petitions — employer has no control', 'Long timeline']
  },
  'H-1B1': {
    sponsorRequired: true,
    employerLiabilities: ['Similar to H-1B but for Chilean/Singaporean nationals', 'No lottery — direct filing'],
    legalBasis: 'INA §101(a)(15)(H)(i)(b1)',
    estimatedSponsorCost: { min: 3000, max: 8000 },
    timelineMonths: { regular: 3 },
    risks: ['Only for Chile/Singapore nationals', 'Annual cap but rarely oversubscribed']
  }
};

const I9_GUIDANCE = {
  requirements: [
    'Complete I-9 within 3 business days of hire start date',
    'Employer must physically examine original documents (or use authorized remote verification)',
    'Re-verify work authorization before it expires',
    'Retain I-9 for 3 years after hire date OR 1 year after termination, whichever is later',
    'Do not ask for specific documents — accept any List A document or List B + C combination'
  ],
  commonMistakes: [
    'Asking foreign nationals for green card or EAD instead of accepting any valid document',
    'Not re-verifying H-1B workers before visa expiry',
    'Accepting expired documents',
    'Filling out Section 1 for the employee',
    'Not completing Section 2 within 3 business days'
  ],
  legalBasis: 'INA §274A; 8 CFR 274a.2'
};

const LCA_REQUIREMENTS = {
  required_for: ['H-1B', 'H-1B1', 'E-3'],
  obligations: [
    'Pay at least the higher of actual wage or prevailing wage for the occupation/location',
    'Provide working conditions that will not adversely affect similarly employed US workers',
    'Post LCA notice at worksite for 10 consecutive business days before filing',
    'Maintain Public Access File at place of employment',
    'No strike/lockout at time of filing'
  ],
  prevailingWageSource: 'DOL Online Wage Library (OWL) — https://www.dol.gov/agencies/eta/foreign-labor/wages',
  legalBasis: '20 CFR 655.731; INA §212(n)'
};

async function runHiringIntelAgent(companyProfile, candidateInfo) {
  const { companyName, industry, companySize, hasExistingH1bProgram, location } = companyProfile;
  const { candidateName, candidateCountry, jobTitle, salary, jobCategory, yearsExperience, hasExtraordinaryAbility, foreignCompanyRelationship } = candidateInfo;

  const systemPrompt = `You are a senior US immigration attorney advising a company on how to hire an international employee.
Provide specific, actionable guidance on the best visa sponsorship strategy.
Always cite specific USCIS regulations and INA sections.
Be clear about employer obligations, costs, timelines, and risks.
Respond in valid JSON only.`;

  const userPrompt = `A company wants to hire an international candidate. Analyze and recommend the best visa strategy.

Company:
- Name: ${companyName}
- Industry: ${industry}
- Size: ${companySize}
- Location: ${location}
- Has existing H-1B program: ${hasExistingH1bProgram}

Candidate:
- Name: ${candidateName || 'Candidate'}
- Citizenship: ${candidateCountry}
- Job Title: ${jobTitle}
- Salary Offered: $${salary?.toLocaleString() || 'TBD'}
- Job Category: ${jobCategory}
- Years Experience: ${yearsExperience}
- Extraordinary Ability: ${hasExtraordinaryAbility}
- Has worked at foreign affiliate: ${foreignCompanyRelationship}

Employer visa knowledge base:
${JSON.stringify(EMPLOYER_VISA_KNOWLEDGE, null, 2)}

I-9 requirements:
${JSON.stringify(I9_GUIDANCE, null, 2)}

LCA requirements:
${JSON.stringify(LCA_REQUIREMENTS, null, 2)}

Respond with:
{
  "recommendedVisa": {
    "category": "string",
    "reason": "string",
    "employerSponsorRequired": boolean,
    "estimatedCost": number,
    "timelineMonths": number,
    "citations": ["string"]
  },
  "allOptions": [
    {
      "category": "string",
      "fitScore": number,
      "employerCost": number,
      "timelineMonths": number,
      "pros": ["string"],
      "cons": ["string"],
      "employerObligations": ["string"],
      "citations": ["string"]
    }
  ],
  "hiringSteps": [
    {
      "step": number,
      "action": "string",
      "owner": "HR|Attorney|Candidate|USCIS",
      "timeline": "string",
      "notes": "string"
    }
  ],
  "complianceChecklist": {
    "lcaRequired": boolean,
    "lcaSteps": ["string"],
    "i9Steps": ["string"],
    "publicAccessFileItems": ["string"],
    "ongoingObligations": ["string"]
  },
  "riskFlags": ["string"],
  "estimatedTotalCost": number,
  "confidenceScore": number
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

  const trusted = await applyTrustLayer({
    content: JSON.stringify(analysis),
    citations: [
      ...(analysis.recommendedVisa?.citations || []),
      ...analysis.allOptions?.flatMap(o => o.citations || []) || []
    ],
    criteriaCount: 1,
    totalCriteria: 1
  });

  return { ...analysis, trustLayer: trusted.trustLayer };
}

async function generateComplianceReport(companyProfile, employees) {
  const systemPrompt = `You are a US immigration compliance attorney.
Analyze a company's employee roster for immigration compliance risks.
Flag expiring visas, LCA violations, I-9 issues, and H-1B cap exposure.
Respond in valid JSON only.`;

  const userPrompt = `Generate a compliance report for:

Company: ${companyProfile.companyName}
Employees: ${JSON.stringify(employees, null, 2)}

Respond with:
{
  "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "string",
  "criticalAlerts": [
    { "employee": "string", "issue": "string", "deadline": "string", "action": "string", "citation": "string" }
  ],
  "expiringWithin90Days": [
    { "employee": "string", "visaType": "string", "expiry": "string", "renewalAction": "string" }
  ],
  "lcaComplianceFlags": ["string"],
  "i9ComplianceFlags": ["string"],
  "recommendations": ["string"]
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

  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { runHiringIntelAgent, generateComplianceReport, EMPLOYER_VISA_KNOWLEDGE, I9_GUIDANCE, LCA_REQUIREMENTS };
