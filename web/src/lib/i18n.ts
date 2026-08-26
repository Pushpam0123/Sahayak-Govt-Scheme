// Internationalisation dictionary (English + Hindi).
// Keys are grouped by surface; every key must exist in both languages.

export type Lang = 'en' | 'hi';

export interface Dict {
  // Chrome / header
  appName: string;
  tagline: string;
  chatTab: string;
  dashboardTab: string;
  apiLabel: string;
  dbLabel: string;
  online: string;
  offline: string;
  connected: string;
  refresh: string;
  lightMode: string;
  darkMode: string;
  offlineBanner: string;

  // Filters (shared)
  focusScheme: string;
  stateFilter: string;
  categoryFilter: string;
  allSchemes: string;
  allStates: string;
  allCategories: string;

  // Chat
  chatPlaceholder: string;
  ask: string;
  thinking: string;
  greeting: string;
  suggestedTitle: string;
  refusalTitle: string;
  refusalBody: string;
  latency: string;
  tokens: string;

  // Citation inspector
  citationInspector: string;
  noCitation: string;
  noCitationDesc: string;
  citationIndex: string;
  headingHierarchy: string;
  sourceDoc: string;
  viewSource: string;
  sourceQuote: string;
  claimUnsupported: string;
  claimPartial: string;

  // Dashboard summary
  dashboardTitle: string;
  dashboardSubtitle: string;
  statTotal: string;
  statEligible: string;
  statReview: string;
  statUnassessed: string;
  eligibilityBreakdown: string;
  schemesByCategory: string;
  noData: string;

  // Eligibility profile
  eligibilityProfile: string;
  profileHint: string;
  age: string;
  state: string;
  gender: string;
  caste: string;
  income: string;
  landholding: string;

  // Scheme directory
  verifiedSchemes: string;
  directory: string;
  eligible: string;
  ineligible: string;
  noRules: string;
  failedCriteria: string;
  matchesProfile: string;
  emptySchemes: string;
  emptySchemesDesc: string;

  // Document explorer (advanced)
  advancedTools: string;
  auditingFilter: string;
  keywordMatch: string;
  searchPlaceholder: string;
  search: string;
  limit: string;
  auditedChunks: string;
  clearFilter: string;
  noChunks: string;
  noChunksDesc: string;
  chunkInspector: string;
  selectChunkInspect: string;

  // Option values
  female: string;
  male: string;
  other: string;
  general: string;
  obc: string;
  sc: string;
  st: string;
}

