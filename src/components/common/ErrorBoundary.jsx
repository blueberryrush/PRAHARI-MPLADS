import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('PRAHARI ErrorBoundary caught component rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="map-error-boundary panel"
          style={{
            padding: '24px 20px',
            textAlign: 'center',
            borderRadius: 12,
            border: '1px solid #fed7aa',
            background: 'var(--surface, #fffbf5)',
            color: 'var(--ink, #1c1917)',
            margin: '12px 0',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#ffedd5',
              color: '#c2410c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#9a3412' }}>
            {this.props.fallbackTitle || 'Map Rendering Fallback'}
          </h4>
          <p style={{ margin: '0 auto 16px', fontSize: 11, color: 'var(--muted, #78716c)', maxWidth: 460, lineHeight: 1.45 }}>
            {this.props.fallbackMessage ||
              'A temporary geographic boundary rendering issue occurred. Your project data is safe and accessible below.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="primary-action"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#314D3F',
              fontSize: 11,
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} /> Reload Map View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
