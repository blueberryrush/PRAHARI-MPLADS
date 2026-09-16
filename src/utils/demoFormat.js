/** Safe numeric display for SIH demo dashboards (never crash on null/undefined). */
export function safeNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatLakhs(value, digits = 1) {
  const n = safeNumber(value, 0);
  return n.toFixed(digits);
}

/** Cryptographic-style citizen tracking token, e.g. #CIT-VAR-2026-0916 */
export function generateCitizenTrackingHash(districtOrCode = 'VAR') {
  const code = String(districtOrCode || 'VAR')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const d = new Date();
  const y = d.getFullYear();
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `#CIT-${code}-${y}-${md}`;
}

export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target?.result || null);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}
