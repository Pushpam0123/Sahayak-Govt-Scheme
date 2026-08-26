// Internationalisation dictionary (English, Hindi, Bengali, Marathi, Telugu, Tamil).
export type Lang = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta';

export interface LanguageMeta {
  code: Lang;
  label: string;
  nativeName: string;
  reviewed: boolean;
}

export const LANGUAGE_METADATA: Record<Lang, LanguageMeta> = {
  en: { code: 'en', label: 'English', nativeName: 'English', reviewed: true },
  hi: { code: 'hi', label: 'Hindi', nativeName: 'हिंदी', reviewed: true },
  bn: { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', reviewed: false },
  mr: { code: 'mr', label: 'Marathi', nativeName: 'मराठी', reviewed: false },
  te: { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', reviewed: false },
  ta: { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', reviewed: false },
};

export interface Dict {
  // Chrome / header
  appName: string;
  tagline: string;
  homeTab: string;
  wizardTab: string;
  schemesTab: string;
  chatTab: string;
  dashboardTab: string;
  savedTab: string;
  consoleTab: string;
  apiLabel: string;
  dbLabel: string;
  online: string;
  offline: string;
  connected: string;
  refresh: string;
  lightMode: string;
  darkMode: string;
  offlineBanner: string;
  disclaimer: string;

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
  chatOfflineMessage: string;
  chatOfflinePlaceholder: string;

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

  // Scheme directory & detail
  verifiedSchemes: string;
  directory: string;
  eligible: string;
  ineligible: string;
  noRules: string;
  failedCriteria: string;
  matchesProfile: string;
  emptySchemes: string;
  emptySchemesDesc: string;
  viewDetails: string;
  applyNow: string;
  requiredDocs: string;
  helpline: string;
  deadlines: string;
  benefitHero: string;

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
  homeTab: 'Home',
  wizardTab: 'Check Eligibility',
  schemesTab: 'Schemes',
  chatTab: 'Ask Assistant',
  dashboardTab: 'Analytics',
  savedTab: 'Saved Schemes',
  consoleTab: 'Console',
  apiLabel: 'API',
  dbLabel: 'Database',
  online: 'Online',
  offline: 'Offline',
  connected: 'Connected',
  refresh: 'Refresh status',
  lightMode: 'Light mode',
  darkMode: 'Dark mode',
  offlineBanner:
    'Backend not reachable — the schemes and eligibility figures shown below are sample data for demonstration only, not real scheme information. Chat answers are unavailable until the API is running.',
  disclaimer:
    'Information only — verify on the official portal before applying.',

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
  chatOfflineMessage:
    "I need a live connection to look up official guidelines — there's nothing I can answer without one. Start the API and refresh to continue.",
  chatOfflinePlaceholder: 'Unavailable offline',
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
  viewDetails: 'View Details',
  applyNow: 'Apply on Official Portal',
  requiredDocs: 'Required Documents',
  helpline: 'Official Helpline',
  deadlines: 'Deadlines',
  benefitHero: 'Benefit Amount',

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
  homeTab: 'होम',
  wizardTab: 'पात्रता जांचें',
  schemesTab: 'योजनाएं',
  chatTab: 'सहायक से पूछें',
  dashboardTab: 'एनालिटिक्स',
  savedTab: 'सहेजी गई',
  consoleTab: 'कंसोल',
  apiLabel: 'एपीआई',
  dbLabel: 'डेटाबेस',
  online: 'ऑनलाइन',
  offline: 'ऑफ़लाइन',
  connected: 'जुड़ा हुआ',
  refresh: 'स्थिति ताज़ा करें',
  lightMode: 'लाइट मोड',
  darkMode: 'डार्क मोड',
  offlineBanner:
    'बैकएंड उपलब्ध नहीं है — नीचे दिखाई गई योजनाएं और पात्रता आंकड़े केवल प्रदर्शन के लिए नमूना डेटा हैं, वास्तविक योजना जानकारी नहीं। API चालू होने तक चैट के उत्तर उपलब्ध नहीं होंगे।',
  disclaimer:
    'केवल जानकारी के लिए — आवेदन करने से पहले आधिकारिक पोर्टल पर सत्यापित करें।',

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
  chatOfflineMessage:
    'आधिकारिक दिशा-निर्देश खोजने के लिए मुझे एक सक्रिय कनेक्शन चाहिए — इसके बिना मैं कुछ नहीं बता सकता। जारी रखने के लिए API चालू करें और पुनः लोड करें।',
  chatOfflinePlaceholder: 'ऑफ़लाइन उपलब्ध नहीं',
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
  viewDetails: 'विवरण देखें',
  applyNow: 'आधिकारिक पोर्टल पर आवेदन करें',
  requiredDocs: 'आवश्यक दस्तावेज़',
  helpline: 'आधिकारिक हेल्पलाइन',
  deadlines: 'समय सीमा',
  benefitHero: 'लाभ राशि',

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

const bn: Dict = {
  appName: 'সহায়ক',
  tagline: 'সরকারি যোজনা সহায়িকা',
  homeTab: 'হোম',
  wizardTab: 'যোগ্যতা যাচাই',
  schemesTab: 'যোজনা সমূহ',
  chatTab: 'সহায়কের কাছে জিজ্ঞাসা',
  dashboardTab: 'অ্যানালিটিক্স',
  savedTab: 'সংরক্ষিত',
  consoleTab: 'কনসোল',
  apiLabel: 'API',
  dbLabel: 'ডাটাবেস',
  online: 'অনলাইন',
  offline: 'অফলাইন',
  connected: 'সংযুক্ত',
  refresh: 'রিফ্রেশ করুন',
  lightMode: 'লাইট মোড',
  darkMode: 'ডার্ক মোড',
  offlineBanner:
    'ব্যাকএন্ড অনুপলব্ধ — নিচে প্রদর্শিত যোজনা এবং যোগ্যতার তথ্য শুধুমাত্র প্রদর্শনের জন্য নমুনা তথ্য, প্রকৃত যোজনার তথ্য নয়। API চালু না হওয়া পর্যন্ত চ্যাট উত্তর পাওয়া যাবে না।',
  disclaimer:
    'শুধুমাত্র তথ্যের উদ্দেশ্যে — আবেদন করার আগে অফিসিয়াল পোর্টালে যাচাই করে নিন।',

  focusScheme: 'যোজনা নির্বাচন',
  stateFilter: 'রাজ্য',
  categoryFilter: 'বিভাগ',
  allSchemes: 'সমস্ত যোজনা',
  allStates: 'সমস্ত রাজ্য',
  allCategories: 'সমস্ত বিভাগ',

  chatPlaceholder: 'যোগ্যতা, সুবিধা বা আবেদন পদ্ধতি সম্পর্কে জিজ্ঞাসা করুন…',
  ask: 'জিজ্ঞাসা করুন',
  thinking: 'অফিসিয়াল নথি পরীক্ষা করা হচ্ছে…',
  greeting:
    'নমস্কার! আমি সহায়ক। সরকারি যোজনার যোগ্যতা বা সুবিধা সম্পর্কে জিজ্ঞাসা করুন — আমি কেবল অফিসিয়াল নির্দেশিকা এবং যাচাইযোগ্য সূত্রের ভিত্তিতে উত্তর দেব।',
  suggestedTitle: 'এগুলি জিজ্ঞাসা করে দেখতে পারেন',
  refusalTitle: 'অফিসিয়াল পরিধির বাইরে',
  refusalBody:
    'এই প্রশ্নটি আমার অন্তর্ভুক্ত যাচাইকৃত সরকারি যোজনা নথির পরিধির বাইরে।',
  chatOfflineMessage:
    'অফিসিয়াল নির্দেশিকা অনুসন্ধান করার জন্য একটি সক্রিয় সংযোগ প্রয়োজন — সংযোগ ছাড়া কোনো উত্তর দেওয়া সম্ভব নয়। API চালু করে রিফ্রেশ করুন।',
  chatOfflinePlaceholder: 'অফলাইনে অনুপলব্ধ',
  latency: 'লেটেন্সি',
  tokens: 'টোকেন',

  citationInspector: 'উদ্ধৃতি পরিদর্শক',
  noCitation: 'কোনো উদ্ধৃতি নির্বাচিত নেই',
  noCitationDesc:
    'অফিসিয়াল নথির অংশ এবং উৎস লিংক দেখতে উত্তরের উদ্ধৃতি ব্যাজে (যেমন [1]) ট্যাপ করুন।',
  citationIndex: 'উদ্ধৃতি',
  headingHierarchy: 'অনুচ্ছেদ',
  sourceDoc: 'অফিসিয়াল উৎস',
  viewSource: 'উৎস নথি দেখুন',
  sourceQuote: 'উদ্ধৃত পাঠ্য',
  claimUnsupported: 'দাবি অসমর্থিত',
  claimPartial: 'দাবি আংশিক সমর্থিত',

  dashboardTitle: 'এক নজরে আপনার যোগ্যতা',
  dashboardSubtitle:
    'আপনার তথ্য পূরণ করুন এবং সহায়ক প্রতিটি যোজনার সাথে তা যাচাই করবে।',
  statTotal: 'অন্তর্ভুক্ত যোজনা',
  statEligible: 'আপনি যোগ্য হতে পারেন',
  statReview: 'যোগ্য নন',
  statUnassessed: 'মূল্যায়ন বাকি',
  eligibilityBreakdown: 'যোগ্যতার বিবরণ',
  schemesByCategory: 'বিভাগ অনুযায়ী যোজনা',
  noData: 'কোনো তথ্য নেই',

  eligibilityProfile: 'আপনার প্রোফাইল',
  profileHint: 'টাইপ করার সাথে সাথে ফলাফল পরিবর্তিত হবে।',
  age: 'বয়স (বছর)',
  state: 'রাজ্য',
  gender: 'লিঙ্গ',
  caste: 'জাতিগত বিভাগ',
  income: 'বার্ষিক পারিবারিক আয় (₹)',
  landholding: 'কৃষি জমি (একর)',

  verifiedSchemes: 'যোজনা সমূহ',
  directory: 'ডিরেক্টরি',
  eligible: 'যোগ্য',
  ineligible: 'অযোগ্য',
  noRules: 'নিয়ম নেই',
  failedCriteria: 'কারণ:',
  matchesProfile: 'আপনার প্রোফাইলের সাথে মিলেছে',
  emptySchemes: 'কোনো যোজনা লোড হয়নি',
  emptySchemesDesc:
    'যাচাইকৃত যোজনা তালিকা লোড করার জন্য ব্যাকএন্ড সংযুক্ত করুন।',
  viewDetails: 'বিস্তারিত দেখুন',
  applyNow: 'অফিসিয়াল পোর্টালে আবেদন করুন',
  requiredDocs: 'প্রয়োজনীয় কাগজপত্র',
  helpline: 'অফিসিয়াল হেল্পলাইন',
  deadlines: 'সময়সীমা',
  benefitHero: 'সুবিধার পরিমাণ',

  advancedTools: 'ডকুমেন্ট এক্সপ্লোরার',
  auditingFilter: 'সার্চ ফিল্টার',
  keywordMatch: 'কীওয়ার্ড সন্ধান',
  searchPlaceholder: 'নথির পাঠ্য খুঁজুন…',
  search: 'সন্ধান',
  limit: 'সীমা',
  auditedChunks: 'নথির অংশ',
  clearFilter: 'মুছে ফেলুন',
  noChunks: 'কোনো অংশ পাওয়া যায়নি',
  noChunksDesc: 'নির্দেশিকা পাঠ্য লোড করার জন্য একটি যোজনা নির্বাচন করুন।',
  chunkInspector: 'অংশ পরিদর্শক',
  selectChunkInspect: 'সম্পূর্ণ পাঠ্য দেখতে উপরে একটি অংশে ক্লিক করুন।',

  female: 'মহিলা',
  male: 'পুরুষ',
  other: 'অন্যান্য',
  general: 'সাধারণ (General)',
  obc: 'ওবিসি (OBC)',
  sc: 'তফসিলি জাতি (SC)',
  st: 'তফসিলি উপজাতি (ST)',
};

const mr: Dict = {
  appName: 'सहायक',
  tagline: 'शासकीय योजना सहाय्यक',
  homeTab: 'मुख्यपृष्ठ',
  wizardTab: 'पात्रता तपासा',
  schemesTab: 'योजना',
  chatTab: 'सहायकाला विचारा',
  dashboardTab: 'अॅनालिटिक्स',
  savedTab: 'जतन केलेल्या',
  consoleTab: 'कन्सोल',
  apiLabel: 'API',
  dbLabel: 'डेटाबेस',
  online: 'ऑनलाइन',
  offline: 'ऑफलाइन',
  connected: 'जोडलेले',
  refresh: 'स्थिती रिफ्रेश करा',
  lightMode: 'लाइट मोड',
  darkMode: 'डार्क मोड',
  offlineBanner:
    'बॅकएंड उपलब्ध नाही — खाली दाखवलेल्या योजना आणि आकडेवारी केवळ प्रात्यक्षिकासाठी नमुना डेटा आहेत. API सुरू होईपर्यंत चॅट उत्तरे उपलब्ध होणार नाहीत.',
  disclaimer:
    'केवळ माहितीसाठी — अर्ज करण्यापूर्वी अधिकृत पोर्टलवर पडताळणी करा.',

  focusScheme: 'योजना निवडा',
  stateFilter: 'राज्य',
  categoryFilter: 'वर्गवारी',
  allSchemes: 'सर्व योजना',
  allStates: 'सर्व राज्ये',
  allCategories: 'सर्व वर्गवारी',

  chatPlaceholder: 'पात्रता, फायदे किंवा अर्जाविषयी विचारा…',
  ask: 'विचारा',
  thinking: 'अधिकृत नोंदी तपासल्या जात आहेत…',
  greeting:
    'नमस्कार! मी सहायक आहे. शासकीय योजनांच्या पात्रतेबद्दल किंवा लाभांबद्दल विचारा — मी केवळ अधिकृत मार्गदर्शक तत्त्वांच्या आधारे संदर्भ पुराव्यासह उत्तर देईन.',
  suggestedTitle: 'हे विचारून पहा',
  refusalTitle: 'अधिकृत कक्षेबाहेर',
  refusalBody:
    'हा प्रश्न मी अनुक्रमित केलेल्या अधिकृत योजना दस्तऐवजांच्या कक्षेबाहेर आहे.',
  chatOfflineMessage:
    'अधिकृत मार्गदर्शक तत्त्वे शोधण्यासाठी सक्रिय इंटरनेट कनेक्शन आवश्यक आहे. API सुरू करा आणि रीलोड करा.',
  chatOfflinePlaceholder: 'ऑफलाइन उपलब्ध नाही',
  latency: 'लेटन्सी',
  tokens: 'टोकन',

  citationInspector: 'संदर्भ निरीक्षक',
  noCitation: 'कोणताही संदर्भ निवडलेला नाही',
  noCitationDesc:
    'अधिकृत दस्तऐवजाचा मजकूर आणि स्रोत लिंक पाहण्यासाठी उत्तरातील संदर्भ बॅजवर (उदा. [1]) टॅप करा.',
  citationIndex: 'संदर्भ',
  headingHierarchy: 'विभाग',
  sourceDoc: 'अधिकृत स्रोत',
  viewSource: 'मूळ दस्तऐवज पहा',
  sourceQuote: 'उद्धृत मजकूर',
  claimUnsupported: 'दावा असमर्थित',
  claimPartial: 'दावा अंशतः समर्थित',

  dashboardTitle: 'एका दृष्टिक्षेपात तुमची पात्रता',
  dashboardSubtitle:
    'तुमची माहिती भरा आणि सहायक प्रत्येक योजनेच्या निकषांनुसार तपासणी करेल.',
  statTotal: 'नोंदणीकृत योजना',
  statEligible: 'तुम्ही पात्र असू शकता',
  statReview: 'पात्र नाही',
  statUnassessed: 'मूल्यांकन बाकी',
  eligibilityBreakdown: 'पात्रता तपशील',
  schemesByCategory: 'वर्गवारीनुसार योजना',
  noData: 'अद्याप डेटा नाही',

  eligibilityProfile: 'तुमचे प्रोफाइल',
  profileHint: 'माहिती भरताच निकाल आपोआप अद्ययावत होतात.',
  age: 'वय (वर्षे)',
  state: 'राज्य',
  gender: 'लिंग',
  caste: 'जातीचा प्रवर्ग',
  income: 'वार्षिक कौटुंबिक उत्पन्न (₹)',
  landholding: 'शेती जमीन (एकर)',

  verifiedSchemes: 'योजना',
  directory: 'निर्देशिका',
  eligible: 'पात्र',
  ineligible: 'अपात्र',
  noRules: 'नियम उपलब्ध नाहीत',
  failedCriteria: 'अपात्रतेचे कारण:',
  matchesProfile: 'तुमच्या प्रोफाइलशी जुळते',
  emptySchemes: 'कोणतीही योजना लोड झाली नाही',
  emptySchemesDesc:
    'पडताळणी केलेली योजना यादी लोड करण्यासाठी बॅकएंड कनेक्ट करा.',
  viewDetails: 'तपशील पहा',
  applyNow: 'अधिकृत पोर्टलवर अर्ज करा',
  requiredDocs: 'आवश्यक कागदपत्रे',
  helpline: 'अधिकृत हेल्पलाइन',
  deadlines: 'अंतिम मुदत',
  benefitHero: 'लाभाची रक्कम',

  advancedTools: 'दस्तऐवज एक्सप्लोरर',
  auditingFilter: 'शोध फिल्टर',
  keywordMatch: 'कीवर्ड शोध',
  searchPlaceholder: 'दस्तऐवजातील मजकूर शोधा…',
  search: 'शोधा',
  limit: 'मर्यादा',
  auditedChunks: 'दस्तऐवज विभाग',
  clearFilter: 'साफ करा',
  noChunks: 'कोणताही विभाग आढळला नाही',
  noChunksDesc: 'मार्गदर्शक मजकूर लोड करण्यासाठी योजना निवडा.',
  chunkInspector: 'विभाग निरीक्षक',
  selectChunkInspect: 'पूर्ण मजकूर पाहण्यासाठी वरील विभागावर क्लिक करा.',

  female: 'महिला',
  male: 'पुरुष',
  other: 'इतर',
  general: 'खुला (General)',
  obc: 'इतर मागासवर्गीय (OBC)',
  sc: 'अनुसूचित जाती (SC)',
  st: 'अनुसूचित जमाती (ST)',
};

const te: Dict = {
  appName: 'సహాయక్',
  tagline: 'ప్రభుత్వ పథకాల సహాయకుడు',
  homeTab: 'హోమ్',
  wizardTab: 'అర్హత తనిఖీ',
  schemesTab: 'పథకాలు',
  chatTab: 'సహాయక్‌ని అడగండి',
  dashboardTab: 'విశ్లేషణలు',
  savedTab: 'భద్రపరిచినవి',
  consoleTab: 'కన్సోల్',
  apiLabel: 'API',
  dbLabel: 'డేటాబేస్',
  online: 'ఆన్‌లైన్',
  offline: 'ఆఫ్‌లైన్',
  connected: 'కనెక్ట్ అయింది',
  refresh: 'రిఫ్రెష్ చేయండి',
  lightMode: 'లైట్ మోడ్',
  darkMode: 'డార్క్ మోడ్',
  offlineBanner:
    'బ్యాకెండ్ అందుబాటులో లేదు — క్రింద చూపబడిన పథకాలు మరియు అర్హత వివరాలు డెమో కొరకు మాత్రమే. API ప్రారంభమయ్యే వరకు చాట్ సమాధానాలు అందుబాటులో ఉండవు.',
  disclaimer:
    'సమాచార ప్రయోజనాల కొరకు మాత్రమే — దరఖాస్తు చేసుకునే ముందు అధికారిక పోర్టల్‌లో ధృవీకరించుకోండి.',

  focusScheme: 'పథకం ఎంచుకోండి',
  stateFilter: 'రాష్ట్రం',
  categoryFilter: 'వర్గం',
  allSchemes: 'అన్ని పథకాలు',
  allStates: 'అన్ని రాష్ట్రాలు',
  allCategories: 'అన్ని వర్గాలు',

  chatPlaceholder: 'అర్హత, ప్రయోజనాలు లేదా దరఖాస్తు గురించి అడగండి…',
  ask: 'అడగండి',
  thinking: 'అధికారిక రికార్డులను పరిశీలిస్తోంది…',
  greeting:
    'నమస్కారం! నేను సహాయక్. ప్రభుత్వ పథకాల అర్హత లేదా ప్రయోజనాల గురించి అడగండి — నేను అధికారిక మార్గదర్శకాల ఆధారంగా మాత్రమే సమాధానం ఇస్తాను.',
  suggestedTitle: 'ఇవి అడగడానికి ప్రయత్నించండి',
  refusalTitle: 'అధికారిక పరిధికి వెలుపల',
  refusalBody:
    'ఈ ప్రశ్న నేను ఇండెక్స్ చేసిన అధికారిక పథక పత్రాల పరిధికి వెలుపల ఉంది.',
  chatOfflineMessage:
    'అధికారిక మార్గదర్శకాలను శోధించడానికి యాక్టివ్ ఇంటర్నెట్ కనెక్షన్ అవసరం. API ప్రారంభించి రీలోడ్ చేయండి.',
  chatOfflinePlaceholder: 'ఆఫ్‌లైన్‌లో అందుబాటులో లేదు',
  latency: 'లేటెన్సీ',
  tokens: 'టోకెన్లు',

  citationInspector: 'సైటేషన్ ఇన్‌స్పెక్టర్',
  noCitation: 'ఏ సైటేషన్ ఎంపిక చేయబడలేదు',
  noCitationDesc:
    'అధికారిక పత్రం యొక్క భాగాన్ని చూడటానికి సమాధానంలోని సైటేషన్ బ్యాడ్జ్ (ఉదా. [1]) పై నొక్కండి.',
  citationIndex: 'సైటేషన్',
  headingHierarchy: 'విభాగం',
  sourceDoc: 'అధికారిక మూలం',
  viewSource: 'మూల పత్రం చూడండి',
  sourceQuote: 'ఉదహరించిన వచనం',
  claimUnsupported: 'సమర్థించబడని క్లెయిమ్',
  claimPartial: 'పాక్షికంగా సమర్థించబడింది',

  dashboardTitle: 'ఒక్క చూపులో మీ అర్హత',
  dashboardSubtitle:
    'మీ ప్రొఫైల్ వివరాలను పూరించండి, సహాయక్ ప్రతి పథకంతో సరిపోలుస్తుంది.',
  statTotal: 'ఇండెక్స్ చేయబడిన పథకాలు',
  statEligible: 'మీరు అర్హులు కావచ్చు',
  statReview: 'సరిపోలలేదు',
  statUnassessed: 'ఇంకా అంచనా వేయలేదు',
  eligibilityBreakdown: 'అర్హత విశ్లేషణ',
  schemesByCategory: 'వర్గాల వారీగా పథకాలు',
  noData: 'ఇంకా డేటా లేదు',

  eligibilityProfile: 'మీ ప్రొఫైల్',
  profileHint: 'మీరు టైప్ చేస్తున్నప్పుడు ఫలితాలు అప్‌డేట్ అవుతాయి.',
  age: 'వయస్సు (సంవత్సరాలు)',
  state: 'రాష్ట్రం',
  gender: 'లింగం',
  caste: 'కుల వర్గం',
  income: 'వార్షిక కుటుంబ ఆదాయం (₹)',
  landholding: 'వ్యవసాయ భూమి (ఎకరాలు)',

  verifiedSchemes: 'పథకాలు',
  directory: 'డైరెక్టరీ',
  eligible: 'అర్హులు',
  ineligible: 'అనర్హులు',
  noRules: 'నియమాలు లేవు',
  failedCriteria: 'కారణం:',
  matchesProfile: 'మీ ప్రొఫైల్‌తో సరిపోలుతుంది',
  emptySchemes: 'పథకాలు లోడ్ కాలేదు',
  emptySchemesDesc:
    'ధృవీకరించబడిన పథకాల జాబితాను లోడ్ చేయడానికి బ్యాకెండ్‌ని కనెక్ట్ చేయండి.',
  viewDetails: 'వివరాలు చూడండి',
  applyNow: 'అధికారిక పోర్టల్‌లో దరఖాస్తు చేయండి',
  requiredDocs: 'అవసరమైన పత్రాలు',
  helpline: 'హెల్ప్‌లైన్ నంబర్',
  deadlines: 'గడువు తేదీలు',
  benefitHero: 'ప్రయోజన మొత్తం',

  advancedTools: 'డాక్యుమెంట్ ఎక్స్‌ప్లోరర్',
  auditingFilter: 'సెర్చ్ ఫిల్టర్',
  keywordMatch: 'కీవర్డ్ శోధన',
  searchPlaceholder: 'పత్రాల వచనాన్ని శోధించండి…',
  search: 'శోధించండి',
  limit: 'పరిమితి',
  auditedChunks: 'పత్ర భాగాలు',
  clearFilter: 'క్లియర్ చేయండి',
  noChunks: 'భాగాలు కనుగొనబడలేదు',
  noChunksDesc: 'మార్గదర్శక వచనాన్ని లోడ్ చేయడానికి పథకాన్ని ఎంచుకోండి.',
  chunkInspector: 'చంక్ ఇన్‌స్పెక్టర్',
  selectChunkInspect: 'పూర్తి వచనాన్ని చూడటానికి పైన ఉన్న భాగాన్ని ఎంచుకోండి.',

  female: 'మహిళ',
  male: 'పురుషుడు',
  other: 'ఇతర',
  general: 'జనరల్ (General)',
  obc: 'ఓబీసీ (OBC)',
  sc: 'ఎస్సీ (SC)',
  st: 'ఎస్టీ (ST)',
};

const ta: Dict = {
  appName: 'சஹாயக்',
  tagline: 'அரசு திட்ட வழிகாட்டி',
  homeTab: 'முகப்பு',
  wizardTab: 'தகுதி சரிபார்த்தல்',
  schemesTab: 'திட்டங்கள்',
  chatTab: 'சஹாயக்கிடம் கேளுங்கள்',
  dashboardTab: 'பகுப்பாய்வு',
  savedTab: 'சேமிக்கப்பட்டவை',
  consoleTab: 'கன்சோல்',
  apiLabel: 'API',
  dbLabel: 'தரவுத்தளம்',
  online: 'ஆன்லைன்',
  offline: 'ஆஃப்லைன்',
  connected: 'இணைக்கப்பட்டது',
  refresh: 'புதுப்பிக்கவும்',
  lightMode: 'லைட் மோட்',
  darkMode: 'டார்க் மோட்',
  offlineBanner:
    'சர்வர் கிடைக்கவில்லை — கீழே காட்டப்பட்டுள்ள திட்டங்கள் மற்றும் தகுதித் தகவல்கள் மாதிரி தரவு மட்டுமே. API தொடங்கும் வரை சாட் பதில்கள் கிடைக்காது.',
  disclaimer:
    'தகவல் நோக்கங்களுக்காக மட்டுமே — விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ போர்ட்டலில் சரிபார்க்கவும்.',

  focusScheme: 'திட்டத்தைத் தேர்ந்தெடுக்கவும்',
  stateFilter: 'மாநிலம்',
  categoryFilter: 'பிரிவு',
  allSchemes: 'அனைத்து திட்டங்கள்',
  allStates: 'அனைத்து மாநிலங்கள்',
  allCategories: 'அனைத்து பிரிவுகள்',

  chatPlaceholder: 'தகுதி, நன்மைகள் அல்லது விண்ணப்பிக்கும் முறை பற்றி கேளுங்கள்…',
  ask: 'கேளுங்கள்',
  thinking: 'அதிகாரப்பூர்வ ஆவணங்கள் சரிபார்க்கப்படுகின்றன…',
  greeting:
    'வணக்கம்! நான் சஹாயக். அரசு திட்ட தகுதி அல்லது நன்மைகள் பற்றி கேளுங்கள் — அதிகாரப்பூர்வ வழிகாட்டுதல்களின் அடிப்படையில் மட்டுமே நான் பதிலளிப்பேன்.',
  suggestedTitle: 'இவற்றை கேட்டுப் பாருங்கள்',
  refusalTitle: 'அதிகாரப்பூர்வ எல்லைக்கு அப்பாற்பட்டது',
  refusalBody:
    'இந்தக் கேள்வி நான் அட்டவணைப்படுத்திய அதிகாரப்பூர்வ அரசு ஆவணங்களின் எல்லைக்கு அப்பாற்பட்டது.',
  chatOfflineMessage:
    'அதிகாரப்பூர்வ வழிகாட்டுதல்களைத் தேட இணைய இணைப்பு தேவை. API-ஐத் தொடங்கி மீண்டும் ஏற்றவும்.',
  chatOfflinePlaceholder: 'ஆஃப்லைனில் கிடைக்காது',
  latency: 'தாமதம்',
  tokens: 'டோக்கன்கள்',

  citationInspector: 'மேற்கோள் ஆய்வாளர்',
  noCitation: 'மேற்கோள் தேர்ந்தெடுக்கப்படவில்லை',
  noCitationDesc:
    'ஆவணப் பகுதியையும் மூல இணைப்பையும் பார்க்க பதிலில் உள்ள மேற்கோள் குறியீட்டை (எ.கா. [1]) தட்டவும்.',
  citationIndex: 'மேற்கோள்',
  headingHierarchy: 'பகுதி',
  sourceDoc: 'அதிகாரப்பூர்வ மூலம்',
  viewSource: 'மூல ஆவணத்தைப் பார்க்கவும்',
  sourceQuote: 'மேற்கோள் உரை',
  claimUnsupported: 'சான்றற்ற தகவல்',
  claimPartial: 'பகுதி ஆதரவு தகவல்',

  dashboardTitle: 'உங்கள் தகுதி ஒரு பார்வையில்',
  dashboardSubtitle:
    'உங்கள் விவரங்களை நிரப்பவும், சஹாயக் ஒவ்வொரு திட்டத்துடனும் அதை ஒப்பிட்டு பார்க்கும்.',
  statTotal: 'அட்டவணைப்படுத்தப்பட்ட திட்டங்கள்',
  statEligible: 'நீங்கள் தகுதி பெறலாம்',
  statReview: 'பொருந்தவில்லை',
  statUnassessed: 'இன்னும் மதிப்பிடப்படவில்லை',
  eligibilityBreakdown: 'தகுதி விவரம்',
  schemesByCategory: 'பிரிவு வாரியாக திட்டங்கள்',
  noData: 'இன்னும் தரவு இல்லை',

  eligibilityProfile: 'உங்கள் சுயவிவரம்',
  profileHint: 'நீங்கள் உள்ளிடும் போது முடிவுகள் மாறும்.',
  age: 'வயது (ஆண்டுகள்)',
  state: 'மாநிலம்',
  gender: 'பாலினம்',
  caste: 'சாதிப் பிரிவு',
  income: 'ஆண்டு குடும்ப வருமானம் (₹)',
  landholding: 'விவசாய நிலம் (ஏக்கர்)',

  verifiedSchemes: 'திட்டங்கள்',
  directory: 'அட்டவணை',
  eligible: 'தகுதியுடையவர்',
  ineligible: 'தகுதியற்றவர்',
  noRules: 'விதிகள் இல்லை',
  failedCriteria: 'காரணம்:',
  matchesProfile: 'உங்கள் சுயவிவரத்துடன் பொருந்துகிறது',
  emptySchemes: 'திட்டங்கள் ஏற்றப்படவில்லை',
  emptySchemesDesc:
    'சரிபார்க்கப்பட்ட திட்டப் பட்டியலை ஏற்ற சர்வரை இணைக்கவும்.',
  viewDetails: 'விவரங்களைப் பார்க்கவும்',
  applyNow: 'அதிகாரப்பூர்வ தளத்தில் விண்ணப்பிக்கவும்',
  requiredDocs: 'தேவையான ஆவணங்கள்',
  helpline: 'உதவி எண்',
  deadlines: 'கடைசி தேதி',
  benefitHero: 'நன்மை தொகை',

  advancedTools: 'ஆவண எக்ஸ்ப்ளோரர்',
  auditingFilter: 'தேடல் வடிகட்டி',
  keywordMatch: 'முக்கிய சொல் தேடல்',
  searchPlaceholder: 'ஆவண உரையைத் தேடவும்…',
  search: 'தேடு',
  limit: 'வரம்பு',
  auditedChunks: 'ஆவணப் பகுதிகள்',
  clearFilter: 'அழி',
  noChunks: 'பகுதிகள் எதுவும் கிடைக்கவில்லை',
  noChunksDesc: 'வழிகாட்டுதல் உரையை ஏற்ற ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்.',
  chunkInspector: 'பகுதி ஆய்வாளர்',
  selectChunkInspect: 'முழு உரையைப் பார்க்க மேலே உள்ள பகுதியைத் தேர்ந்தெடுக்கவும்.',

  female: 'பெண்',
  male: 'ஆண்',
  other: 'மற்றவை',
  general: 'பொது (General)',
  obc: 'ஓபிசி (OBC)',
  sc: 'பட்டியலினத்தவர் (SC)',
  st: 'பழங்குடியினர் (ST)',
};

export const TRANSLATIONS: Record<Lang, Dict> = { en, hi, bn, mr, te, ta };

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
  'Insurance',
  'Finance & Business',
  'Women & Child Development',
  'Power & Welfare',
];