const en: Dict = {
  appName: 'Sahayak',
  tagline: 'Government Scheme Assistant',
  chatTab: 'Ask Sahayak',
  dashboardTab: 'My Dashboard',
  apiLabel: 'API',
  dbLabel: 'Database',
  online: 'Online',
  offline: 'Offline',
  connected: 'Connected',
  refresh: 'Refresh status',
  lightMode: 'Light mode',
  darkMode: 'Dark mode',
  offlineBanner:
    'Backend not reachable — live scheme data and answers are unavailable. Start the API to see real results.',

  focusScheme: 'Focus scheme',
  stateFilter: 'State',
  categoryFilter: 'Category',
  allSchemes: 'All schemes',
  allStates: 'All states',
  allCategories: 'All categories',

  chatPlaceholder: 'Ask about eligibility, benefits, or how to apply…',
  ask: 'Ask',
  thinking: 'Consulting official records…',
  greeting:
    "Namaste! I'm Sahayak. Ask me about government scheme eligibility or benefits and I'll answer using only official guidelines, with citations you can verify.",
  suggestedTitle: 'Try asking',
  refusalTitle: 'Outside the official corpus',
  refusalBody:
    'This question falls outside the verified government-scheme documents I have indexed.',
  latency: 'Latency',
  tokens: 'Tokens',

  citationInspector: 'Citation inspector',
  noCitation: 'No citation selected',
  noCitationDesc:
    'Tap a citation badge (e.g. [1]) in an answer to view the official document excerpt and source link.',
  citationIndex: 'Citation',
  headingHierarchy: 'Section',
  sourceDoc: 'Official source',
  viewSource: 'View source document',
  sourceQuote: 'Quoted text',
  claimUnsupported: 'Claim unsupported',
  claimPartial: 'Claim partially supported',

  dashboardTitle: 'Your eligibility at a glance',
  dashboardSubtitle:
    'Fill in your profile and Sahayak checks it against every scheme in the index.',
  statTotal: 'Schemes indexed',
  statEligible: 'You may qualify',
  statReview: 'Not a match',
  statUnassessed: 'Not yet assessed',
  eligibilityBreakdown: 'Eligibility breakdown',
  schemesByCategory: 'Schemes by category',
  noData: 'No data yet',

  eligibilityProfile: 'Your profile',
  profileHint: 'Results update as you type.',
  age: 'Age (years)',
  state: 'State',
  gender: 'Gender',
  caste: 'Caste category',
  income: 'Annual household income (₹)',
  landholding: 'Agricultural land (acres)',

  verifiedSchemes: 'Schemes',
  directory: 'Directory',
  eligible: 'Eligible',
  ineligible: 'Not eligible',
  noRules: 'No rules',
  failedCriteria: 'Why not:',
  matchesProfile: 'Matches your profile',
  emptySchemes: 'No schemes loaded',
  emptySchemesDesc:
    'Connect the backend to load the verified scheme directory.',

  advancedTools: 'Document explorer',
  auditingFilter: 'Search filter',
  keywordMatch: 'Keyword search',
  searchPlaceholder: 'Search document text…',
  search: 'Search',
  limit: 'Limit',
  auditedChunks: 'Document chunks',
  clearFilter: 'Clear',
  noChunks: 'No chunks found',
  noChunksDesc: 'Select a scheme to load its guideline text.',
  chunkInspector: 'Chunk inspector',
  selectChunkInspect: 'Select a chunk above to inspect its full text.',

  female: 'Female',
  male: 'Male',
  other: 'Other',
  general: 'General',
  obc: 'OBC',
  sc: 'SC',
  st: 'ST',
};

