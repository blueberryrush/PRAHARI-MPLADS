import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const chartColors = {
  primary: '#0066FF',
  primaryLight: 'rgba(0, 102, 255, 0.1)',
  violet: '#6C5CE7',
  violetLight: 'rgba(108, 92, 231, 0.1)',
  emerald: '#00B894',
  emeraldLight: 'rgba(0, 184, 148, 0.1)',
  coral: '#FF6B6B',
  coralLight: 'rgba(255, 107, 107, 0.1)',
  amber: '#FDCB6E',
  amberLight: 'rgba(253, 203, 110, 0.2)',
  sky: '#74B9FF',
  pink: '#FD79A8',
  palette: ['#0066FF', '#6C5CE7', '#00B894', '#FF6B6B', '#FDCB6E', '#74B9FF', '#FD79A8', '#00CEC9', '#E17055', '#A29BFE'],
  paletteBg: [
    'rgba(0,102,255,0.7)', 'rgba(108,92,231,0.7)', 'rgba(0,184,148,0.7)',
    'rgba(255,107,107,0.7)', 'rgba(253,203,110,0.7)', 'rgba(116,185,255,0.7)',
    'rgba(253,121,168,0.7)', 'rgba(0,206,201,0.7)', 'rgba(225,112,85,0.7)', 'rgba(162,155,254,0.7)',
  ],
};

function useChart(config) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    chartRef.current = new Chart(ctx, config);
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [JSON.stringify(config)]);

  return canvasRef;
}

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 } },
    tooltip: { backgroundColor: '#1A1A2E', titleFont: { family: 'Outfit', size: 14, weight: '700' }, bodyFont: { family: 'Inter', size: 12 }, padding: 12, cornerRadius: 8, displayColors: true },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#A0AEC0' } },
    y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#A0AEC0' } },
  },
};

export function BarChart({ labels, datasets, title, stacked = false }) {
  const canvasRef = useChart({
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || chartColors.paletteBg[i],
        borderColor: ds.borderColor || chartColors.palette[i],
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      })),
    },
    options: {
      ...defaultOptions,
      scales: {
        ...defaultOptions.scales,
        x: { ...defaultOptions.scales.x, stacked },
        y: { ...defaultOptions.scales.y, stacked },
      },
    },
  });
  return (
    <div className="chart-card">
      {title && <div className="chart-header"><h3 className="chart-title">{title}</h3></div>}
      <div className="chart-canvas"><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}

export function LineChart({ labels, datasets, title }) {
  const canvasRef = useChart({
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        ...ds,
        borderColor: ds.borderColor || chartColors.palette[i],
        backgroundColor: ds.backgroundColor || chartColors.palette[i] + '15',
        borderWidth: 2.5,
        tension: 0.4,
        fill: ds.fill !== undefined ? ds.fill : true,
        pointRadius: ds.pointRadius !== undefined ? ds.pointRadius : 3,
        pointBackgroundColor: ds.borderColor || chartColors.palette[i],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      })),
    },
    options: defaultOptions,
  });
  return (
    <div className="chart-card">
      {title && <div className="chart-header"><h3 className="chart-title">{title}</h3></div>}
      <div className="chart-canvas"><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}

export function DoughnutChart({ labels, data, title, colors }) {
  const canvasRef = useChart({
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors || chartColors.paletteBg, borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        ...defaultOptions.plugins,
        legend: { position: 'bottom', labels: { ...defaultOptions.plugins.legend.labels, padding: 12 } },
      },
    },
  });
  return (
    <div className="chart-card">
      {title && <div className="chart-header"><h3 className="chart-title">{title}</h3></div>}
      <div className="chart-canvas"><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}

export function RadarChart({ labels, datasets, title }) {
  const canvasRef = useChart({
    type: 'radar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        ...ds,
        borderColor: ds.borderColor || chartColors.palette[i],
        backgroundColor: (ds.borderColor || chartColors.palette[i]) + '20',
        borderWidth: 2,
        pointBackgroundColor: ds.borderColor || chartColors.palette[i],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: defaultOptions.plugins,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { display: false },
          pointLabels: { font: { family: 'Inter', size: 11 }, color: '#636E82' },
        },
      },
    },
  });
  return (
    <div className="chart-card">
      {title && <div className="chart-header"><h3 className="chart-title">{title}</h3></div>}
      <div className="chart-canvas"><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}

export function ScatterChart({ datasets, title, xLabel, yLabel }) {
  const canvasRef = useChart({
    type: 'scatter',
    data: {
      datasets: datasets.map((ds, i) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || chartColors.paletteBg[i],
        borderColor: ds.borderColor || chartColors.palette[i],
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 9,
      })),
    },
    options: {
      ...defaultOptions,
      scales: {
        x: { ...defaultOptions.scales.x, title: { display: !!xLabel, text: xLabel, font: { family: 'Inter', size: 12, weight: '600' } } },
        y: { ...defaultOptions.scales.y, title: { display: !!yLabel, text: yLabel, font: { family: 'Inter', size: 12, weight: '600' } } },
      },
    },
  });
  return (
    <div className="chart-card">
      {title && <div className="chart-header"><h3 className="chart-title">{title}</h3></div>}
      <div className="chart-canvas"><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}

export { chartColors };
