require('dotenv').config();
const { initDb, getDb } = require('./database');
const { v4: uuidv4 } = require('uuid');

const users = [
  {
    id: uuidv4(),
    email: 'sarah.johnson@quantumlabs.com',
    name: 'Sarah Johnson',
    persona_type: 'company',
    citizenship: 'United States',
    current_visa_type: null,
    visa_status: null,
    visa_expiry: null,
    i94_expiry: null,
    company_name: 'Quantum Labs Inc.',
    company_stage: 'series_a',
    company_role: 'VP of Engineering',
    equity_percent: 2,
    salary_usd: 240000,
    location_state: 'CA',
    pending_applications: JSON.stringify([]),
    profile_data: JSON.stringify({
      industry: 'AI / Machine Learning',
      companySize: '85 employees',
      hasH1bProgram: true,
      internationalHeadcount: 12,
      recentHiringCountries: ['India', 'Canada', 'Germany', 'Brazil', 'Nigeria'],
      legalCounsel: 'Wilson Immigration Law LLP'
    })
  },
  {
    id: uuidv4(),
    email: 'arjun@techflow.io',
    name: 'Arjun Sharma',
    persona_type: 'founder',
    citizenship: 'India',
    current_visa_type: 'H-1B',
    visa_status: 'valid',
    visa_expiry: '2025-09-30',
    i94_expiry: '2025-09-30',
    company_name: 'TechFlow AI',
    company_stage: 'seed',
    company_role: 'CEO',
    equity_percent: 55,
    salary_usd: 180000,
    location_state: 'CA',
    pending_applications: JSON.stringify([]),
    profile_data: JSON.stringify({
      achievements: ['patent holder', 'published researcher', 'Y Combinator alumni', 'featured in TechCrunch'],
      education: 'MS Computer Science, Stanford',
      yearsExperience: 8,
      publications: 3,
      speakingInvitations: 2
    })
  },
  {
    id: uuidv4(),
    email: 'sofia@greenpulse.com',
    name: 'Sofia Mendes',
    persona_type: 'cofounder',
    citizenship: 'Brazil',
    current_visa_type: 'O-1A',
    visa_status: 'valid',
    visa_expiry: '2026-03-15',
    i94_expiry: '2026-03-15',
    company_name: 'GreenPulse Energy',
    company_stage: 'series_a',
    company_role: 'CTO',
    equity_percent: 30,
    salary_usd: 200000,
    location_state: 'NY',
    pending_applications: JSON.stringify(['I-140']),
    profile_data: JSON.stringify({
      achievements: ['award winner', 'judge at international competition', 'peer reviewer', 'Forbes 30 under 30'],
      education: 'PhD Electrical Engineering, MIT',
      yearsExperience: 10,
      publications: 12,
      citations: 340
    })
  },
  {
    id: uuidv4(),
    email: 'wei.zhang@corptech.com',
    name: 'Wei Zhang',
    persona_type: 'employee',
    citizenship: 'China',
    current_visa_type: 'H-1B',
    visa_status: 'pending_renewal',
    visa_expiry: '2024-12-01',
    i94_expiry: '2024-12-01',
    company_name: 'CorpTech Solutions',
    company_stage: 'public',
    company_role: 'Senior Software Engineer',
    equity_percent: 0,
    salary_usd: 160000,
    location_state: 'WA',
    pending_applications: JSON.stringify(['H-1B Extension', 'I-140']),
    profile_data: JSON.stringify({
      achievements: ['critical role in ML infrastructure'],
      education: "Bachelor's Computer Science, Tsinghua University",
      yearsExperience: 6
    })
  },
  {
    id: uuidv4(),
    email: 'amara@outlook.com',
    name: 'Amara Okafor',
    persona_type: 'preincorporation',
    citizenship: 'Nigeria',
    current_visa_type: 'F-1 OPT',
    visa_status: 'valid',
    visa_expiry: '2025-06-30',
    i94_expiry: '2025-06-30',
    company_name: null,
    company_stage: 'idea',
    company_role: null,
    equity_percent: null,
    salary_usd: 95000,
    location_state: 'MA',
    pending_applications: JSON.stringify([]),
    profile_data: JSON.stringify({
      achievements: ['research assistant', 'hackathon winner'],
      education: 'MS Biomedical Engineering, Harvard',
      startupIdea: 'AI diagnostics for underserved clinics',
      yearsExperience: 3
    })
  },
  {
    id: uuidv4(),
    email: 'lucas.weber@euventures.de',
    name: 'Lucas Weber',
    persona_type: 'traveler',
    citizenship: 'Germany',
    current_visa_type: 'L-1A',
    visa_status: 'valid',
    visa_expiry: '2027-01-20',
    i94_expiry: '2027-01-20',
    company_name: 'EU Ventures GmbH',
    company_stage: 'series_b',
    company_role: 'Managing Director',
    equity_percent: 15,
    salary_usd: 220000,
    location_state: 'TX',
    pending_applications: JSON.stringify(['I-485', 'I-140']),
    profile_data: JSON.stringify({
      achievements: ['executive role', 'managing US entity of German parent company'],
      education: 'MBA, INSEAD',
      yearsExperience: 14
    })
  }
];

