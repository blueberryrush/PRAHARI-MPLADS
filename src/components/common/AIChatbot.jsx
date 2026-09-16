import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Namaste! I am **PRAHARI AI Sahayak**, your dedicated MoSPI MPLADS governance assistant. How may I assist you with scheme guidelines, risk formulas, or project observations today?',
    textHi: 'नमस्ते! मैं **प्रहरी एआई सहायक** हूँ, आपका समर्पित MoSPI एमपीएलएडीएस प्रशासन सहायक। मैं योजना दिशानिर्देशों, जोखिम सूत्रों या परियोजना अवलोकनों में आपकी क्या मदद कर सकता हूँ?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const PROMPT_CHIPS = [
  {
    label: 'MPLADS fund guidelines',
    labelHi: 'एमपीएलएडीएस निधि दिशानिर्देश',
    prompt: 'What are the key fund allocation and eligibility guidelines under MoSPI MPLADS scheme?',
  },
  {
    label: 'How are risk scores calculated?',
    labelHi: 'जोखिम स्कोर की गणना कैसे होती है?',
    prompt: 'How are PRAHARI composite risk scores calculated for MPLADS public works?',
  },
  {
    label: 'How to report delayed work?',
    labelHi: 'विलंबित कार्य की शिकायत कैसे करें?',
    prompt: 'How can a citizen report a delayed or substandard MPLADS project with ground evidence?',
  },
];

