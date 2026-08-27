import { toDevanagariDigits } from "@/lib/date";

/**
 * Every string the visitor sees, in one place.
 *
 * The interface is Marathi-first — this file is the whole surface a Marathi
 * reviewer needs to read. Code identifiers stay in English on purpose.
 */
export const t = {
  /* -- Identity --------------------------------------------------------- */
  siteName: "महाराष्ट्र एका नजरेत",
  siteTagline: "विकासविषयक बातम्यांचा संक्षिप्त सारांश",
  emblemAlt: "महाराष्ट्र शासनाचे बोधचिन्ह",
  sourceLogoAlt: "महासंवाद — माहिती व जनसंपर्क महासंचालनालय, महाराष्ट्र",

  /* -- Demo disclosure -------------------------------------------------- */
  demoNoticeShort: "प्रात्यक्षिक आवृत्ती",
  demoNotice:
    "ही प्रात्यक्षिक आवृत्ती आहे. येथील सर्व बातम्या केवळ नमुन्यादाखल तयार केलेल्या असून त्या पडताळणी केलेली वृत्ते नाहीत.",

  /* -- Search ----------------------------------------------------------- */
  searchLabel: "बातम्यांमध्ये शोधा",
  searchPlaceholder: "जिल्हा, विषय किंवा शब्द शोधा",
  searchPlaceholderShort: "शोधा",
  clearSearch: "शोध पुसा",
  searchHint: "शीर्षक, जिल्हा, विषय, स्रोत आणि सारांश यांमध्ये शोधले जाते.",

  /* -- Filters ---------------------------------------------------------- */
  filters: "फिल्टर",
  filtersTitle: "फिल्टर आणि क्रम",
  filtersDescription:
    "जिल्हा, विषय, स्रोत, कालावधी आणि विषयचिन्हांनुसार बातम्या मर्यादित करा.",
  openFilters: "फिल्टर उघडा",
  closeFilters: "फिल्टर बंद करा",
  applyFilters: "फिल्टर लागू करा",
  clearAll: "सर्व फिल्टर काढा",
  district: "जिल्हा",
  districtPlural: "जिल्हे",
  category: "विषय",
  source: "स्रोत",
  tags: "विषयचिन्हे",
  featuredOnly: "फक्त विशेष बातम्या",
  featured: "विशेष",
  dateRange: "कालावधी",
  dateFrom: "पासून",
  dateTo: "पर्यंत",
  sort: "क्रम",
  sortNewest: "नवीन प्रथम",
  sortOldest: "जुने प्रथम",
  sortLabel: "बातम्यांचा क्रम",
  searchResults: "शोध निकाल",
  filteredResults: "फिल्टर लागू",
  removeFilter: (label: string) => `${label} हा फिल्टर काढा`,

  /* -- Feed ------------------------------------------------------------- */
  feedHeading: "बातम्यांचा सारांश",
  latest: "अलीकडील",
  readFullSummary: "संपूर्ण सारांश",
  readFullSummaryOf: (title: string) => `${title} — संपूर्ण सारांश वाचा`,
  pdf: "PDF",
  openPdf: "संपूर्ण लेख (PDF)",
  openPdfOf: (title: string) => `${title} — संपूर्ण लेख PDF मध्ये उघडा`,
  pdfUnavailable: "या बातमीसाठी PDF सध्या उपलब्ध नाही",
  pdfUnavailableShort: "PDF नाही",
  pdfOpensNewTab: "नवीन टॅबमध्ये उघडेल",
  moreTags: (count: number) => `+${toDevanagariDigits(count)} आणखी`,

  /* -- Counts ----------------------------------------------------------- */
  resultCount: (count: number) =>
    count === 1
      ? "१ बातमी सापडली"
      : `${toDevanagariDigits(count)} बातम्या सापडल्या`,
  totalCount: (count: number) =>
    count === 1 ? "एकूण १ बातमी" : `एकूण ${toDevanagariDigits(count)} बातम्या`,
  showingOf: (shown: number, total: number) =>
    shown === 1
      ? `${toDevanagariDigits(total)} पैकी १ बातमी`
      : `${toDevanagariDigits(total)} पैकी ${toDevanagariDigits(shown)} बातम्या`,

  /* -- Empty states ----------------------------------------------------- */
  noResultsTitle: "एकही बातमी सापडली नाही",
  noResultsForQuery: (query: string) =>
    `“${query}” साठी काहीही सापडले नाही. शब्द बदलून पाहा किंवा फिल्टर काढा.`,
  noResultsFiltered:
    "निवडलेल्या फिल्टरशी जुळणारी बातमी नाही. काही फिल्टर काढून पुन्हा पाहा.",
  resetEverything: "शोध व फिल्टर पूर्ववत करा",
  noArticlesTitle: "अद्याप बातम्या नाहीत",
  noArticlesDescription: "नवीन बातम्या उपलब्ध होताच त्या इथे दिसतील.",

  /* -- Article dialog --------------------------------------------------- */
  articleDialogLabel: "बातमीचा संपूर्ण सारांश",
  close: "बंद करा",
  closeArticle: "बातमी बंद करा",
  summaryHeading: "सारांश",
  detailsHeading: "तपशील",
  author: "वार्ताहर",
  publishedOn: "प्रसिद्धी दिनांक",
  viewPosterFullscreen: "पोस्टर पूर्ण स्क्रीनवर पाहा",
  posterFullscreenLabel: "पोस्टर — पूर्ण स्क्रीन",
  downloadPoster: "पोस्टर जतन करा",
  sharePoster: "पोस्टर पाठवा",
  posterDownloaded: "पोस्टर जतन झाले.",
  posterDownloadFailed: "पोस्टर जतन करता आले नाही.",
  posterShared: "पोस्टर पाठवले.",
  posterShareFailed: "पोस्टर पाठवता आले नाही.",
  posterUnavailable: "या बातमीसाठी पोस्टर उपलब्ध नाही",

  /* -- Share mode ------------------------------------------------------- */
  shareMode: "शेअर मोड",
  shareShort: "शेअर",
  enterShareMode: "शेअर मोड सुरू करा",
  exitShareMode: "शेअर मोड बंद करा",
  shareModeHint: "पाठवायच्या बातम्या निवडा",
  selectArticle: (title: string) => `${title} — ही बातमी निवडा`,
  selected: "निवडली",
  tapToSelect: "निवडण्यासाठी स्पर्श करा",
  selectedCount: (count: number) =>
    count === 1 ? "१ बातमी निवडली" : `${toDevanagariDigits(count)} बातम्या निवडल्या`,
  selectAllVisible: "दिसणाऱ्या सर्व निवडा",
  clearSelection: "निवड रद्द करा",
  nothingSelected: "अद्याप एकही बातमी निवडलेली नाही",
  selectAtLeastOne: "किमान एक बातमी निवडा",
  share: "पाठवा",
  sharePreviewTitle: "पाठवायचा मजकूर",
  sharePreviewDescription:
    "निवडलेल्या बातम्यांचा संपूर्ण सारांश आणि PDF दुवे खाली दिसत आहेत.",
  messageLength: (count: number) =>
    `${toDevanagariDigits(count)} अक्षरे`,
  shareViaDevice: "उपकरणाद्वारे पाठवा",
  shareViaWhatsApp: "WhatsApp",
  shareViaWhatsAppLong: "WhatsApp वर पाठवा",
  copyMessage: "कॉपी करा",
  copyMessageLong: "संपूर्ण मजकूर कॉपी करा",
  copied: "मजकूर कॉपी झाला.",
  copyFailed: "मजकूर कॉपी करता आला नाही. मजकूर निवडून स्वतः कॉपी करा.",
  shareSuccess: "मजकूर पाठवला.",
  shareFailed: "मजकूर पाठवता आला नाही.",
  nativeShareUnavailable:
    "या ब्राउझरमध्ये थेट पाठवण्याची सुविधा नाही. WhatsApp किंवा कॉपी वापरा.",
  whatsappTooLongTitle: "मजकूर WhatsApp दुव्यासाठी मोठा आहे",
  whatsappTooLong:
    "निवडलेला मजकूर मोठा असल्याने काही उपकरणांवर WhatsApp दुव्यातून तो पूर्ण उघडणार नाही. संपूर्ण मजकूर पाठवण्यासाठी “कॉपी करा” वापरा आणि तो WhatsApp मध्ये चिकटवा.",
  whatsappOpened: "WhatsApp उघडले जात आहे.",

  /* -- Footer ----------------------------------------------------------- */
  footerHeading: "महाराष्ट्र एका नजरेत",
  footerNote:
    "बातम्यांचे सारांश स्वयंचलित पद्धतीने तयार केले जातात. संपूर्ण तपशिलासाठी मूळ लेखाची PDF पाहा.",
  footerSource: "स्रोत",
  backToTop: "वर जा",

  /* -- Generic ---------------------------------------------------------- */
  loading: "आशय उघडत आहे…",
} as const;