async function seed() {
  await initDb();
  const db = getDb();

  console.log('\n🌱 Seeding ImmigAI demo data...\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (
      id, email, name, persona_type, citizenship,
      current_visa_type, visa_status, visa_expiry, i94_expiry,
      company_name, company_stage, company_role,
      equity_percent, salary_usd, location_state,
      pending_applications, profile_data
    ) VALUES (?,?,?,?,?, ?,?,?,?, ?,?,?, ?,?,?, ?,?)
  `);

  for (const u of users) {
    insertUser.run(
      u.id, u.email, u.name, u.persona_type, u.citizenship,
      u.current_visa_type, u.visa_status, u.visa_expiry, u.i94_expiry,
      u.company_name, u.company_stage, u.company_role,
      u.equity_percent, u.salary_usd, u.location_state,
      u.pending_applications, u.profile_data
    );
    console.log(`  ✅ User: ${u.name} (${u.persona_type})`);
  }

  // ── Visa assessments ───────────────────────────────────────────────────────
  const arjun = users.find(u => u.name === 'Arjun Sharma');
  const sofia = users.find(u => u.name === 'Sofia Mendes');
  const wei   = users.find(u => u.name === 'Wei Zhang');

  const assessments = [
    {
      id: uuidv4(), user_id: arjun.id,
      visa_category: 'O-1A', fit_score: 72,
      criteria_met: JSON.stringify(['Published research', 'Featured in TechCrunch', 'Patent holder', 'Critical role as CEO']),
      criteria_missing: JSON.stringify(['High salary relative to peers', 'Judging others work']),
      evidence_gaps: JSON.stringify([
        { missingCriterion: 'High Salary', actionable: 'Get wage comparison showing top 10% for your role from BLS data', timeToClose: '2-4 weeks', difficulty: 'easy', citation: '8 CFR 214.2(o)(3)(iii)(H)' },
        { missingCriterion: 'Judging Others', actionable: 'Accept 2 peer-review invitations from journals in your field', timeToClose: '1-2 months', difficulty: 'medium', citation: '8 CFR 214.2(o)(3)(iii)(D)' }
      ]),
      timeline_months: 4, estimated_cost_usd: 8000,
      explanation: 'Strong O-1A candidate. Owning 55% equity makes H-1B renewal risky — O-1A is the right path. Need 2 more criteria.',
      citations: JSON.stringify(['INA §101(a)(15)(O)', '8 CFR 214.2(o)(3)(iii)']),
      confidence_score: 78
    },
    {
      id: uuidv4(), user_id: arjun.id,
      visa_category: 'EB-2-NIW', fit_score: 65,
      criteria_met: JSON.stringify(['AI startup has substantial national merit', 'Stanford MS + 8 years experience']),
      criteria_missing: JSON.stringify(['Formal proof of national importance']),
      evidence_gaps: JSON.stringify([
        { missingCriterion: 'National Importance', actionable: 'Draft NIW petition essay citing AI national security memos', timeToClose: '6-8 weeks', difficulty: 'hard', citation: 'Matter of Dhanasar, 26 I&N Dec. 884' }
      ]),
      timeline_months: 22, estimated_cost_usd: 10000,
      explanation: 'AI founders have strong NIW arguments under Dhanasar. Longer timeline but leads to Green Card without employer sponsor.',
      citations: JSON.stringify(['INA §203(b)(2)(B)', 'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)']),
      confidence_score: 68
    },
    {
      id: uuidv4(), user_id: sofia.id,
      visa_category: 'EB-1A', fit_score: 88,
      criteria_met: JSON.stringify(['Forbes 30 Under 30', 'International competition judge', 'Peer reviewer', '12 publications 340 citations', 'Critical role as CTO']),
      criteria_missing: JSON.stringify(['High salary evidence']),
      evidence_gaps: JSON.stringify([
        { missingCriterion: 'High Salary', actionable: 'Get wage comparison showing top 10% for CTO in clean energy sector', timeToClose: '2 weeks', difficulty: 'easy', citation: '8 CFR 204.5(h)(3)(ix)' }
      ]),
      timeline_months: 18, estimated_cost_usd: 15000,
      explanation: 'Excellent EB-1A profile. Meets 5+ criteria. I-140 already filed is a great start.',
      citations: JSON.stringify(['INA §203(b)(1)(A)', '8 CFR 204.5(h)(3)']),
      confidence_score: 91
    },
    {
      id: uuidv4(), user_id: wei.id,
      visa_category: 'H-1B', fit_score: 90,
      criteria_met: JSON.stringify(['Specialty occupation (ML Engineer)', "Bachelor's degree equivalent"]),
      criteria_missing: JSON.stringify([]),
      evidence_gaps: JSON.stringify([]),
      timeline_months: 7, estimated_cost_usd: 5000,
      explanation: 'Strong H-1B renewal. Specialty occupation well documented. I-140 approval strengthens the case.',
      citations: JSON.stringify(['INA §101(a)(15)(H)(i)(b)', '8 CFR 214.2(h)(4)']),
      confidence_score: 88
    }
  ];

  const insertAssessment = db.prepare(`
    INSERT OR IGNORE INTO visa_assessments (
      id, user_id, visa_category, fit_score,
      criteria_met, criteria_missing, evidence_gaps,
      timeline_months, estimated_cost_usd,
      explanation, citations, confidence_score
    ) VALUES (?,?,?,?, ?,?,?, ?,?, ?,?,?)
  `);

  for (const a of assessments) {
    insertAssessment.run(
      a.id, a.user_id, a.visa_category, a.fit_score,
      a.criteria_met, a.criteria_missing, a.evidence_gaps,
      a.timeline_months, a.estimated_cost_usd,
      a.explanation, a.citations, a.confidence_score
    );
    console.log(`  ✅ Assessment: ${a.visa_category} — ${a.fit_score}% fit`);
  }

  // ── Travel advisories ──────────────────────────────────────────────────────
  const lucas = users.find(u => u.name === 'Lucas Weber');

  const travels = [
    {
      id: uuidv4(), user_id: arjun.id,
      destination_country: 'India', purpose: 'Family visit',
      travel_date: '2025-08-10', return_date: '2025-08-25',
      risk_level: 'MEDIUM',
      risk_factors: JSON.stringify([
        { factor: 'H-1B visa stamp — verify expiry before travel', severity: 'MEDIUM', citation: '8 CFR 214.2(h)', explanation: 'Status and visa stamp are different. Check stamp in passport.' }
      ]),
      recommendations: JSON.stringify([
        { action: 'Verify H-1B visa stamp expiry in your passport', priority: 'BEFORE_TRAVEL', explanation: 'Renew at US Embassy in India if stamp expires before return date' },
        { action: 'Carry I-797 approval notice + last 3 pay stubs', priority: 'BEFORE_TRAVEL', explanation: 'CBP may request proof of valid status on re-entry' }
      ]),
      document_checklist: JSON.stringify([
        { document: 'Valid H-1B visa stamp', required: true, reason: 'Required for US re-entry', obtainedFrom: 'US Embassy New Delhi if renewal needed' },
        { document: 'I-797 H-1B Approval Notice', required: true, reason: 'Proof of valid status', obtainedFrom: 'Immigration attorney / USCIS' },
        { document: 'Last 3 pay stubs', required: true, reason: 'Proof of continued employment', obtainedFrom: 'Employer payroll' }
      ]),
      notes: 'MEDIUM risk. Verify visa stamp validity before travel.'
    },
    {
      id: uuidv4(), user_id: lucas.id,
      destination_country: 'Germany', purpose: 'Business meeting / conference',
      travel_date: '2025-07-01', return_date: '2025-07-14',
      risk_level: 'CRITICAL',
      risk_factors: JSON.stringify([
        { factor: 'Pending I-485 without Advance Parole', severity: 'CRITICAL', citation: '8 CFR 245.2(a)(4)(ii)', explanation: 'Traveling with pending I-485 and no AP = abandonment of Green Card application.' }
      ]),
      recommendations: JSON.stringify([
        { action: 'DO NOT TRAVEL until Advance Parole is approved', priority: 'IMMEDIATE', explanation: 'Leaving the US abandons your pending I-485. File I-131 for AP immediately.' },
        { action: 'File I-131 Advance Parole Application now', priority: 'IMMEDIATE', explanation: 'USCIS processing: 3-5 months. Request expedite if urgent.' }
      ]),
      document_checklist: JSON.stringify([
        { document: 'Approved Advance Parole (I-512L)', required: true, reason: 'MANDATORY for travel with pending I-485', obtainedFrom: 'USCIS — file I-131 first' }
      ]),
      notes: 'CRITICAL: Do not travel. I-485 pending without AP.'
    }
  ];

  const insertTravel = db.prepare(`
    INSERT OR IGNORE INTO travel_advisories (
      id, user_id, destination_country, purpose,
      travel_date, return_date, risk_level,
      risk_factors, recommendations, document_checklist, notes
    ) VALUES (?,?,?,?, ?,?,?, ?,?,?,?)
  `);

  for (const t of travels) {
    insertTravel.run(
      t.id, t.user_id, t.destination_country, t.purpose,
      t.travel_date, t.return_date, t.risk_level,
      t.risk_factors, t.recommendations, t.document_checklist, t.notes
    );
    console.log(`  ✅ Travel: ${t.destination_country} — ${t.risk_level} risk`);
  }

  // ── Documents ──────────────────────────────────────────────────────────────
  const documents = [
    {
      id: uuidv4(), user_id: arjun.id,
      doc_type: 'employment_verification',
      title: 'Employment Verification Letter — Arjun Sharma',
      content: `[TechFlow AI Letterhead]

April 12, 2026

To Whom It May Concern / U.S. Customs and Border Protection

RE: Employment Verification and Travel Authorization for Arjun Sharma

This letter confirms that Arjun Sharma is employed as Chief Executive Officer at TechFlow AI, Inc., a Delaware C-Corporation incorporated on January 15, 2023, currently operating in San Francisco, California.

Mr. Sharma holds H-1B nonimmigrant status, approved through September 30, 2025, pursuant to INA §101(a)(15)(H)(i)(b) and 8 CFR 214.2(h). He is traveling to India from August 10, 2025 to August 25, 2025 for a family visit and is expected to return to the United States on August 25, 2025 to resume full-time duties at TechFlow AI.

Mr. Sharma's continued presence is critical to TechFlow AI's operations. For verification, please contact: hr@techflow.io.

Sincerely,
[General Counsel Signature]
TechFlow AI, Inc.`,
      citations: JSON.stringify(['INA §101(a)(15)(H)(i)(b)', '8 CFR 214.2(h)']),
      confidence_score: 85, attorney_reviewed: 0,
      metadata: JSON.stringify({ keyPoints: ['H-1B status confirmed', 'Travel dates specified', 'Return date confirmed'] })
    },
    {
      id: uuidv4(), user_id: sofia.id,
      doc_type: 'founder_role',
      title: 'Co-Founder Critical Role Letter — Sofia Mendes',
      content: `[GreenPulse Energy Letterhead]

April 12, 2026

United States Citizenship and Immigration Services

RE: O-1A Petition Support — Sofia Mendes, Co-Founder & CTO

Ms. Mendes co-founded GreenPulse Energy in 2022 and holds a 30% equity stake. As CTO she leads 18 engineers developing proprietary grid optimization algorithms, directly resulting in 3 granted patents and 340 peer citations. Her recognition as a Forbes 30 Under 30 honoree and international competition judge establishes extraordinary ability under 8 CFR 214.2(o)(3)(iii)(G) and (E).

Respectfully submitted,
[CEO Signature]
GreenPulse Energy, Inc.`,
      citations: JSON.stringify(['8 CFR 214.2(o)(3)(iii)(G)', '8 CFR 214.2(o)(3)(iii)(E)', 'INA §101(a)(15)(O)']),
      confidence_score: 92, attorney_reviewed: 1,
      metadata: JSON.stringify({ keyPoints: ['Equity stake documented', 'Critical role established', 'Patents cited'] })
    },
    {
      id: uuidv4(), user_id: wei.id,
      doc_type: 'offer_letter',
      title: 'Offer Letter with H-1B Sponsorship — Wei Zhang',
      content: `[CorpTech Solutions Letterhead]

April 12, 2026

RE: Continued Employment and H-1B Sponsorship — Wei Zhang

Position: Senior Software Engineer, ML Infrastructure
Annual Salary: $160,000 USD | Seattle, WA

CorpTech Solutions will sponsor and maintain Wei Zhang's H-1B status pursuant to INA §101(a)(15)(H)(i)(b) and 8 CFR 214.2(h). All required LCA filings will be submitted in compliance with 20 CFR 655.731. Compensation meets or exceeds the prevailing wage for this role in the Seattle MSA.

[VP Engineering Signature]
CorpTech Solutions, Inc.`,
      citations: JSON.stringify(['INA §101(a)(15)(H)(i)(b)', '8 CFR 214.2(h)', '20 CFR 655.731']),
      confidence_score: 90, attorney_reviewed: 1,
      metadata: JSON.stringify({ keyPoints: ['Specialty occupation confirmed', 'Prevailing wage commitment', 'LCA compliance noted'] })
    },
    {
      id: uuidv4(), user_id: arjun.id,
      doc_type: 'rfe_response',
      title: 'RFE Response — O-1A High Salary Criterion',
      content: `RE: RFE Response | Receipt No.: EAC-25-123-45678 | Deadline: May 30, 2026

The RFE challenged the High Salary criterion under 8 CFR 214.2(o)(3)(iii)(H).

EVIDENCE SUBMITTED (Exhibit O-8):
1. BLS OES data: Mr. Sharma's $180,000 exceeds the 90th percentile for software engineering CEOs in San Francisco.
2. Radford Global Technology Survey (2025): $180,000 is at the 87th percentile for seed-stage AI company CEOs.
3. Prior offer letter at $165,000 from CorpTech Solutions — demonstrating consistent above-market compensation.

Pursuant to Matter of Price, 20 I&N Dec. 953 (BIA 1994), this evidence conclusively establishes high salary relative to peers.

[Immigration Attorney Signature]`,
      citations: JSON.stringify(['8 CFR 214.2(o)(3)(iii)(H)', 'Matter of Price, 20 I&N Dec. 953 (BIA 1994)']),
      confidence_score: 82, attorney_reviewed: 0,
      metadata: JSON.stringify({ rebuttalStrength: 'STRONG', evidenceRequested: ['BLS wage data', 'Radford survey', 'Prior offer letters'] })
    }
  ];

  const insertDoc = db.prepare(`
    INSERT OR IGNORE INTO documents (
      id, user_id, doc_type, title, content,
      citations, confidence_score, attorney_reviewed, metadata
    ) VALUES (?,?,?,?,?, ?,?,?,?)
  `);

  for (const d of documents) {
    insertDoc.run(
      d.id, d.user_id, d.doc_type, d.title, d.content,
      d.citations, d.confidence_score, d.attorney_reviewed, d.metadata
    );
    console.log(`  ✅ Document: ${d.title.slice(0, 55)}`);
  }

  // ── Policy alerts ──────────────────────────────────────────────────────────
  const alerts = [
    {
      id: uuidv4(), alert_type: 'policy_memo', source: 'USCIS',
      title: 'USCIS Updates O-1A Guidance for Startup Founders',
      summary: 'Startup founders who own significant equity can satisfy the "critical role" criterion under 8 CFR 214.2(o)(3)(iii)(G) provided the company is a distinguished organization through funding, revenue, or industry recognition.',
      affected_visas: JSON.stringify(['O-1A']), severity: 'INFO'
    },
    {
      id: uuidv4(), alert_type: 'cap_update', source: 'USCIS',
      title: 'H-1B FY2026 Cap Registration Opens March 7, 2026',
      summary: 'H-1B cap registration for FY2026 opens March 7 and closes March 22, 2026. The $215 registration fee applies. Results announced by March 31.',
      affected_visas: JSON.stringify(['H-1B']), severity: 'WARNING'
    },
    {
      id: uuidv4(), alert_type: 'visa_bulletin', source: 'DOS',
      title: 'April 2026 Visa Bulletin: EB-2 India Retrogresses to 2012',
      summary: 'EB-2 India priority dates retrogressed to January 1, 2012. This affects Indian nationals with pending I-485 under EB-2. EB-1 India remains at January 1, 2022.',
      affected_visas: JSON.stringify(['EB-2-NIW', 'EB-1A']), severity: 'CRITICAL'
    },
    {
      id: uuidv4(), alert_type: 'policy_memo', source: 'USCIS',
      title: 'USCIS Extends EAD Automatic Extension to 540 Days',
      summary: 'USCIS finalized rule extending the automatic employment authorization extension period from 180 to 540 days for eligible EAD renewal applicants. Effective May 4, 2025.',
      affected_visas: JSON.stringify(['EAD', 'F-1 OPT', 'H-4 EAD']), severity: 'INFO'
    }
  ];

  const insertAlert = db.prepare(`
    INSERT OR IGNORE INTO policy_alerts (id, alert_type, source, title, summary, affected_visas, severity)
    VALUES (?,?,?,?,?,?,?)
  `);

  for (const a of alerts) {
    insertAlert.run(a.id, a.alert_type, a.source, a.title, a.summary, a.affected_visas, a.severity);
    console.log(`  ✅ Alert: ${a.title.slice(0, 55)}`);
  }

  // ── Employee roster for Sarah Johnson (company persona) ──────────────────
  const sarah = users.find(u => u.name === 'Sarah Johnson');

  const rosterEmployees = [
    {
      id: uuidv4(), company_user_id: sarah.id,
      employee_name: 'Priya Patel',       employee_email: 'priya@quantumlabs.com',
      citizenship: 'India',               job_title: 'Senior ML Engineer',
      visa_type: 'H-1B',                  visa_expiry: '2026-09-30',
      i94_expiry: '2026-09-30',           salary: 175000,
      lca_status: 'valid',                i9_status: 'complete',
      pending_applications: JSON.stringify(['I-140']),
      notes: 'Strong EB-2 NIW candidate. I-140 filed April 2026.'
    },
    {
      id: uuidv4(), company_user_id: sarah.id,
      employee_name: 'Liam O\'Brien',     employee_email: 'liam@quantumlabs.com',
      citizenship: 'Canada',              job_title: 'DevOps Lead',
      visa_type: 'TN',                    visa_expiry: '2026-06-15',
      i94_expiry: '2026-06-15',           salary: 155000,
      lca_status: 'not_required',         i9_status: 'complete',
      pending_applications: JSON.stringify([]),
      notes: 'TN renewal due June 2026. Approved at border last time.'
    },
    {
      id: uuidv4(), company_user_id: sarah.id,
      employee_name: 'Fatima Al-Hassan',  employee_email: 'fatima@quantumlabs.com',
      citizenship: 'Nigeria',             job_title: 'Research Scientist',
      visa_type: 'O-1A',                  visa_expiry: '2027-02-28',
      i94_expiry: '2027-02-28',           salary: 195000,
      lca_status: 'not_required',         i9_status: 'complete',
      pending_applications: JSON.stringify(['I-140']),
      notes: 'PhD MIT. EB-1A self-petition in progress. Strong profile.'
    },
    {
      id: uuidv4(), company_user_id: sarah.id,
      employee_name: 'Raj Krishnamurthy', employee_email: 'raj@quantumlabs.com',
      citizenship: 'India',               job_title: 'Staff Engineer',
      visa_type: 'H-1B',                  visa_expiry: '2025-05-15',
      i94_expiry: '2025-05-15',           salary: 210000,
      lca_status: 'expiring_soon',        i9_status: 'reverification_needed',
      pending_applications: JSON.stringify(['H-1B Extension']),
      notes: '⚠️ URGENT: H-1B expires May 15 2026. Extension in progress. LCA renewal also needed.'
    },
    {
      id: uuidv4(), company_user_id: sarah.id,
      employee_name: 'Mei Chen',          employee_email: 'mei@quantumlabs.com',
      citizenship: 'China',               job_title: 'Product Manager',
      visa_type: 'H-1B',                  visa_expiry: '2027-08-01',
      i94_expiry: '2027-08-01',           salary: 165000,
      lca_status: 'valid',                i9_status: 'complete',
      pending_applications: JSON.stringify(['I-485', 'I-140']),
      notes: 'EB-2 NIW self-petition approved. I-485 pending. No travel without AP.'
    },
    {
      id: uuidv4(), company_user_id: sarah.id,
      employee_name: 'Jonas Weber',       employee_email: 'jonas@quantumlabs.com',
      citizenship: 'Germany',             job_title: 'Principal Engineer',
      visa_type: 'L-1A',                  visa_expiry: '2028-01-10',
      i94_expiry: '2028-01-10',           salary: 230000,
      lca_status: 'not_required',         i9_status: 'complete',
      pending_applications: JSON.stringify(['I-140']),
      notes: 'Transferred from Berlin office. EB-1C Green Card path in progress.'
    }
  ];

  const insertRoster = db.prepare(`
    INSERT OR IGNORE INTO employee_roster (
      id, company_user_id, employee_name, employee_email,
      citizenship, job_title, visa_type, visa_expiry,
      i94_expiry, salary, lca_status, i9_status,
      pending_applications, notes
    ) VALUES (?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?)
  `);

  for (const e of rosterEmployees) {
    insertRoster.run(
      e.id, e.company_user_id, e.employee_name, e.employee_email,
      e.citizenship, e.job_title, e.visa_type, e.visa_expiry,
      e.i94_expiry, e.salary, e.lca_status, e.i9_status,
      e.pending_applications, e.notes
    );
    console.log(`  ✅ Roster: ${e.employee_name} (${e.visa_type}) — ${e.lca_status}`);
  }

  // ── Demo hiring analysis result for Sarah ────────────────────────────────
  const demoAnalysis = {
    id: uuidv4(), user_id: sarah.id,
    candidate_info: JSON.stringify({
      candidateName: 'Aisha Mensah',
      candidateCountry: 'Ghana',
      jobTitle: 'Senior Data Scientist',
      salary: 170000,
      jobCategory: 'Data Scientist / ML Engineer',
      yearsExperience: 6,
      hasExtraordinaryAbility: false,
      foreignCompanyRelationship: false
    }),
    analysis: JSON.stringify({
      recommendedVisa: {
        category: 'H-1B',
        reason: 'Specialty occupation in data science with required degree. H-1B is the standard sponsorship path for this role and salary.',
        employerSponsorRequired: true,
        estimatedCost: 8500,
        timelineMonths: 10,
        citations: ['INA §101(a)(15)(H)(i)(b)', '8 CFR 214.2(h)', '20 CFR 655.731']
      },
      allOptions: [
        { category: 'H-1B', fitScore: 85, employerCost: 8500, timelineMonths: 10, pros: ['Standard path for specialty occupation', 'No extraordinary ability required'], cons: ['Annual lottery', 'Oct 1 start only'], employerObligations: ['File LCA', 'Pay prevailing wage', 'Maintain Public Access File'] },
        { category: 'O-1A', fitScore: 35, employerCost: 12000, timelineMonths: 4, pros: ['No lottery', 'Any start date'], cons: ['Requires extraordinary ability evidence', 'High evidentiary bar'], employerObligations: ['File I-129', 'No LCA required'] }
      ],
      hiringSteps: [
        { step: 1, action: 'Determine prevailing wage via DOL OWL', owner: 'HR', timeline: 'Week 1', notes: 'Use DOL Online Wage Library to find Level II prevailing wage for Data Scientist in your MSA.' },
        { step: 2, action: 'File Labor Condition Application (LCA)', owner: 'Attorney', timeline: 'Weeks 1-2', notes: 'File on FLAG system. Must be certified before I-129 is filed. Usually takes 7 business days.' },
        { step: 3, action: 'Post LCA notice at worksite', owner: 'HR', timeline: '10 business days', notes: 'Post for 10 consecutive business days before filing I-129.' },
        { step: 4, action: 'Register in H-1B lottery (if cap-subject)', owner: 'Attorney', timeline: 'March 1-22', notes: 'Register during USCIS electronic registration window. $215 fee per registration.' },
        { step: 5, action: 'File I-129 petition if selected', owner: 'Attorney', timeline: 'April 1', notes: 'File with all supporting documents. Consider premium processing ($2,805) for 15-day decision.' },
        { step: 6, action: 'Complete I-9 on first day of work', owner: 'HR', timeline: 'Oct 1', notes: 'Complete within 3 business days of start date. Do not specify documents to present.' }
      ],
      complianceChecklist: {
        lcaRequired: true,
        lcaSteps: ['File LCA on DOL FLAG system', 'Obtain LCA certification (7 business days)', 'Post LCA notice 10 days before I-129 filing', 'Maintain Public Access File at worksite'],
        i9Steps: ['Complete Section 2 within 3 business days', 'Accept any valid List A or List B+C documents', 'Set calendar reminder for re-verification before visa expiry'],
        publicAccessFileItems: ['Copy of certified LCA', 'Wage rate documentation', 'Documentation of prevailing wage', 'Union notification or posting notice'],
        ongoingObligations: ['Pay at least prevailing wage at all times', 'Notify USCIS of material changes', 'Pay return transportation if dismissed early', 'Re-verify I-9 before H-1B expiry']
      },
      riskFlags: ['Ghana not in VWP — candidate needs valid visa for entry', 'H-1B lottery selection not guaranteed (~50% odds)', 'Gap between offer acceptance and Oct 1 start — plan for remote work or other status'],
      estimatedTotalCost: 11300,
      confidenceScore: 88
    })
  };

  db.prepare(`
    INSERT OR IGNORE INTO hiring_analyses (id, user_id, candidate_info, analysis, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(demoAnalysis.id, demoAnalysis.user_id, demoAnalysis.candidate_info, demoAnalysis.analysis);
  console.log(`  ✅ Hiring analysis: Aisha Mensah → H-1B recommendation`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✨ Demo data seeded successfully!\n');
  console.log('Demo users — copy an ID to test API calls or log in:');
  console.log('─'.repeat(70));
  for (const u of users) {
    console.log(`  ${u.persona_type.padEnd(18)} ${u.name.padEnd(20)} ${u.id}`);
  }
  console.log('─'.repeat(70) + '\n');
}

seed().catch(err => { console.error(err); process.exit(1); });