export default function AIChatbot() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const hi = lang === 'hi';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const recentHistory = messages.slice(-5).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: recentHistory,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let replyText = '';
      if (response.ok) {
        const data = await response.json();
        replyText = data.reply || data.response || 'Response received.';
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.warn('Backend chat API failed, using intelligent client fallback:', err);

      // Intelligent Client Fallback for MoSPI governance queries
      const qLower = query.toLowerCase();
      const forceEnglish = ['in english', 'answer in english', 'english please', 'english me', 'english mein', 'reply in english'].some((k) => qLower.includes(k));
      const forceHindi = ['hindi me', 'hindi mein', 'in hindi', 'हिंदी में'].some((k) => qLower.includes(k)) || /[ऀ-ॿ]/.test(query);
      const isHinglish = !forceEnglish && !forceHindi && ['kaise', 'kya', 'shikayat', 'jokhim', 'paisa', 'batao'].some((k) => qLower.includes(k));

      let fallbackReply = '';

      if (['movie', 'song', 'game', 'cricket', 'football', 'joke', 'python', 'code', 'recipe', 'film'].some((k) => qLower.includes(k))) {
        fallbackReply = forceHindi
          ? 'मैं प्रहरी एआई सहायक हूँ, जो विशेष रूप से एमपीएलएडीएस दिशानिर्देशों, सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI) नियमों एवं नागरिक साक्ष्य सत्यापन हेतु समर्पित है। मैं गैर-प्रशासनिक प्रश्नों में सहायता नहीं कर सकता।'
          : 'I am PRAHARI AI Sahayak, dedicated exclusively to MPLADS guidelines, MoSPI scheme rules, project risk monitoring, and citizen grievance workflows. I cannot assist with non-governance queries.';
      } else if (['guideline', 'fund', 'allocation', '5 crore', '5 cr', 'rule', 'esakshi', 'नियम', 'निधि', 'दिशानिर्देश', 'paisa', 'paise'].some((k) => qLower.includes(k))) {
        fallbackReply = forceHindi
          ? '**MoSPI संशोधित दिशानिर्देश 2023:** प्रत्येक सांसद प्रति वर्ष ₹5 करोड़ तक के विकास कार्यों की सिफारिश कर सकते हैं। कम से कम 15% निधि अनुसूचित जाति (SC) और 7.5% अनुसूचित जनजाति (ST) क्षेत्रों हेतु अनिवार्य है। समस्त संस्वीकृति eSAKSHI पोर्टल द्वारा डिजिटल रूप से प्रबंधित होती है।'
          : forceEnglish
          ? '**MoSPI MPLADS Revised Guidelines 2023:** Each MP can recommend development works up to ₹5 Crore per annum. At least 15% funds must benefit Scheduled Caste areas and 7.5% for Scheduled Tribe areas. All processes are tracked on the eSAKSHI portal.'
          : '**MoSPI MPLADS Guidelines:** Har MP ko per year ₹5 Crore allocation milta hai. 15% SC aur 7.5% ST areas ke liye mandatory hai. Sabhi transactions eSAKSHI portal par live track hote hain.';
      } else if (['risk', 'score', 'formula', 'anomal', 'flag', 'जोखिम', 'स्कोर', 'jokhim'].some((k) => qLower.includes(k))) {
        fallbackReply = forceHindi
          ? '**प्रहरी कंपोजिट जोखिम स्कोर (0-100):** स्कोर = 0.25 × वित्तीय विचलन + 0.20 × स्थानिक दोहराव + 0.20 × समयसीमा विलंब + 0.15 × कार्यकारी एजेंसी ट्रैक रिकॉर्ड + 0.10 × DPR विचलन + 0.10 × नागरिक साक्ष्य विसंगति। 70+ स्कोर वाले कार्य उच्च प्राथमिकता में आते हैं।'
          : forceEnglish
          ? '**PRAHARI Composite Risk Score (0-100):** Formula = 0.25 × Financial Variance + 0.20 × Spatial Overlap + 0.20 × Temporal Slippage + 0.15 × Agency History + 0.10 × DPR Variance + 0.10 × Citizen Discrepancy. Projects with score ≥ 70 are flagged for priority inspection.'
          : '**PRAHARI Composite Risk Score:** Formula = 0.25 × Financial + 0.20 × Spatial + 0.20 × Delay + 0.15 × Agency + 0.10 × DPR + 0.10 × Citizen Reports. Score ≥ 70 hone par High Priority audit flag hota hai.';
      } else if (['report', 'delay', 'grievance', 'complaint', 'photo', 'evidence', 'शिकायत', 'विलंब', 'shikayat', 'kaise kare', 'deri'].some((k) => qLower.includes(k))) {
        fallbackReply = forceHindi
          ? '**एमपीएलएडीएस शिकायत / अवलोकन दर्ज करने की 6-चरण प्रक्रिया:**\n\n1. **नागरिक पोर्टल** (`/citizen`) पर जाएँ।\n2. खोज या मानचित्र से परियोजना चुनें।\n3. **\'Report Observation for this Project\'** पर क्लिक करें।\n4. श्रेणी चुनें (*रुका हुआ*, *घटिया निर्माण*, या *केवल कागजों पर पूर्ण*)।\n5. जियोटैग फोटो साक्ष्य अपलोड करें।\n6. त्वरित क्रिप्टोग्राफिक ट्रैकिंग टोकन (उदा. `#CIT-VAR-2024-XXXX`) प्राप्त करें।'
          : forceEnglish
          ? '**MPLADS Grievance Registration Process:**\n\nStep 1: Navigate to Citizen Portal (`/citizen`).\nStep 2: Locate the project via Search or Interactive Map.\nStep 3: Click \'Report Observation for this Project\'.\nStep 4: Select category (Stalled, Substandard, or Completed on Paper).\nStep 5: Upload geotagged photo evidence.\nStep 6: Receive a cryptographic tracking hash (e.g., `#CIT-VAR-2024-XXXX`).'
          : '**MPLADS Complaint / Grievance Steps:**\n\nStep 1: Citizen Portal (`/citizen`) open karein.\nStep 2: Search ya Map se project locate karein.\nStep 3: \'Report Observation for this Project\' par click karein.\nStep 4: Issue category (Stalled, Substandard, ya Completed on Paper) select karein.\nStep 5: Geotagged photo evidence upload karein.\nStep 6: Cryptographic tracking hash (jaise `#CIT-VAR-2024-XXXX`) receive karein.';
      } else {
        fallbackReply = forceHindi
          ? 'नमस्ते! मैं **प्रहरी एआई सहायक** हूँ। आप मुझसे एमपीएलएडीएस योजना नियम, जोखिम स्कोरिंग सूत्र, सीवीसी सतर्कता अनुपालन, अथवा नागरिक साक्ष्य दर्ज करने की प्रक्रिया के बारे में पूछ सकते हैं।'
          : forceEnglish
          ? 'Namaste! I am **PRAHARI AI Sahayak**, your dedicated MoSPI MPLADS Governance Assistant. Feel free to ask about scheme guidelines, risk scoring formulas, CVC compliance, or citizen observation workflows.'
          : 'Namaste! Main **PRAHARI AI Sahayak** hoon. Aap mujhse MPLADS guidelines, risk scoring formula, ya citizen complaint workflow ke baare mein pooch sakte hain.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format markdown bold
  const renderFormattedText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      className="prahari-ai-chatbot-root"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
    >
      {/* ── Floating Action Button (FAB) ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open PRAHARI AI Sahayak"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 24px rgba(6, 95, 70, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(6, 95, 70, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 95, 70, 0.45)';
          }}
        >
          <Bot size={26} />
          {/* Active AI Pulse Dot */}
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#34d399',
              border: '2px solid #065f46',
            }}
          />
        </button>
      )}

      {/* ── Chat Window Card ── */}
      {isOpen && (
        <div
          className="prahari-chatbot-window"
          style={{
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            height: 500,
            maxHeight: 'calc(100vh - 48px)',
            background: isDark ? '#141210' : '#ffffff',
            color: isDark ? '#f5f5f4' : '#1c1917',
            borderRadius: 16,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
            border: isDark ? '1px solid #292524' : '1px solid #e7e5e4',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Top Bar / Header */}
          <div
            style={{
              padding: '12px 16px',
              background: isDark
                ? 'linear-gradient(135deg, #0f291e 0%, #17382b 100%)'
                : 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong style={{ fontSize: 13, display: 'block', lineHeight: 1.2 }}>
                  {hi ? 'प्रहरी एआई सहायक' : 'PRAHARI AI Sahayak'}
                </strong>
                <span style={{ fontSize: 10, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  MoSPI MPLADS Assistant
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#ffffff',
                  opacity: 0.85,
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Prompt Chips Bar */}
          <div
            style={{
              padding: '8px 12px',
              background: isDark ? '#1c1917' : '#f8f7f4',
              borderBottom: isDark ? '1px solid #292524' : '1px solid #e7e5e4',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isLoading}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: isDark ? '1px solid #332d29' : '1px solid #d6d3d1',
                  background: isDark ? '#26221f' : '#ffffff',
                  color: isDark ? '#d6d3d1' : '#44403c',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.background = isDark ? '#38322c' : '#f0eee9';
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.background = isDark ? '#26221f' : '#ffffff';
                }}
              >
                {hi ? chip.labelHi : chip.label}
              </button>
            ))}
          </div>

          {/* Message List Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: isDark ? '#141210' : '#ffffff',
            }}
          >
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '9px 12px',
                      borderRadius: isAssistant ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                      background: isAssistant
                        ? isDark
                          ? '#1f1c19'
                          : '#f0fdf4'
                        : '#047857',
                      color: isAssistant
                        ? isDark
                          ? '#f5f5f4'
                          : '#14532d'
                        : '#ffffff',
                      border: isAssistant
                        ? isDark
                          ? '1px solid #292524'
                          : '1px solid #bbf7d0'
                        : 'none',
                      fontSize: 12,
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderFormattedText(hi && msg.textHi ? msg.textHi : msg.text)}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      color: isDark ? '#78716c' : '#a8a29e',
                      marginTop: 3,
                      padding: '0 4px',
                    }}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontSize: 11, padding: '4px 0' }}>
                <Loader2 size={14} className="spin" />
                <span>{hi ? 'प्रहरी एआई उत्तर तैयार कर रहा है…' : 'PRAHARI AI is analyzing…'}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: isDark ? '1px solid #292524' : '1px solid #e7e5e4',
              background: isDark ? '#1c1917' : '#f8f7f4',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hi ? 'एमपीएलएडीएस प्रश्न पूछें...' : 'Ask about MPLADS rules, risk scores...'}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: isDark ? '1px solid #332d29' : '1px solid #d6d3d1',
                background: isDark ? '#141210' : '#ffffff',
                color: isDark ? '#f5f5f4' : '#1c1917',
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: 0,
                background: inputValue.trim() && !isLoading ? '#047857' : isDark ? '#292524' : '#e7e5e4',
                color: inputValue.trim() && !isLoading ? '#ffffff' : isDark ? '#78716c' : '#a8a29e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
