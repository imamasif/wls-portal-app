import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              border: '1px solid #334155',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
              Application Error
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              We encountered an unexpected issue while loading the application.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>

              <button
                onClick={this.handleHardReset}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Clear Cache & Restart
              </button>
            </div>

            {this.state.error && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                  Technical Details
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#0f172a',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#f87171',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
