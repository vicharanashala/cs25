import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Globe, Image, Bot, User, ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import VoiceInputButton from "../ui/VoiceInputButton";

function FriendlyBot({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="botGrad" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#botGrad)" />
      <circle cx="35" cy="42" r="6" fill="white" />
      <circle cx="65" cy="42" r="6" fill="white" />
      <circle cx="35" cy="42" r="3" fill="#1e1b4b" />
      <circle cx="65" cy="42" r="3" fill="#1e1b4b" />
      <circle cx="33" cy="40" r="1.5" fill="white" opacity="0.8" />
      <circle cx="63" cy="40" r="1.5" fill="white" opacity="0.8" />
      <path d="M35 62 Q50 75 65 62" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="25" cy="55" rx="6" ry="4" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="75" cy="55" rx="6" ry="4" fill="#f9a8d4" opacity="0.5" />
      <rect x="38" y="18" width="24" height="10" rx="5" fill="white" opacity="0.9" />
      <circle cx="50" cy="14" r="4" fill="white" opacity="0.7" />
    </svg>
  );
}

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
];

function formatText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^## (.*$)/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^# (.*$)/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^\d+\.\s+(.*$)/gm, '• $1')
    .replace(/\n/g, '<br/>');
}

const WELCOME_MESSAGE = {
  en: "Hey there! I'm your FAQ Friend. Ask me anything about the portal or VINS internship!",
  hi: "नमस्ते! मैं आपका FAQ Friend हूँ। पोर्टल या VINS इंटर्नशिप के बारे में कुछ भी पूछें!",
  bn: "হ্যালো! আমি আপনার FAQ Friend. পোর্টাল বা VINS ইন্টার্নশিপ সম্পর্কে কিছু জিজ্ঞাসা করুন!",
  te: "హాయ్! నేను మీ FAQ Friend. పోర్టల్ లేదా VINS ఇంటర్న్షిప్ గురించి ఏదైనా అడగండి!",
  mr: "नमस्कार! मी तुमचा FAQ Friend. पोर्टल किंवा VINS इंटर्नशिपबद्दल काहीही विचारा!",
  ta: "வணக்கம்! நான் உங்கள் FAQ Friend. போர்டல் அல்லது VINS இன்டர்ன்ஷிப் பற்றி ஏதும் கேளுங்கள்!",
  ur: "ہیلو! میں آپ کا FAQ Friend. پورٹل یا VINS انٹرن شپ کے بارے میں کچھ بھی پوچھیں!",
  gu: "નમસ્તે! હું તમારો FAQ Friend. પોર્ટલ અથવા VINS ઇન્ટર્નશિપ વિશે કંઈપણ પૂછો!",
  ml: "ഹായ്! ഞാൻ നിങ്ങളുടെ FAQ Friend. പോർട്ടലിനെക്കുറിച്ചോ VINS ഇന്റേൺഷിപ്പിനെക്കുറിച്ചോ എന്തും ചോദിക്കൂ!",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ FAQ Friend. ಪೋರ್ಟಲ್ ಅಥವಾ VINS ಇಂಟರ್ನ್ಶಿಪ್ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ!",
  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ FAQ Friend. ਪੋਰਟਲ ਜਾਂ VINS ਇੰਟਰਨਸ਼ਿਪ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ!",
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [showLang, setShowLang] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: WELCOME_MESSAGE[language] || WELCOME_MESSAGE.en }]);
    }
  }, [open]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const sendMessage = async (text) => {
    if (!text?.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setLoading(true);
    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI request failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      toast.error("AI service unavailable. Please try again.");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm temporarily unavailable. Please try again." }]);
    } finally { setLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessages((prev) => [...prev, { role: "user", content: `[Image uploaded](${data.url})`, image: data.url }]);
      setMessages((prev) => [...prev, { role: "assistant", content: "I can see the image. What would you like to know about it?" }]);
    } catch { toast.error("Failed to upload image"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const quickActions = ["What is this platform about?", "How do I raise a query?", "How does FAQ work?"];

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl gradient-primary shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow flex items-center justify-center overflow-hidden"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <FriendlyBot size={42} />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] rounded-3xl shadow-2xl flex flex-col overflow-hidden glass-strong border border-white/10"
          >
            {/* Header */}
            <div className="p-4 gradient-primary text-white shrink-0 relative">
              <div className="absolute inset-0 noise rounded-3xl" />
              <div className="relative z-10 flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
                    <FriendlyBot size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">FAQ Friend</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <p className="text-[10px] text-white/70">Online</p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowLang(!showLang)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs backdrop-blur">
                    <Globe className="w-3.5 h-3.5" />
                    {LANGUAGES.find((l) => l.code === language)?.native || "English"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {showLang && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full right-0 mt-2 w-44 glass-strong rounded-2xl shadow-2xl py-1 max-h-52 overflow-y-auto z-10 border border-white/10">
                        {LANGUAGES.map((lang) => (
                          <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowLang(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between ${lang.code === language ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                            <span>{lang.native}</span>
                            <span className="text-[10px] text-gray-400">{lang.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white shrink-0 mt-0.5 overflow-hidden shadow-lg shadow-indigo-500/20">
                      <FriendlyBot size={32} />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "gradient-primary text-white rounded-tr-md shadow-lg shadow-indigo-500/20"
                        : "glass dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-tl-md"
                    }`}>
                      {msg.image ? (
                        <div>
                          <img src={msg.image} alt="uploaded" className="max-w-full rounded-xl mb-1 max-h-36 object-cover" />
                          <span className="text-[10px] opacity-70">Uploaded image</span>
                        </div>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white shrink-0 mt-0.5 overflow-hidden shadow-lg shadow-indigo-500/20">
                    <FriendlyBot size={32} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl glass border border-gray-200 dark:border-gray-700/50 rounded-tl-md">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {quickActions.map((action) => (
                    <button key={action} onClick={() => sendMessage(action)}
                      className="px-3 py-1.5 rounded-xl text-xs glass border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                      <Sparkles className="w-3 h-3 inline mr-1" />{action}
                    </button>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 shrink-0 backdrop-blur">
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                  placeholder={`Ask in ${LANGUAGES.find((l) => l.code === language)?.name || "English"}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl glass border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                />
                <VoiceInputButton onTranscript={(text) => setInput(input + (input ? " " : "") + text)} />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl gradient-primary text-white shrink-0 border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
