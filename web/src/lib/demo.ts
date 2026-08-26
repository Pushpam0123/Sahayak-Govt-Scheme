// Sample data used ONLY when the backend is unreachable, so the interface
// can be demonstrated offline. It is always surfaced behind an explicit
// "sample data" banner in the UI — never presented as live results.
//
// There is deliberately no offline chat fallback here. A fabricated chat
// answer dressed in the citation UI is indistinguishable from a real,
// grounded one - that's the exact defect 0.1 removed from the backend.
// When offline, ChatView refuses to answer instead of inventing a reply.

import type { ChunkResult, EligibilityMap, SchemeInfo } from './types';

export const DEMO_SCHEMES: SchemeInfo[] = [
  { id: 'pm-kisan', name: 'PM-KISAN Samman Nidhi', state: 'Central', category: 'Agriculture' },
  { id: 'pmmvy', name: 'Pradhan Mantri Matru Vandana Yojana', state: 'Central', category: 'Women & Child Development' },
  { id: 'nsap-igndps', name: 'Indira Gandhi National Disability Pension', state: 'Central', category: 'Pension' },
  { id: 'pm-scholarship', name: 'Post-Matric Scholarship (SC)', state: 'Central', category: 'Education' },
  { id: 'ladli-behna', name: 'Mukhyamantri Ladli Behna Yojana', state: 'Madhya Pradesh', category: 'Welfare' },
  { id: 'kalia', name: 'KALIA Farmer Support Scheme', state: 'Odisha', category: 'Agriculture' },
  { id: 'rythu-bandhu', name: 'Rythu Bandhu Investment Support', state: 'Telangana', category: 'Agriculture' },
  { id: 'kanyashree', name: 'Kanyashree Prakalpa', state: 'West Bengal', category: 'Education' },
];

// Eligibility against the default profile
// (age 30, Madhya Pradesh, Female, General, ₹1.8L income, 2.5 acres).
export const DEMO_ELIGIBILITY: EligibilityMap = {
  'pm-kisan': { status: 'eligible', failed_rules: [] },
  pmmvy: { status: 'eligible', failed_rules: [] },
  'ladli-behna': { status: 'eligible', failed_rules: [] },
  'nsap-igndps': {
    status: 'ineligible',
    failed_rules: [
      'Requires a BPL household — income is above the limit',
      'Requires a certified disability of 80% or more',
    ],
  },
  'pm-scholarship': {
    status: 'ineligible',
    failed_rules: ['Caste category must be SC'],
  },
  kalia: {
    status: 'ineligible',
    failed_rules: ['Applicant must reside in Odisha'],
  },
  'rythu-bandhu': {
    status: 'ineligible',
    failed_rules: ['Applicant must reside in Telangana'],
  },
  // No verified eligibility rules exist for this scheme yet - unknown must
  // never be silently upgraded to a "yes".
  kanyashree: { status: 'unknown', failed_rules: [] },
};

export const DEMO_CHUNKS: ChunkResult[] = [
  {
    id: 101,
    scheme_id: 'pm-kisan',
    document_title: 'PM-KISAN Operational Guidelines',
    seq: 1,
    heading_path: 'Eligibility > Beneficiary Definition',
    text: 'All landholding farmer families, which have cultivable land, are eligible to receive ₹6,000 per year in three equal instalments under the scheme, subject to exclusion criteria.',
    tokens: 42,
  },
  {
    id: 102,
    scheme_id: 'pm-kisan',
    document_title: 'PM-KISAN Operational Guidelines',
    seq: 2,
    heading_path: 'Eligibility > Exclusions',
    text: 'Institutional landholders and farmer families holding constitutional posts, serving or retired officers and employees above a pay threshold, and income-tax payers are excluded from the benefit.',
    tokens: 38,
  },
  {
    id: 103,
    scheme_id: 'ladli-behna',
    document_title: 'Ladli Behna Yojana Scheme Rules',
    seq: 1,
    heading_path: 'Eligibility > Applicant Criteria',
    text: 'Women residents of Madhya Pradesh aged between 21 and 60 years, whose family annual income does not exceed ₹2.5 lakh, are eligible for a monthly assistance amount.',
    tokens: 36,
  },
];

export const SUGGESTED_PROMPTS_EN = [
  'Am I eligible for PM-KISAN?',
  'What documents do I need for a pension scheme?',
  'Which schemes support girl-child education?',
  'How much does Ladli Behna Yojana pay?',
];

export const SUGGESTED_PROMPTS_HI = [
  'क्या मैं PM-KISAN के लिए पात्र हूँ?',
  'पेंशन योजना के लिए कौन से दस्तावेज़ चाहिए?',
  'बालिका शिक्षा के लिए कौन सी योजनाएं हैं?',
  'लाड़ली बहना योजना में कितना पैसा मिलता है?',
];
