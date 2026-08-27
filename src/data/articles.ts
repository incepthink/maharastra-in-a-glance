import type { Article } from "@/types/article";

/* ===========================================================================
   PUBLISHED CONTENT
   ---------------------------------------------------------------------------
   Marathi press releases issued by the Directorate General of Information and
   Public Relations (DGIPR), Government of Maharashtra, and carried on
   mahasamvad.in. Summaries are condensed from the released text and keep every
   name, figure and helpline number exactly as issued.

   Adding an article:
     1. Append an object below. `id` and `slug` must stay unique — `slug` is
        what the `?article=` deep link uses.
     2. Point `posterImageUrl` at the poster. Local posters live in
        `public/posters/` and are produced by `npm run gen:posters` from the
        table in `scripts/generate-posters.mjs`; absolute URLs need their host
        whitelisted in `next.config.ts` under `images.remotePatterns`. `null`
        renders the designed fallback artwork instead.
     3. Point `articlePdfUrl` at the full article. The shipped PDFs live in
        `public/pdfs/<slug>.pdf` and are printed from the app's own
        `/print/<slug>` route by `npm run gen:pdfs` — so a new article needs
        that command run once, with the app serving. An externally hosted
        article can use its absolute `https://` URL instead; share messages
        absolutise site-relative paths against the current origin either way.
        `null` renders the "PDF unavailable" state.

   Nothing else in the app needs to change: filters, facets and search all
   derive themselves from whatever this file exports.
   =========================================================================== */

/** Drives the visible "sample content" disclosures. False for real data. */
export const IS_DEMO_CONTENT = false;

const SOURCE = "महासंवाद";
const DGIPR = "माहिती व जनसंपर्क महासंचालनालय";