const hi: Dict = {
  appName: 'सहायक',
  tagline: 'सरकारी योजना सहायक',
  chatTab: 'सहायक से पूछें',
  dashboardTab: 'मेरा डैशबोर्ड',
  apiLabel: 'एपीआई',
  dbLabel: 'डेटाबेस',
  online: 'ऑनलाइन',
  offline: 'ऑफ़लाइन',
  connected: 'जुड़ा हुआ',
  refresh: 'स्थिति ताज़ा करें',
  lightMode: 'लाइट मोड',
  darkMode: 'डार्क मोड',
  offlineBanner:
    'बैकएंड उपलब्ध नहीं है — वास्तविक योजना डेटा और उत्तर उपलब्ध नहीं हैं। असली परिणाम देखने के लिए API चालू करें।',

  focusScheme: 'योजना चुनें',
  stateFilter: 'राज्य',
  categoryFilter: 'श्रेणी',
  allSchemes: 'सभी योजनाएं',
  allStates: 'सभी राज्य',
  allCategories: 'सभी श्रेणियां',

  chatPlaceholder: 'पात्रता, लाभ या आवेदन के बारे में पूछें…',
  ask: 'पूछें',
  thinking: 'आधिकारिक दस्तावेज़ देखे जा रहे हैं…',
  greeting:
    'नमस्ते! मैं सहायक हूँ। सरकारी योजनाओं की पात्रता या लाभ के बारे में पूछें — मैं केवल आधिकारिक दिशानिर्देशों के आधार पर, सत्यापन योग्य संदर्भों के साथ उत्तर दूँगा।',
  suggestedTitle: 'ये पूछकर देखें',
  refusalTitle: 'आधिकारिक दायरे से बाहर',
  refusalBody:
    'यह प्रश्न मेरे द्वारा अनुक्रमित सत्यापित सरकारी योजना दस्तावेज़ों के दायरे से बाहर है।',
  latency: 'लेटेंसी',
  tokens: 'टोकन',

  citationInspector: 'संदर्भ निरीक्षक',
  noCitation: 'कोई संदर्भ चयनित नहीं',
  noCitationDesc:
    'आधिकारिक दस्तावेज़ का अंश और स्रोत लिंक देखने के लिए उत्तर में किसी संदर्भ (जैसे [1]) पर टैप करें।',
  citationIndex: 'संदर्भ',
  headingHierarchy: 'खंड',
  sourceDoc: 'आधिकारिक स्रोत',
  viewSource: 'स्रोत दस्तावेज़ देखें',
  sourceQuote: 'उद्धृत पाठ',
  claimUnsupported: 'दावा असमर्थित',
  claimPartial: 'दावा आंशिक रूप से समर्थित',

  dashboardTitle: 'एक नज़र में आपकी पात्रता',
  dashboardSubtitle:
    'अपना विवरण भरें और सहायक इसे हर योजना के नियमों से मिलाकर देखेगा।',
  statTotal: 'अनुक्रमित योजनाएं',
  statEligible: 'आप पात्र हो सकते हैं',
  statReview: 'मेल नहीं खाता',
  statUnassessed: 'अभी तक आकलन नहीं हुआ',
  eligibilityBreakdown: 'पात्रता विवरण',
  schemesByCategory: 'श्रेणी अनुसार योजनाएं',
  noData: 'अभी कोई डेटा नहीं',

  eligibilityProfile: 'आपका विवरण',
  profileHint: 'टाइप करते ही परिणाम अपडेट होते हैं।',
  age: 'आयु (वर्ष)',
  state: 'राज्य',
  gender: 'लिंग',
  caste: 'जाति वर्ग',
  income: 'वार्षिक पारिवारिक आय (₹)',
  landholding: 'कृषि भूमि (एकड़)',

  verifiedSchemes: 'योजनाएं',
  directory: 'निर्देशिका',
  eligible: 'पात्र',
  ineligible: 'अपात्र',
  noRules: 'कोई नियम नहीं',
  failedCriteria: 'कारण:',
  matchesProfile: 'आपके विवरण से मेल खाता है',
  emptySchemes: 'कोई योजना लोड नहीं हुई',
  emptySchemesDesc: 'सत्यापित योजना सूची लोड करने के लिए बैकएंड जोड़ें।',

  advancedTools: 'दस्तावेज़ एक्सप्लोरर',
  auditingFilter: 'खोज फ़िल्टर',
  keywordMatch: 'कीवर्ड खोज',
  searchPlaceholder: 'दस्तावेज़ पाठ खोजें…',
  search: 'खोजें',
  limit: 'सीमा',
  auditedChunks: 'दस्तावेज़ अंश',
  clearFilter: 'हटाएं',
  noChunks: 'कोई अंश नहीं मिला',
  noChunksDesc: 'दिशानिर्देश पाठ लोड करने के लिए एक योजना चुनें।',
  chunkInspector: 'अंश निरीक्षक',
  selectChunkInspect: 'पूरा पाठ देखने के लिए ऊपर एक अंश चुनें।',

  female: 'महिला',
  male: 'पुरुष',
  other: 'अन्य',
  general: 'सामान्य (General)',
  obc: 'ओबीसी (OBC)',
  sc: 'अनुसूचित जाति (SC)',
  st: 'अनुसूचित जनजाति (ST)',
};

export const TRANSLATIONS: Record<Lang, Dict> = { en, hi };

export const INDIAN_STATES = [
  'Central',
  'Andhra Pradesh',
  'Bihar',
  'Karnataka',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Telangana',
  'West Bengal',
];

export const SCHEME_CATEGORIES = [
  'Agriculture',
  'Welfare',
  'Pension',
  'Education',
  'Women & Child Development',
];
