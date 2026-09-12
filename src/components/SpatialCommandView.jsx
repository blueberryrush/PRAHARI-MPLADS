import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const W = 760;
const H = 450;

// Administrative block polygons for Varanasi District
const DISTRICT_BLOCKS = [
  {
    id: 'pindra',
    nameEn: 'Pindra Block',
    nameHi: 'पिंडरा ब्लॉक',
    d: 'M 40,30 L 260,20 L 320,130 L 190,190 L 50,160 Z',
    labelX: 145,
    labelY: 95,
    fill: '#221f1b',
    stroke: '#44403c',
  },
  {
    id: 'shivpur',
    nameEn: 'Shivpur Block',
    nameHi: 'शिवपुर ब्लॉक',
    d: 'M 260,20 L 520,30 L 490,160 L 320,130 Z',
    labelX: 380,
    labelY: 85,
    fill: '#26231f',
    stroke: '#44403c',
  },
  {
    id: 'arajiline',
    nameEn: 'Arajiline Block',
    nameHi: 'आराजीलाइन ब्लॉक',
    d: 'M 50,160 L 190,190 L 240,330 L 90,380 L 40,270 Z',
    labelX: 130,
    labelY: 260,
    fill: '#1f1c19',
    stroke: '#44403c',
  },
  {
    id: 'kashi',
    nameEn: 'Kashi Urban',
    nameHi: 'काशी नगर',
    d: 'M 490,160 L 680,140 L 710,290 L 520,320 L 370,250 L 320,130 Z',
    labelX: 520,
    labelY: 215,
    fill: '#282420',
    stroke: '#57534e',
  },
  {
    id: 'rohaniya',
    nameEn: 'Rohaniya Block',
    nameHi: 'रोहनिया ब्लॉक',
    d: 'M 190,190 L 370,250 L 520,320 L 480,430 L 220,440 L 240,330 Z',
    labelX: 340,
    labelY: 345,
    fill: '#24201c',
    stroke: '#44403c',
  },
];

