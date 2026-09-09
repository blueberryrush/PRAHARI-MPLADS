import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SpeakerButton({ text, label = true }) {
  const { lang } = useLanguage();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.92;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button className={`speaker-control ${speaking ? 'is-speaking' : ''}`} onClick={speak} aria-label={speaking ? 'Stop reading' : 'Listen'}>
      {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
      {label && <span>{speaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : (lang === 'hi' ? 'सुनें' : 'Listen')}</span>}
    </button>
  );
}
