const FAQ = require("../models/FAQ");

const PORTAL_INFO = `FAQHub Portal Guide:
- Home (/): Platform overview
- FAQs (/faq): Browse all frequently asked questions by category
- Ask (/raise-query): Raise a new question (check FAQs first!)
- Community (/community-qa): View and answer community questions
- Profile (/profile): View your raised queries, answers, and notifications
- Admin (/admin): Platform management (admin only)

How to use:
1. Browse FAQs first — your answer might already exist
2. If not found, go to Ask to raise a question
3. Community members can answer your questions
4. Admin approves answers and publishes them as FAQs`;

const STOP_WORDS = new Set(["what", "how", "when", "where", "does", "the", "and", "for", "are", "can", "you", "your", "this", "that", "with", "from", "have", "will", "about", "some", "tell", "give", "show", "know", "its", "it", "is", "do", "i", "my", "me", "we", "us", "our", "to", "of", "in", "on", "at", "by", "or", "an", "a"]);

const GREETINGS = /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening)|namaste|yo|hola|sup|what'?s\s*up|how\s*are\s*you|hru|heya|hiya|hej|hallo|bonjour|ciao|salut|gm|gn|nvm|ok|thanks|thank you|bye|tata|see you|good night)$/i;

const LANG_MAP = { en: "English", hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil", ur: "Urdu", gu: "Gujarati", ml: "Malayalam", kn: "Kannada", pa: "Punjabi" };

const GREETING_REPLIES = {
  en: "Hey there! I'm your FAQ Friend. Ask me anything about the portal or VINS internship!",
  hi: "नमस्ते! मैं आपका FAQ Friend हूँ। पोर्टल या VINS इंटर्नशिप के बारे में कुछ भी पूछें!",
  bn: "হ্যালো! আমি আপনার FAQ Friend। পোর্টাল বা VINS ইন্টার্নশিপ সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন!",
  te: "హాయ్! నేను మీ FAQ Friend. పోర్టల్ లేదా VINS ఇంటర్న్షిప్ గురించి ఏదైనా అడగండి!",
  mr: "नमस्कार! मी तुमचा FAQ Friend. पोर्टल किंवा VINS इंटर्नशिपबद्दल काहीही विचारा!",
  ta: "வணக்கம்! நான் உங்கள் FAQ Friend. போர்டல் அல்லது VINS இன்டர்ன்ஷிப் பற்றி ஏதும் கேளுங்கள்!",
  ur: "ہیلو! میں آپ کا FAQ Friend. پورٹل یا VINS انٹرن شپ کے بارے میں کچھ بھی پوچھیں!",
  gu: "નમસ્તે! હું તમારો FAQ Friend. પોર્ટલ અથવા VINS ઇન્ટર્નશિપ વિશે કંઈપણ પૂછો!",
  ml: "ഹായ്! ഞാൻ നിങ്ങളുടെ FAQ Friend. പോർട്ടലിനെക്കുറിച്ചോ VINS ഇന്റേൺഷിപ്പിനെക്കുറിച്ചോ എന്തും ചോദിക്കൂ!",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ FAQ Friend. ಪೋರ್ಟಲ್ ಅಥವಾ VINS ಇಂಟರ್ನ್ಶಿಪ್ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ!",
  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ FAQ Friend. ਪੋਰਟਲ ਜਾਂ VINS ਇੰਟਰਨਸ਼ਿਪ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ!",
};

const FAQ_PREFIXES = {
  en: "Here's what I found:",
  hi: "यहाँ मुझे क्या मिला:",
  bn: "আমি যা পেয়েছি তা এখানে:",
  te: "నేను కనుగొన్నది ఇక్కడ ఉంది:",
  mr: "मला काय सापडले ते येथे आहे:",
  ta: "நான் கண்டறிந்தது இங்கே:",
  ur: "مجھے جو ملا وہ یہاں ہے:",
  gu: "મને જે મળ્યું તે અહીં છે:",
  ml: "ഞാൻ കണ്ടെത്തിയത് ഇതാ:",
  kn: "ನಾನು ಕಂಡುಕೊಂಡಿದ್ದು ಇಲ್ಲಿದೆ:",
  pa: "ਮੈਨੂੰ ਜੋ ਮਿਲਿਆ ਉਹ ਇੱਥੇ ਹੈ:",
};

const NO_MATCH_FALLBACKS = {
  en: "I couldn't find a matching FAQ for your question. Here's how I can help:\n\n1. **Browse FAQs** — Visit the FAQ page to search all categories\n2. **Raise a Query** — Go to the Ask page to submit your question\n3. **Community** — Other members can answer your question in the Community Hub",
  hi: "आपके प्रश्न के लिए कोई मिलता-जुलता FAQ नहीं मिला। मैं इस प्रकार मदद कर सकता हूँ:\n\n1. **FAQ ब्राउज़ करें** — सभी श्रेणियों में खोजने के लिए FAQ पेज पर जाएँ\n2. **प्रश्न पूछें** — अपना प्रश्न सबमिट करने के लिए Ask पेज पर जाएँ\n3. **समुदाय** — अन्य सदस्य सामुदायिक हब में आपके प्रश्न का उत्तर दे सकते हैं",
  bn: "আপনার প্রশ্নের জন্য কোনো মিলে যাওয়া FAQ পাওয়া যায়নি। আমি এইভাবে সাহায্য করতে পারি:\n\n1. **FAQ ব্রাউজ করুন** — সব ক্যাটাগরিতে সার্চ করতে FAQ পেজে যান\n2. **প্রশ্ন জিজ্ঞাসা করুন** — আপনার প্রশ্ন জমা দিতে Ask পেজে যান\n3. **কমিউনিটি** — অন্যান্য সদস্য কমিউনিটি হাবে আপনার প্রশ্নের উত্তর দিতে পারেন",
  te: "మీ ప్రశ్నకు సరిపోలే FAQ కనుగొనబడలేదు. నేను ఈ విధంగా సహాయం చేయగలను:\n\n1. **FAQలను బ్రౌజ్ చేయండి** — అన్ని వర్గాలలో శోధించడానికి FAQ పేజీని సందర్శించండి\n2. **ప్రశ్న అడగండి** — మీ ప్రశ్నను సమర్పించడానికి Ask పేజీకి వెళ్ళండి\n3. **కమ్యూనిటీ** — ఇతర సభ్యులు కమ్యూనిటీ హబ్లో మీ ప్రశ్నకు సమాధానం ఇవ్వగలరు",
  mr: "आपल्या प्रश्नाशी जुळणारा FAQ सापडला नाही. मी अशा प्रकारे मदत करू शकतो:\n\n1. **FAQ ब्राउझ करा** — सर्व श्रेणींमध्ये शोधण्यासाठी FAQ पेजला भेट द्या\n2. **प्रश्न विचारा** — तुमचा प्रश्न सबमिट करण्यासाठी Ask पेजवर जा\n3. **समुदाय** — इतर सदस्य समुदाय हबमध्ये तुमच्या प्रश्नाचे उत्तर देऊ शकतात",
  ta: "உங்கள் கேள்விக்கு பொருந்தும் FAQ எதுவும் கண்டுபிடிக்கப்படவில்லை. நான் இவ்வாறு உதவ முடியும்:\n\n1. **FAQஐ உலாவுக** — அனைத்து பிரிவுகளிலும் தேட FAQ பக்கத்தைப் பார்வையிடவும்\n2. **கேள்வி கேளுங்கள்** — உங்கள் கேள்வியை சமர்ப்பிக்க Ask பக்கத்திற்குச் செல்லவும்\n3. **சமூகம்** — பிற உறுப்பினர்கள் சமூக மையத்தில் உங்கள் கேள்விக்கு பதிலளிக்கலாம்",
  ur: "آپ کے سوال سے ملتا جلتا کوئی FAQ نہیں ملا۔ میں اس طرح مدد کر سکتا ہوں:\n\n1. **FAQ براؤز کریں** — تمام زمروں میں تلاش کرنے کے لیے FAQ صفحہ دیکھیں\n2. **سوال پوچھیں** — اپنا سوال جمع کرانے کے لیے Ask صفحہ پر جائیں\n3. **کمیونٹی** — دوسرے اراکین کمیونٹی ہب میں آپ کے سوال کا جواب دے سکتے ہیں",
  gu: "તમારા પ્રશ્ન માટે કોઈ મેળ ખાતો FAQ મળ્યો નથી. હું આ રીતે મદદ કરી શકું છું:\n\n1. **FAQ બ્રાઉઝ કરો** — બધી શ્રેણીઓમાં શોધવા FAQ પેજની મુલાકાત લો\n2. **પ્રશ્ન પૂછો** — તમારો પ્રશ્ન સબમિટ કરવા Ask પેજ પર જાઓ\n3. **સમુદાય** — અન્ય સભ્યો સમુદાય હબમાં તમારા પ્રશ્નનો જવાબ આપી શકે છે",
  ml: "നിങ്ങളുടെ ചോദ്യത്തിന് അനുയോജ്യമായ FAQ കണ്ടെത്തിയില്ല. ഞാൻ ഇങ്ങനെ സഹായിക്കാം:\n\n1. **FAQ ബ്രൗസ് ചെയ്യുക** — എല്ലാ വിഭാഗങ്ങളിലും തിരയാൻ FAQ പേജ് സന്ദർശിക്കുക\n2. **ചോദ്യം ചോദിക്കുക** — നിങ്ങളുടെ ചോദ്യം സമർപ്പിക്കാൻ Ask പേജിലേക്ക് പോകുക\n3. **കമ്മ്യൂണിറ്റി** — മറ്റ് അംഗങ്ങൾക്ക് കമ്മ്യൂണിറ്റി ഹബിൽ നിങ്ങളുടെ ചോദ്യത്തിന് ഉത്തരം നൽകാം",
  kn: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಹೊಂದಾಣಿಕೆಯಾಗುವ FAQ ಕಂಡುಬಂದಿಲ್ಲ. ನಾನು ಈ ರೀತಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n\n1. **FAQ ಬ್ರೌಸ್ ಮಾಡಿ** — ಎಲ್ಲಾ ವರ್ಗಗಳಲ್ಲಿ ಹುಡುಕಲು FAQ ಪುಟಕ್ಕೆ ಭೇಟಿ ನೀಡಿ\n2. **ಪ್ರಶ್ನೆ ಕೇಳಿ** — ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಸಲ್ಲಿಸಲು Ask ಪುಟಕ್ಕೆ ಹೋಗಿ\n3. **ಸಮುದಾಯ** — ಇತರ ಸದಸ್ಯರು ಸಮುದಾಯ ಹಬ್ನಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಬಹುದು",
  pa: "ਤੁਹਾਡੇ ਸਵਾਲ ਲਈ ਕੋਈ ਮੇਲ ਖਾਂਦਾ FAQ ਨਹੀਂ ਮਿਲਿਆ। ਮੈਂ ਇਸ ਤਰ੍ਹਾਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:\n\n1. **FAQ ਬ੍ਰਾਊਜ਼ ਕਰੋ** — ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ ਵਿੱਚ ਖੋਜ ਕਰਨ ਲਈ FAQ ਪੰਨੇ 'ਤੇ ਜਾਓ\n2. **ਸਵਾਲ ਪੁੱਛੋ** — ਆਪਣਾ ਸਵਾਲ ਜਮ੍ਹਾਂ ਕਰਨ ਲਈ Ask ਪੰਨੇ 'ਤੇ ਜਾਓ\n3. **ਕਮਿਊਨਿਟੀ** — ਹੋਰ ਮੈਂਬਰ ਕਮਿਊਨਿਟੀ ਹੱਬ ਵਿੱਚ ਤੁਹਾਡੇ ਸਵਾਲ ਦਾ ਜਵਾਬ ਦੇ ਸਕਦੇ ਹਨ",
};

const translateText = async (text, targetLang) => {
  if (!targetLang || targetLang === "en") return text;
  if (!text || text.length > 3000) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.[0]?.map(s => s?.[0]).filter(Boolean).join("");
    return translated || text;
  } catch {
    return text;
  }
};