export const ARTICLES: Article[] = [
  {
    id: "2026-08-26-01",
    slug: "msme-samanjasya-karar-chakan-bhosari",
    title:
      "महाराष्ट्राच्या ‘ग्रोथ इंजिन’ला ‘एमएसएमई’ क्षेत्राची ताकद मिळणार – मुख्यमंत्री देवेंद्र फडणवीस",
    date: "2026-08-26",
    summary:
      "४९ ‘एमएसएमईं’च्या सामंजस्य करारातून २,३२० कोटींची गुंतवणूक प्रस्तावित\n\nचाकण-भोसरी औद्योगिक पट्ट्यातील ४९ सूक्ष्म, लघु व मध्यम उद्योगांसोबत झालेल्या सामंजस्य करारांतून ₹2,320.97 कोटींची गुंतवणूक प्रस्तावित असून, त्यातून उत्पादनक्षमता आणि रोजगाराच्या संधी वाढण्याची अपेक्षा आहे. राज्य शासन एमएसएमई क्षेत्रासाठी स्वतंत्र व्यवस्था आणि ‘एमएसएमई सेन्सस’ राबवणार आहे. करार केलेल्या उद्योगांना जमीन व पायाभूत सुविधा उपलब्ध करून देऊन एक-दोन वर्षांत उत्पादन सुरू करण्याचे उद्दिष्ट आहे. जुन्या औद्योगिक वसाहतींचे आधुनिकीकरण करून त्यांना ‘औद्योगिक नगरी’चा दर्जा देण्याची सुरुवात पुणे जिल्ह्यातून करण्याचाही शासनाचा मानस आहे.",
    posterImageUrl: "/posters/msme-samanjasya-karar-chakan-bhosari.jpg",
    articlePdfUrl: "/pdfs/msme-samanjasya-karar-chakan-bhosari.pdf",
    category: "उद्योग",
    district: "मुंबई",
    source: SOURCE,
    author: DGIPR,
    language: "mr",
    tags: [
      "एमएसएमई",
      "गुंतवणूक",
      "रोजगार",
      "चाकण",
      "एमआयडीसी",
      "औद्योगिक नगरी",
    ],
    featured: true,
  },
  {
    id: "2026-08-26-02",
    slug: "digital-arrest-cyber-jagruti-1930",
    title:
      "‘डिजिटल अरेस्ट’ यासारखी सायबर फसवणूक झाल्यास १९३० वर तात्काळ संपर्क साधा – मुख्यमंत्री देवेंद्र फडणवीस यांचे आवाहन",
    date: "2026-08-26",
    summary:
      "‘डिजिटल अरेस्ट’ सायबर जनजागृती लघुपट आणि ‘१९३० महाराष्ट्र सायबर अँथम’चे लोकार्पण\n\nसायबर गुन्हेगारांकडून पोलीस, सीबीआय किंवा न्यायाधीशांच्या नावाने घाबरवून होणाऱ्या ‘डिजिटल अरेस्ट’सारख्या फसवणुकीपासून सावध राहण्याचे आवाहन मुख्यमंत्री देवेंद्र फडणवीस यांनी केले. फसवणूक झाल्यानंतरचा ‘गोल्डन अवर’ महत्त्वाचा असल्याने नागरिकांनी तातडीने 1930 या सायबर हेल्पलाईनवर तक्रार करावी. यावेळी ‘डिजिटल अरेस्ट’ जनजागृती लघुपट आणि ‘1930 महाराष्ट्र सायबर अँथम’चे लोकार्पण करण्यात आले. AIमुळे निर्माण होणाऱ्या व्हॉईस क्लोनिंग, डीपफेक आणि बनावट ऑडिओ-व्हिडिओच्या धोक्यांबाबतही जनजागृतीची गरज अधोरेखित करण्यात आली.",
    posterImageUrl: "/posters/digital-arrest-cyber-jagruti-1930.svg",
    articlePdfUrl: "/pdfs/digital-arrest-cyber-jagruti-1930.pdf",
    category: "गृह व सुरक्षा",
    district: "मुंबई",
    source: SOURCE,
    author: DGIPR,
    language: "mr",
    tags: [
      "सायबर सुरक्षा",
      "डिजिटल अरेस्ट",
      "महाराष्ट्र सायबर",
      "हेल्पलाईन",
      "जनजागृती",
    ],
    featured: true,
  },
  {
    id: "2026-08-26-03",
    slug: "nepal-adaklele-paryatak-nanded-madat",
    title:
      "नेपाळमध्ये अडकलेल्या पर्यटकांनी जिल्हा आपत्कालीन कार्यकेंद्राशी संपर्क साधावा",
    date: "2026-08-26",
    summary:
      "नेपाळमधील रसुवा जिल्ह्यात भोटे कोशी नदीच्या पूरस्थितीमुळे अडकलेल्या नांदेड जिल्ह्यातील पर्यटकांनी किंवा त्यांच्या नातेवाईकांनी जिल्हा आपत्कालीन कार्यकेंद्राशी तात्काळ संपर्क साधण्याचे आवाहन करण्यात आले आहे. संपर्क करताना पर्यटकाचे नाव, मोबाईल क्रमांक, नेपाळमधील सध्याचे ठिकाण, प्रवासाचा तपशील आणि कुटुंबीयांचा संपर्क क्रमांक द्यावा. मदतीसाठी 02462-235077 आणि 1077 हे क्रमांक उपलब्ध आहेत.",
    posterImageUrl: "/posters/nepal-adaklele-paryatak-nanded-madat.svg",
    articlePdfUrl: "/pdfs/nepal-adaklele-paryatak-nanded-madat.pdf",
    category: "आपत्ती व्यवस्थापन",
    district: "नांदेड",
    source: SOURCE,
    author: "जिल्हा माहिती कार्यालय, नांदेड",
    language: "mr",
    tags: ["आपत्ती व्यवस्थापन", "नेपाळ", "पर्यटक", "हेल्पलाईन"],
    featured: true,
  },
  {
    id: "2026-08-26-04",
    slug: "haffkine-karmchari-pralambit-magnya",
    title:
      "हाफकिन महामंडळ कर्मचाऱ्यांच्या प्रलंबित मागण्यांवर सकारात्मक चर्चा – विधानपरिषदेचे उपसभापती सचिन अहिर",
    date: "2026-08-26",
    summary:
      "हाफकिन महामंडळातील कर्मचाऱ्यांना ‘सेवांतर्गत आश्वासित प्रगती योजना’ लागू करण्यासह त्यांच्या विविध प्रलंबित मागण्यांवर सकारात्मक चर्चा झाली. मंत्री नरहरी झिरवाळ यांनी योजनेबाबत सकारात्मक भूमिका दर्शवली. महामंडळ अधिक सक्षम व स्वयंपूर्ण करण्यासाठी मुंबई महानगरपालिकेला लागणाऱ्या औषधांची निर्मिती हाफकिनमध्ये करण्याचा प्रस्ताव तातडीने सादर करण्याचे निर्देशही उपसभापती सचिन अहिर यांनी दिले.",
    posterImageUrl: "/posters/haffkine-karmchari-pralambit-magnya.svg",
    articlePdfUrl: "/pdfs/haffkine-karmchari-pralambit-magnya.pdf",
    category: "प्रशासन",
    district: "मुंबई",
    source: SOURCE,
    author: DGIPR,
    language: "mr",
    tags: ["हाफकिन", "कर्मचारी", "विधानपरिषद", "अन्न व औषध प्रशासन", "आरोग्य"],
    featured: false,
  },
  {
    id: "2026-08-26-05",
    slug: "rajyapal-rakshabandhan-lokbhavan",
    title: "अनाथ, दिव्यांग मुलींकडून राज्यपालांचे रक्षाबंधन",
    date: "2026-08-26",
    summary:
      "आशा सेविका, पालिकेच्या घनकचरा व्यवस्थापन महिला कर्मचारी यांनी देखील राज्यपालांना राखी बांधली\n\nरक्षाबंधनानिमित्त अनाथ व दिव्यांग मुली, आशा सेविका, आरोग्य स्वयंसेविका, मुंबई महापालिकेच्या घनकचरा व्यवस्थापन विभागातील महिला कर्मचारी आणि विविध संस्थांतील महिलांनी राज्यपाल जिष्णुदेव वर्मा यांना लोकभवन येथे राखी बांधली. पालघरमधील स्वयंरोजगार करणाऱ्या आदिवासी महिलांनी पर्यावरणपूरक राखी बांधली. ब्रह्माकुमारी संस्था, आर्य समाज आणि नॅशनल असोसिएशन फॉर द ब्लाइंडशी संबंधित महिला व विद्यार्थिनीही या उपक्रमात सहभागी झाल्या. राज्यपालांनी रक्षाबंधन हा समाजातील विविध घटकांना एकत्र आणणारा पवित्र सण असल्याचे म्हटले.",
    posterImageUrl: "/posters/rajyapal-rakshabandhan-lokbhavan.svg",
    articlePdfUrl: "/pdfs/rajyapal-rakshabandhan-lokbhavan.pdf",
    category: "सामाजिक",
    district: "मुंबई",
    source: SOURCE,
    author: DGIPR,
    language: "mr",
    tags: [
      "रक्षाबंधन",
      "राज्यपाल",
      "महिला सक्षमीकरण",
      "दिव्यांग",
      "समाजकल्याण",
    ],
    featured: false,
  },
];

/** The list the app renders. Swap this for a loader when a CMS is added. */
export const articles: Article[] = ARTICLES;
