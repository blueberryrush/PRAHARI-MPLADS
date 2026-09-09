import { useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import { useCaseContext } from '../contexts/CaseContext';

export default function CalibrationToast() {
  const { activeToast, clearToast } = useCaseContext();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(clearToast, 6000);
    return () => clearTimeout(timer);
  }, [activeToast, clearToast]);

  if (!activeToast) return null;

  return (
    <div className="calibration-toast" role="status" aria-live="polite">
      <div className="calibration-toast-icon">
        <Zap size={14} />
      </div>
      <div className="calibration-toast-body">
        <span className="calibration-toast-label">MODEL CALIBRATION</span>
        <p>{activeToast}</p>
      </div>
      <button className="calibration-toast-close" onClick={clearToast} aria-label="Dismiss toast">
        <X size={13} />
      </button>
    </div>
  );
}