const searchFAQs = async (query) => {
  try {
    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    if (words.length === 0) return [];

    const allFAQs = await FAQ.find().select("question answer category tags faqNumber").lean();
    const scored = allFAQs.map((faq) => {
      const text = `${faq.question} ${faq.answer} ${faq.tags?.join(" ") || ""}`.toLowerCase();
      const qLower = faq.question.toLowerCase();
      let score = 0;
      words.forEach((w) => {
        if (text.includes(w)) score += 1;
        if (qLower.includes(w)) score += 3;
        if (faq.tags?.some((t) => t.toLowerCase().includes(w))) score += 1;
      });
      const wordsInQ = words.filter((w) => qLower.includes(w)).length;
      if (words.length > 0 && wordsInQ === words.length) score += 5;
      return { ...faq, score };
    });

    return scored.filter((f) => f.score > 0).sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
};

const lookupFAQByNumber = async (query) => {
  const match = query.match(/#(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const faq = await FAQ.findOne({ faqNumber: num }).select("question answer category tags faqNumber").lean();
  return faq || null;
};

const aiChat = async (req, res, next) => {
  try {
    const { message, language, history } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const lang = LANG_MAP[language] || "English";
    const trimmed = message.trim();

    // Handle greetings and short casual messages
    if (GREETINGS.test(trimmed)) {
      const reply = GREETING_REPLIES[language] || GREETING_REPLIES.en;
      return res.json({ reply, language: lang, faqMatch: false });
    }

    // Check for FAQ number lookup (e.g., "#5 explain", "what is #12")
    const numberedFAQ = await lookupFAQByNumber(trimmed);
    if (numberedFAQ) {
      const prefix = FAQ_PREFIXES[language] || FAQ_PREFIXES.en;
      const qText = language !== "en" ? await translateText(numberedFAQ.question, language) : numberedFAQ.question;
      const aText = language !== "en" ? await translateText(numberedFAQ.answer, language) : numberedFAQ.answer;
      let reply = `${prefix}\n\n**FAQ #${numberedFAQ.faqNumber}: ${qText}**\n\n${aText}`;
      reply += `\n\n_(Category: ${numberedFAQ.category})_`;
      return res.json({ reply, language: lang, faqMatch: true });
    }

    const matchedFAQs = await searchFAQs(trimmed);

    // Try AI API — if unavailable or key invalid, fall back to FAQ-only mode
    const apiKey = process.env.X_API_KEY;
    const apiURL = process.env.AI_API_URL || "https://api.minimax.io/v1/chat/completions";
    const modelName = process.env.AI_MODEL || "MiniMax-M2.7";

    if (apiKey) {
      try {
        const faqContext = matchedFAQs.length > 0
          ? matchedFAQs.map((f, i) => `FAQ ${i + 1}:\nQ: ${f.question}\nA: ${f.answer}\nCategory: ${f.category}`).join("\n\n")
          : "No matching FAQ found.";

        const systemPrompt = `You are a helpful FAQ support bot for FAQHub. Respond in ${lang}.

CRITICAL RULES:
1. PRIORITY: Check the FAQs below FIRST. If a FAQ matches the user's question, provide that FAQ answer DIRECTLY. Do NOT give generic advice when a FAQ exists.
2. When a FAQ matches, answer with the FAQ content. Do NOT say "based on the FAQ" — just give the answer.
3. If NO FAQ matches, then help the user by explaining how to use the portal or how to raise a question.
4. Keep answers SHORT — 1-3 sentences for FAQ answers.
5. If the user asks about the portal, use the PORTAL GUIDE below.

FAQs (USE THESE if they match):
${faqContext}

PORTAL GUIDE:
${PORTAL_INFO}`;

        const response = await fetch(apiURL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              ...(history || []),
              { role: "user", content: message },
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const data = await response.json();
          let reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
          // Strip all <think>...</think> blocks (including nested)
          reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          return res.json({ reply, language: lang, faqMatch: matchedFAQs.length > 0 });
        }
      } catch {
        // Fall through to FAQ-only mode
      }
    }

    // FAQ-only fallback — no AI API needed
    // Only show result if top match has strong question-level relevance
    const best = matchedFAQs[0];
    if (best) {
      const queryWords = message.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
      const wordsInQuestion = queryWords.filter((w) => best.question.toLowerCase().includes(w)).length;
      const questionCoverage = queryWords.length > 0 ? wordsInQuestion / queryWords.length : 0;

      // Show FAQ if: most query words appear in the question, OR score is high enough
      if (questionCoverage >= 0.5 || best.score >= 6) {
        const prefix = FAQ_PREFIXES[language] || FAQ_PREFIXES.en;
        const qText = language !== "en" ? await translateText(best.question, language) : best.question;
        const aText = language !== "en" ? await translateText(best.answer, language) : best.answer;
        let reply = `${prefix}\n\n**FAQ #${best.faqNumber || "—"}: ${qText}**\n\n${aText}`;
        reply += `\n\n_(Category: ${best.category})_`;
        return res.json({ reply, language: lang, faqMatch: true });
      }
    }

    // No FAQs matched, no AI available
    const fallbackMsg = NO_MATCH_FALLBACKS[language] || NO_MATCH_FALLBACKS.en;
    const portalGuide = `${fallbackMsg}\n\n${PORTAL_INFO}`;
    res.json({ reply: portalGuide, language: lang, faqMatch: false });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({ message: "AI service timeout" });
    }
    next(error);
  }
};

const suggestFAQs = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });
    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    if (words.length === 0) return res.json([]);
    const allFAQs = await FAQ.find().select("question answer category tags faqNumber").lean();
    const scored = allFAQs.map((faq) => {
      const text = `${faq.question} ${faq.answer} ${faq.tags?.join(" ") || ""}`.toLowerCase();
      const qLower = faq.question.toLowerCase();
      let score = 0;
      words.forEach((w) => {
        if (text.includes(w)) score += 1;
        if (qLower.includes(w)) score += 3;
      });
      const wordsInQ = words.filter((w) => qLower.includes(w)).length;
      if (words.length > 0 && wordsInQ === words.length) score += 5;
      return { ...faq, score };
    });
    const results = scored.filter((f) => f.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = { aiChat, suggestFAQs };
