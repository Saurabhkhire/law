// Letter templates used by documentDrafterAgent
// Each template has a structure and required fields

const LETTER_TEMPLATES = {
  employment_verification: {
    title: 'Employment Verification Letter',
    description: 'Confirms employment status, role, and visa for CBP/immigration use',
    requiredFields: ['employeeName', 'jobTitle', 'companyName', 'visaType', 'travelPurpose', 'returnDate'],
    legalBasis: 'INA §214; 8 CFR 214.2',
    useCase: 'Show at airport when returning to US or questioned about employment status'
  },

  business_travel: {
    title: 'Business Travel Verification Letter',
    description: 'Explains purpose of international business trip for border agents',
    requiredFields: ['travelerName', 'destination', 'purpose', 'companyName', 'travelDates', 'hostOrganization'],
    legalBasis: '8 CFR 214.2(b) - B-1 permissible activities',
    useCase: 'Present to foreign border control or US CBP when traveling for business'
  },

  founder_role: {
    title: 'Founder / Co-Founder Role Verification Letter',
    description: 'Establishes founder\'s critical role, equity, and company details',
    requiredFields: ['founderName', 'companyName', 'incorporationDate', 'fundingStage', 'equityPercent', 'role', 'visaType'],
    legalBasis: '8 CFR 214.2(o)(3)(iii)(G) - Critical Role criterion',
    useCase: 'Support O-1A petition; show at border; establish extraordinary ability'
  },

  advance_parole_travel: {
    title: 'Advance Parole Travel Authorization Letter',
    description: 'Explains AP status and re-entry rights for pending Green Card holders',
    requiredFields: ['travelerName', 'apCardNumber', 'pendingCaseType', 'travelPurpose', 'returnDate'],
    legalBasis: '8 CFR 245.2(a)(4)(ii); INA §212(d)(5)',
    useCase: 'Must carry alongside AP card when traveling with pending I-485'
  },

  reentry_support: {
    title: 'US Re-Entry Support Letter',
    description: 'Attorney or employer letter supporting lawful re-entry to US',
    requiredFields: ['travelerName', 'visaType', 'visaExpiry', 'employerName', 'returnDate', 'pendingPetitions'],
    legalBasis: 'INA §235; 8 CFR 235.1',
    useCase: 'Present to CBP officer when questioned about admissibility on return'
  },

  b1_business_purpose: {
    title: 'B-1 Business Visitor Purpose Letter',
    description: 'Clarifies permitted B-1 activities and disclaims intent to work',
    requiredFields: ['visitorName', 'companyName', 'visitPurpose', 'hostCompany', 'duration', 'homeCountry'],
    legalBasis: '8 CFR 214.2(b)(1); 9 FAM 402.2',
    useCase: 'Pre-incorporation founders entering US for investor meetings or business planning'
  },

  sponsorship_intent: {
    title: 'H-1B Sponsorship Intent Letter',
    description: 'Company\'s commitment to sponsor employee for H-1B visa',
    requiredFields: ['employeeName', 'jobTitle', 'salary', 'companyName', 'startDate', 'legalCounsel'],
    legalBasis: 'INA §101(a)(15)(H)(i)(b); 8 CFR 214.2(h)',
    useCase: 'Attach to offer letter for foreign national employees; shows visa sponsorship commitment'
  },

  offer_letter: {
    title: 'Offer Letter with Visa Sponsorship',
    description: 'Formal offer letter including visa sponsorship terms for international hires',
    requiredFields: ['employeeName', 'jobTitle', 'salary', 'startDate', 'companyName', 'visaType', 'workLocation'],
    legalBasis: 'INA §101(a)(15)(H)(i)(b); LCA requirements 20 CFR 655.731',
    useCase: 'Formal offer to international hire; includes sponsorship commitment'
  },

  critical_role_declaration: {
    title: 'Critical Role Declaration Letter',
    description: 'Expert letter declaring the petitioner\'s essential role in their organization',
    requiredFields: ['subjectName', 'organizationName', 'authorName', 'authorTitle', 'relationship', 'criticalActivities'],
    legalBasis: '8 CFR 214.2(o)(3)(iii)(G); 8 CFR 204.5(h)(3)(viii)',
    useCase: 'Support O-1A or EB-1A petition under critical role criterion'
  },

  rfe_response_cover: {
    title: 'RFE Response Cover Letter',
    description: 'Cover letter for responding to USCIS Request for Further Evidence',
    requiredFields: ['petitionerName', 'receiptNumber', 'rfeDate', 'responseDeadline', 'criteriaAddressed', 'evidenceList'],
    legalBasis: '8 CFR 103.2(b)(8); INA §291',
    useCase: 'Open a comprehensive RFE response package'
  }
};

module.exports = { LETTER_TEMPLATES };