// Curated Varanasi District Projects mapped accurately to blocks
const VARANASI_DISTRICT_PROJECTS = [
  {
    id: 'PRJ002',
    name: 'Village Road Construction - Varanasi Block B',
    code: 'PRJ002 • Road Construction Block B',
    blockEn: 'Rohaniya Block',
    blockHi: 'रोहनिया ब्लॉक',
    sector: 'Roadways',
    sanctionedAmount: 1200000,
    spentAmount: 2200000,
    riskScore: 86,
    status: 'high',
    color: '#C85A32',
    triggerEn: 'Cost Overrun (+83%) & Spatial Overlap Flagged',
    triggerHi: 'लागत में 83% वृद्धि और स्थानिक दोहराव चिह्नित',
    cx: 330,
    cy: 330,
    nearWater: false,
  },
  {
    id: 'PRJ001',
    name: 'Village Road Construction - Varanasi Block A',
    code: 'PRJ001 • Road Construction Block A',
    blockEn: 'Shivpur Block',
    blockHi: 'शिवपुर ब्लॉक',
    sector: 'Roadways',
    sanctionedAmount: 1200000,
    spentAmount: 1180000,
    riskScore: 24,
    status: 'stable',
    color: '#059669',
    triggerEn: 'Within Budget · Physical 100% Verified',
    triggerHi: 'बजट के भीतर · 100% भौतिक कार्य सत्यापित',
    cx: 390,
    cy: 85,
    nearWater: false,
  },
  {
    id: 'PRJ006',
    name: 'Tube Well Installation - Varanasi Rural',
    code: 'PRJ006 • Tube Well Cluster Pindra',
    blockEn: 'Pindra Block',
    blockHi: 'पिंडरा ब्लॉक',
    sector: 'Waterworks',
    sanctionedAmount: 500000,
    spentAmount: 480000,
    riskScore: 18,
    status: 'stable',
    color: '#059669',
    triggerEn: 'Geo-tagged Assets Verified · Zero Deviation',
    triggerHi: 'जियो-टैग्ड संपत्तियां सत्यापित · कोई विचलन नहीं',
    cx: 155,
    cy: 85,
    nearWater: true,
  },
  {
    id: 'PRJ013',
    name: 'Primary Health Center - Varanasi',
    code: 'PRJ013 • Primary Health Center Kashi',
    blockEn: 'Kashi Urban',
    blockHi: 'काशी नगर',
    sector: 'Health',
    sanctionedAmount: 4000000,
    spentAmount: 3800000,
    riskScore: 58,
    status: 'moderate',
    color: '#D97706',
    triggerEn: 'Milestone Delay (18 Days) · Material Audit',
    triggerHi: '18 दिन की समयसीमा विलंब · सामग्री ऑडिट',
    cx: 505,
    cy: 215,
    nearWater: false,
  },
  {
    id: 'PRJ046',
    name: 'Ghat Embankment & Stone Pitching',
    code: 'PRJ046 • Kashi Ghat Riverfront Works',
    blockEn: 'Kashi Urban',
    blockHi: 'काशी नगर',
    sector: 'Waterworks',
    sanctionedAmount: 3500000,
    spentAmount: 5400000,
    riskScore: 88,
    status: 'high',
    color: '#C85A32',
    triggerEn: 'Duplicate Tender & Overlapping Geo-boundary',
    triggerHi: 'दोहरा टेंडर और ओवरलैपिंग भौगोलिक सीमा',
    cx: 565,
    cy: 255,
    nearWater: true,
  },
  {
    id: 'PRJ022',
    name: 'Solar Street Lighting - Pindra Rural',
    code: 'PRJ022 • Solar Light Grid Pindra',
    blockEn: 'Pindra Block',
    blockHi: 'पिंडरा ब्लॉक',
    sector: 'Electrification',
    sanctionedAmount: 850000,
    spentAmount: 820000,
    riskScore: 22,
    status: 'stable',
    color: '#059669',
    triggerEn: 'All 65 Units Operational on Dashboard',
    triggerHi: 'सभी 65 इकाइयां सक्रिय रूप से सत्यापित',
    cx: 215,
    cy: 115,
    nearWater: false,
  },
  {
    id: 'PRJ019',
    name: 'Community Water Tank & Filtration',
    code: 'PRJ019 • Water Tank Arajiline West',
    blockEn: 'Arajiline Block',
    blockHi: 'आराजीलाइन ब्लॉक',
    sector: 'Waterworks',
    sanctionedAmount: 1500000,
    spentAmount: 2150000,
    riskScore: 76,
    status: 'high',
    color: '#C85A32',
    triggerEn: 'Unverified Vendor Advance & Disputed Site',
    triggerHi: 'असत्यापित अग्रिम भुगतान और विवादित स्थल',
    cx: 125,
    cy: 245,
    nearWater: true,
  },
  {
    id: 'PRJ025',
    name: 'Panchayat Community Hall - Shivpur',
    code: 'PRJ025 • Community Hall Shivpur',
    blockEn: 'Shivpur Block',
    blockHi: 'शिवपुर ब्लॉक',
    sector: 'Community',
    sanctionedAmount: 2500000,
    spentAmount: 2400000,
    riskScore: 32,
    status: 'stable',
    color: '#059669',
    triggerEn: 'On Schedule · PWD Quality Grade A',
    triggerHi: 'समय पर प्रगति · पीडब्ल्यूडी ग्रेड ए गुणवत्ता',
    cx: 445,
    cy: 125,
    nearWater: false,
  },
  {
    id: 'PRJ028',
    name: 'Drainage Culvert - Rohaniya Bypass',
    code: 'PRJ028 • Drainage Bypass Rohaniya',
    blockEn: 'Rohaniya Block',
    blockHi: 'रोहनिया ब्लॉक',
    sector: 'Roadways',
    sanctionedAmount: 1800000,
    spentAmount: 2340000,
    riskScore: 64,
    status: 'moderate',
    color: '#D97706',
    triggerEn: 'Contractor Red Flag · Timeline Slippage',
    triggerHi: 'ठेकेदार रेड फ्लैग · समयसीमा में देरी',
    cx: 415,
    cy: 365,
    nearWater: false,
  },
  {
    id: 'PRJ034',
    name: 'Digital Anganwadi Center - Arajiline',
    code: 'PRJ034 • Digital Anganwadi Arajiline',
    blockEn: 'Arajiline Block',
    blockHi: 'आराजीलाइन ब्लॉक',
    sector: 'Education',
    sanctionedAmount: 900000,
    spentAmount: 880000,
    riskScore: 28,
    status: 'stable',
    color: '#059669',
    triggerEn: 'Hardware Deployed & Geo-tagged',
    triggerHi: 'उपकरण स्थापित और जियो-टैग्ड',
    cx: 165,
    cy: 315,
    nearWater: false,
  },
  {
    id: 'PRJ039',
    name: 'Kashi Smart Water Metering - Ward 4',
    code: 'PRJ039 • Smart Water Network Kashi',
    blockEn: 'Kashi Urban',
    blockHi: 'काशी नगर',
    sector: 'Waterworks',
    sanctionedAmount: 2800000,
    spentAmount: 3600000,
    riskScore: 68,
    status: 'moderate',
    color: '#D97706',
    triggerEn: 'Missing Sensor Telemetry Feed',
    triggerHi: 'सेंसर टेलीमेट्री फीड अनुपलब्ध',
    cx: 615,
    cy: 185,
    nearWater: true,
  },
  {
    id: 'PRJ047',
    name: 'Ring Road Phase 2 Connecting Link',
    code: 'PRJ047 • Ring Road Link Shivpur',
    blockEn: 'Shivpur Block',
    blockHi: 'शिवपुर ब्लॉक',
    sector: 'Roadways',
    sanctionedAmount: 5200000,
    spentAmount: 7900000,
    riskScore: 84,
    status: 'high',
    color: '#C85A32',
    triggerEn: 'Ghost Subcontractor Invoice Pattern',
    triggerHi: 'फर्जी उपठेकेदार बिलिंग विसंगति',
    cx: 295,
    cy: 75,
    nearWater: false,
  },
];

