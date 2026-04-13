// USCIS visa criteria knowledge base
// Sources: USCIS Policy Manual, INA, 8 CFR
// Used by visaStrategyAgent for RAG-style matching

const VISA_RULES = {
  'O-1A': {
    name: 'O-1A Extraordinary Ability',
    description: 'For individuals with extraordinary ability in sciences, education, business, or athletics',
    citation: 'INA §101(a)(15)(O); 8 CFR 214.2(o)',
    policyUrl: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement',
    minCriteriaMet: 3,
    totalCriteria: 8,
    timelineMonths: { min: 3, max: 6 },
    estimatedCostUsd: { min: 5000, max: 15000 },
    criteria: [
      {
        id: 'o1a_awards',
        name: 'Major Awards / Prizes',
        description: 'Receipt of nationally or internationally recognized prizes or awards for excellence',
        citation: '8 CFR 214.2(o)(3)(iii)(A)',
        signals: ['award', 'prize', 'recognition', 'honor', 'trophy', 'competition winner']
      },
      {
        id: 'o1a_membership',
        name: 'Exclusive Membership',
        description: 'Membership in associations requiring outstanding achievements judged by experts',
        citation: '8 CFR 214.2(o)(3)(iii)(B)',
        signals: ['member', 'fellow', 'elected', 'association', 'society', 'academy']
      },
      {
        id: 'o1a_press',
        name: 'Published Material About You',
        description: 'Published material in professional or major media about your work',
        citation: '8 CFR 214.2(o)(3)(iii)(C)',
        signals: ['featured', 'article', 'interview', 'techcrunch', 'forbes', 'press', 'media', 'news']
      },
      {
        id: 'o1a_judging',
        name: 'Judge of Others',
        description: 'Participation as a judge of others in the same or allied field',
        citation: '8 CFR 214.2(o)(3)(iii)(D)',
        signals: ['reviewer', 'judge', 'panel', 'committee', 'peer review', 'program committee']
      },
      {
        id: 'o1a_contributions',
        name: 'Original Contributions',
        description: 'Original scientific, scholarly, or business contributions of major significance',
        citation: '8 CFR 214.2(o)(3)(iii)(E)',
        signals: ['patent', 'invention', 'research', 'publication', 'paper', 'original', 'novel', 'breakthrough']
      },
      {
        id: 'o1a_scholarly',
        name: 'Scholarly Articles',
        description: 'Authorship of scholarly articles in professional journals or major media',
        citation: '8 CFR 214.2(o)(3)(iii)(F)',
        signals: ['publication', 'paper', 'journal', 'conference', 'proceedings', 'author', 'co-author']
      },
      {
        id: 'o1a_critical_role',
        name: 'Critical Role',
        description: 'Employment in a critical or essential role for distinguished organizations',
        citation: '8 CFR 214.2(o)(3)(iii)(G)',
        signals: ['founder', 'ceo', 'cto', 'lead', 'director', 'head', 'principal', 'chief']
      },
      {
        id: 'o1a_high_salary',
        name: 'High Salary',
        description: 'Commanding a high salary or remuneration relative to peers',
        citation: '8 CFR 214.2(o)(3)(iii)(H)',
        signals: ['salary', 'compensation', 'equity', 'income', 'top 10%', 'top percentile']
      }
    ],
    bestFor: ['founder', 'cofounder', 'employee'],
    notes: 'Strong option for startup founders with press coverage, patents, or speaking invitations. Does not require employer sponsorship as a founder.'
  },

  'EB-1A': {
    name: 'EB-1A Extraordinary Ability (Green Card)',
    description: 'Employment-based Green Card for aliens of extraordinary ability who can self-petition',
    citation: 'INA §203(b)(1)(A); 8 CFR 204.5(h)',
    policyUrl: 'https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1',
    minCriteriaMet: 3,
    totalCriteria: 10,
    timelineMonths: { min: 12, max: 36 },
    estimatedCostUsd: { min: 8000, max: 25000 },
    criteria: [
      { id: 'eb1a_awards', name: 'Lesser Nationally Recognized Prizes', citation: '8 CFR 204.5(h)(3)(i)', signals: ['award', 'prize', 'recognition'] },
      { id: 'eb1a_membership', name: 'Membership Requiring Outstanding Achievement', citation: '8 CFR 204.5(h)(3)(ii)', signals: ['member', 'fellow', 'elected'] },
      { id: 'eb1a_press', name: 'Published Material About You', citation: '8 CFR 204.5(h)(3)(iii)', signals: ['press', 'article', 'media', 'featured'] },
      { id: 'eb1a_judging', name: 'Judging the Work of Others', citation: '8 CFR 204.5(h)(3)(iv)', signals: ['judge', 'reviewer', 'panel', 'peer review'] },
      { id: 'eb1a_contributions', name: 'Original Contributions of Major Significance', citation: '8 CFR 204.5(h)(3)(v)', signals: ['patent', 'research', 'original', 'breakthrough'] },
      { id: 'eb1a_scholarly', name: 'Authorship of Scholarly Articles', citation: '8 CFR 204.5(h)(3)(vi)', signals: ['publication', 'paper', 'journal', 'author'] },
      { id: 'eb1a_critical_role', name: 'Critical Role for Distinguished Organizations', citation: '8 CFR 204.5(h)(3)(viii)', signals: ['founder', 'ceo', 'lead', 'director'] },
      { id: 'eb1a_high_salary', name: 'High Salary Relative to Others', citation: '8 CFR 204.5(h)(3)(ix)', signals: ['salary', 'compensation', 'top percentile'] },
      { id: 'eb1a_commercial_success', name: 'Commercial Success in Performing Arts', citation: '8 CFR 204.5(h)(3)(x)', signals: ['revenue', 'sales', 'commercial'] },
      { id: 'eb1a_display', name: 'Display at Artistic Exhibitions', citation: '8 CFR 204.5(h)(3)(vii)', signals: ['exhibition', 'showcase', 'gallery'] }
    ],
    bestFor: ['founder', 'cofounder'],
    notes: 'Self-petition possible — no employer sponsor needed. Best path to Green Card for exceptional founders.'
  },

  'EB-2-NIW': {
    name: 'EB-2 National Interest Waiver',
    description: 'Green Card for advanced degree or exceptional ability professionals who benefit the US national interest',
    citation: 'INA §203(b)(2)(B); Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)',
    policyUrl: 'https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2',
    minCriteriaMet: 3,
    totalCriteria: 3,
    timelineMonths: { min: 18, max: 36 },
    estimatedCostUsd: { min: 5000, max: 15000 },
    criteria: [
      {
        id: 'niw_substantial_merit',
        name: 'Substantial Merit and National Importance',
        description: 'The proposed endeavor has both substantial merit and national importance',
        citation: 'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)',
        signals: ['ai', 'technology', 'healthcare', 'clean energy', 'national security', 'startup', 'innovation']
      },
      {
        id: 'niw_well_positioned',
        name: 'Well Positioned to Advance the Endeavor',
        description: 'You are well positioned to advance the proposed endeavor',
        citation: 'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)',
        signals: ['phd', 'expert', 'years experience', 'track record', 'published', 'cited']
      },
      {
        id: 'niw_beneficial',
        name: 'Beneficial to Waive Job Offer Requirement',
        description: 'On balance, it would be beneficial to the US to waive the job offer requirement',
        citation: 'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016)',
        signals: ['unique', 'scarce', 'irreplaceable', 'us jobs', 'economic benefit']
      }
    ],
    bestFor: ['founder', 'cofounder', 'employee', 'preincorporation'],
    notes: 'Excellent for AI/tech founders. Self-petition possible. Dhanasar standard is favorable for startup founders in national-priority fields.'
  },

  'H-1B': {
    name: 'H-1B Specialty Occupation',
    description: 'Temporary work visa for specialty occupation workers requiring at least a bachelor\'s degree',
    citation: 'INA §101(a)(15)(H)(i)(b); 8 CFR 214.2(h)',
    policyUrl: 'https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations',
    minCriteriaMet: 2,
    totalCriteria: 2,
    timelineMonths: { min: 6, max: 10 },
    estimatedCostUsd: { min: 3000, max: 10000 },
    criteria: [
      {
        id: 'h1b_specialty',
        name: 'Specialty Occupation',
        description: 'Position requires theoretical and practical application of highly specialized knowledge',
        citation: '8 CFR 214.2(h)(4)(ii)',
        signals: ['software', 'engineer', 'developer', 'scientist', 'analyst', 'architect', 'designer']
      },
      {
        id: 'h1b_degree',
        name: "Bachelor's Degree or Equivalent",
        description: "Bachelor's or higher degree in a specific specialty",
        citation: '8 CFR 214.2(h)(4)(iii)',
        signals: ["bachelor's", "master's", 'phd', 'degree', 'bs', 'ms', 'mba']
      }
    ],
    bestFor: ['employee'],
    caveats: [
      'Subject to annual lottery cap (65,000 + 20,000 masters cap)',
      'Lottery registration in March for October 1 start',
      'Ownership >50% of sponsoring company may create issues',
      'Requires employer sponsorship — founders cannot self-petition'
    ],
    notes: 'Not ideal for founders who own significant equity. Consider O-1A instead.'
  },

  'L-1A': {
    name: 'L-1A Intracompany Transferee (Manager/Executive)',
    description: 'Transfer managers or executives from a foreign affiliate to a US entity',
    citation: 'INA §101(a)(15)(L); 8 CFR 214.2(l)',
    policyUrl: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager',
    minCriteriaMet: 2,
    totalCriteria: 2,
    timelineMonths: { min: 3, max: 6 },
    estimatedCostUsd: { min: 4000, max: 12000 },
    criteria: [
      {
        id: 'l1a_employment',
        name: '1 Year Employment Abroad',
        description: 'Employed by qualifying foreign organization for 1 continuous year within last 3 years',
        citation: '8 CFR 214.2(l)(1)(ii)',
        signals: ['worked abroad', 'foreign company', 'international', 'overseas employment']
      },
      {
        id: 'l1a_role',
        name: 'Executive or Managerial Role',
        description: 'Coming to serve in executive or managerial capacity',
        citation: '8 CFR 214.2(l)(1)(ii)(B)',
        signals: ['ceo', 'cto', 'coo', 'vp', 'director', 'manager', 'executive', 'head']
      }
    ],
    bestFor: ['founder', 'cofounder'],
    notes: 'Great for founders who have an existing company abroad and want to expand to the US. Leads directly to EB-1C Green Card path.'
  },

  'TN': {
    name: 'TN NAFTA/USMCA Professional',
    description: 'Work authorization for Canadian and Mexican citizens in specific professional categories',
    citation: 'INA §214(e); USMCA Annex 16-A',
    policyUrl: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals',
    minCriteriaMet: 2,
    totalCriteria: 2,
    timelineMonths: { min: 0, max: 1 },
    estimatedCostUsd: { min: 500, max: 2000 },
    criteria: [
      {
        id: 'tn_citizenship',
        name: 'Canadian or Mexican Citizen',
        description: 'Must be citizen of Canada or Mexico',
        citation: 'USMCA Annex 16-A',
        signals: ['canadian', 'mexican', 'canada', 'mexico']
      },
      {
        id: 'tn_profession',
        name: 'Qualifying Profession',
        description: 'Must work in a qualifying profession (engineers, scientists, accountants, lawyers, etc.)',
        citation: 'USMCA Annex 16-A, Schedule 2',
        signals: ['engineer', 'scientist', 'accountant', 'lawyer', 'architect', 'analyst', 'consultant']
      }
    ],
    bestFor: ['employee', 'founder'],
    notes: 'Fastest and cheapest option for Canadians (approved at border, no petition needed). Mexicans need consulate appointment.'
  },

  'E-2': {
    name: 'E-2 Treaty Investor',
    description: 'For nationals of treaty countries who invest substantial capital in a US business',
    citation: 'INA §101(a)(15)(E)(ii); 8 CFR 214.2(e)',
    policyUrl: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/all-visa-categories/treaty.html',
    minCriteriaMet: 3,
    totalCriteria: 3,
    timelineMonths: { min: 2, max: 5 },
    estimatedCostUsd: { min: 3000, max: 8000 },
    criteria: [
      {
        id: 'e2_treaty_country',
        name: 'Treaty Country Nationality',
        description: 'Must be a national of a country with a US Treaty of Commerce and Navigation',
        citation: '8 CFR 214.2(e)(1)',
        signals: ['uk', 'canada', 'australia', 'germany', 'france', 'japan', 'south korea', 'italy', 'spain', 'turkey']
      },
      {
        id: 'e2_substantial_investment',
        name: 'Substantial Investment',
        description: 'Must invest substantial capital (typically $100K+ for tech startups)',
        citation: '8 CFR 214.2(e)(12)',
        signals: ['investment', 'capital', 'funding', 'invested', 'seed round']
      },
      {
        id: 'e2_real_business',
        name: 'Real and Operating Business',
        description: 'Business must be real, operating, and not marginal',
        citation: '8 CFR 214.2(e)(14)',
        signals: ['incorporated', 'revenue', 'customers', 'employees', 'product']
      }
    ],
    bestFor: ['founder', 'cofounder', 'preincorporation'],
    notes: 'Not available to Indian or Chinese nationals (no treaty). No path to Green Card directly, but can pair with EB-2 NIW.'
  }
};

const TRAVEL_RULES = {
  advanceParoleRequired: ['pending_i485'],
  barRiskStatuses: ['unlawful_presence', 'overstay'],
  visasRequiringValidStamp: ['H-1B', 'L-1A', 'O-1A', 'TN', 'E-2'],
  safeToTravelStatuses: ['green_card', 'us_citizen', 'valid_ap'],
  homeCountryRisks: {
    'DACA': 'CRITICAL - Travel requires Advance Parole. Risk of denial at re-entry.',
    'pending_i485': 'CRITICAL - Travel without approved Advance Parole abandons Green Card application.',
    'expired_visa': 'HIGH - Cannot re-enter on expired visa stamp. Must renew abroad.',
    'unlawful_presence_180': 'HIGH - 3-year bar applies. Consult attorney before any travel.',
    'unlawful_presence_365': 'CRITICAL - 10-year bar applies. Do not travel.'
  }
};

module.exports = { VISA_RULES, TRAVEL_RULES };