export default function SpatialCommandView({ focusedId, onPinClick }) {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const hi = lang === 'hi';

  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredPin, setHoveredPin] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);

  // Filter projects by chip selection
  const filteredProjects = useMemo(() => {
    return VARANASI_DISTRICT_PROJECTS.map(p => {
      let matches = true;
      if (activeFilter === 'high') {
        matches = p.status === 'high';
      } else if (activeFilter === 'water') {
        matches = p.nearWater || p.sector === 'Waterworks';
      } else if (activeFilter === 'road') {
        matches = p.sector === 'Roadways';
      }
      return { ...p, matches };
    });
  }, [activeFilter]);

  const activeCardPin = selectedPin || hoveredPin;

  const handlePinClick = (pin) => {
    setSelectedPin(pin);
    onPinClick?.(pin.id);
  };

  const openDossier = (pinId) => {
    navigate(`/official/risk/${pinId}`);
  };

  return (
    <div className="spatial-district-map-container">
      {/* ── Filter Chips Bar ── */}
      <div className="map-filter-chips">
        <button
          className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('all'); setSelectedPin(null); }}
        >
          {t('spatial_filter_all')}
        </button>
        <button
          className={`filter-chip ${activeFilter === 'high' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('high'); setSelectedPin(null); }}
        >
          <span className="chip-dot high" />
          {t('spatial_filter_high')}
        </button>
        <button
          className={`filter-chip ${activeFilter === 'water' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('water'); setSelectedPin(null); }}
        >
          <span className="chip-dot water" />
          {t('spatial_filter_water')}
        </button>
        <button
          className={`filter-chip ${activeFilter === 'road' ? 'active' : ''}`}
          onClick={() => { setActiveFilter('road'); setSelectedPin(null); }}
        >
          <span className="chip-dot road" />
          {t('spatial_filter_road')}
        </button>
      </div>

      {/* ── Main Geographic Map Canvas ── */}
      <div className="map-svg-viewport">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="district-svg"
          aria-label={hi ? 'वाराणसी जिला परियोजना स्थानिक मानचित्र' : 'Varanasi District Project Geographic Map'}
        >
          <defs>
            {/* Background texture */}
            <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="#332e29" opacity="0.4" />
            </pattern>
            {/* Ganges River Glow */}
            <filter id="river-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* District Baseplate */}
          <rect width={W} height={H} fill="#181513" rx="8" />
          <rect width={W} height={H} fill="url(#grid-dots)" rx="8" />

          {/* Block Polygons */}
          {DISTRICT_BLOCKS.map(block => (
            <g key={block.id} className="block-group">
              <path
                d={block.d}
                fill={block.fill}
                stroke={block.stroke}
                strokeWidth="1.2"
                className="block-poly"
              />
              <text
                x={block.labelX}
                y={block.labelY}
                fill="#78716c"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="block-label"
              >
                {hi ? block.nameHi : block.nameEn}
              </text>
            </g>
          ))}

          {/* Ganges River (गंगा नदी) */}
          <g className="river-group">
            {/* Outer Water Glow */}
            <path
              d="M 540,450 C 490,360 480,260 590,200 S 740,110 750,50"
              fill="none"
              stroke="#0e7490"
              strokeWidth="22"
              strokeLinecap="round"
              opacity="0.25"
            />
            {/* River Stream */}
            <path
              d="M 540,450 C 490,360 480,260 590,200 S 740,110 750,50"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.8"
              filter="url(#river-glow)"
            />
            {/* River Title */}
            <text
              x="625"
              y="160"
              fill="#22d3ee"
              fontSize="11"
              fontWeight="600"
              fontFamily="monospace"
              opacity="0.85"
            >
              ≈ {t('spatial_river_ganga')}
            </text>
          </g>

          {/* District Compass & Coordinates Tag */}
          <g opacity="0.6">
            <text x="24" y="32" fill="#a8a29e" fontSize="11" fontWeight="600" fontFamily="monospace">
              VARANASI DISTRICT (UP) · 25.3176° N, 82.9739° E
            </text>
          </g>

          {/* Color-Coded Project Pins */}
          {filteredProjects.map(p => {
            const isSelected = selectedPin?.id === p.id || focusedId === p.id;
            const isHovered = hoveredPin?.id === p.id;
            const isDimmed = !p.matches;

            return (
              <g
                key={p.id}
                className={`map-pin-group ${isDimmed ? 'dimmed' : ''}`}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                opacity={isDimmed ? 0.22 : 1}
                onMouseEnter={() => setHoveredPin(p)}
                onMouseLeave={() => setHoveredPin(null)}
                onClick={() => handlePinClick(p)}
                role="button"
                aria-label={`${p.id}: ${p.name}`}
              >
                {/* High Priority Pulsing Halo */}
                {p.status === 'high' && !isDimmed && (
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r={14}
                    fill="rgba(200, 90, 50, 0.28)"
                    className="pin-pulse-halo"
                  />
                )}

                {/* Selection Ring */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r={16}
                    fill="none"
                    stroke="#EDEBE6"
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Main Pin Circle */}
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={p.status === 'high' ? 8.5 : 7}
                  fill={p.color}
                  stroke="#1c1917"
                  strokeWidth="2"
                />

                {/* Center Core Dot */}
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={2.5}
                  fill="#ffffff"
                />

                {/* Micro Label for high priority or selected pins */}
                {(isSelected || isHovered || p.status === 'high') && !isDimmed && (
                  <text
                    x={p.cx}
                    y={p.cy - 12}
                    fill="#EDEBE6"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="pin-tag-text"
                  >
                    {p.id}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Floating Interactive Dossier Tooltip Card ── */}
        {activeCardPin && (
          <div
            className="floating-dossier-card"
            style={{
              left: `${Math.min(Math.max(activeCardPin.cx - 20, 20), W - 320)}px`,
              top: activeCardPin.cy > 230 ? `${activeCardPin.cy - 190}px` : `${activeCardPin.cy + 25}px`,
            }}
          >
            <div className="dossier-card-head">
              <div className="dossier-id-row">
                <span className={`status-indicator ${activeCardPin.status}`} />
                <strong>{activeCardPin.code}</strong>
              </div>
              <button
                className="close-dossier-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPin(null);
                  setHoveredPin(null);
                }}
                aria-label="Close card"
              >
                <X size={14} />
              </button>
            </div>

            <div className="dossier-title">{activeCardPin.name}</div>

            <div className="dossier-meta-row">
              <span className="dossier-block">
                <MapPin size={13} /> {hi ? activeCardPin.blockHi : activeCardPin.blockEn}
              </span>
              <span className="dossier-sector">{activeCardPin.sector}</span>
            </div>

            <div className="dossier-financials">
              <div>
                <small>{t('spatial_sanction')}</small>
                <b>₹{(activeCardPin.sanctionedAmount / 100000).toFixed(1)}L</b>
              </div>
              <div>
                <small>{t('spatial_spent')}</small>
                <b>₹{(activeCardPin.spentAmount / 100000).toFixed(1)}L</b>
              </div>
              <div>
                <small>Risk</small>
                <b className={activeCardPin.status}>{activeCardPin.riskScore}/100</b>
              </div>
            </div>

            <div className="dossier-trigger">
              <small>Trigger</small>
              <p>{hi ? activeCardPin.triggerHi : activeCardPin.triggerEn}</p>
            </div>

            <button
              className="dossier-open-btn"
              onClick={() => openDossier(activeCardPin.id)}
            >
              <span>{t('spatial_open_dossier')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Clear Visible Legend ── */}
      <div className="map-legend-bar">
        <div className="legend-item">
          <span className="legend-chip high" />
          <span>{t('spatial_legend_high')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-chip moderate" />
          <span>{t('spatial_legend_moderate')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-chip stable" />
          <span>{t('spatial_legend_stable')}</span>
        </div>
        <div className="legend-item river">
          <span className="river-line" />
          <span>{t('spatial_river_ganga')}</span>
        </div>
      </div>
    </div>
  );
}
