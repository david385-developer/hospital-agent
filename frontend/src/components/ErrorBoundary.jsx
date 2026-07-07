import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-red-400 mb-4">⚠️ Application Error</h1>
            <p className="text-red-300 mb-4 text-lg font-semibold">
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <details className="mb-6 bg-red-500/5 border border-red-500/30 rounded-lg p-4">
                <summary className="cursor-pointer text-red-400 font-semibold mb-2">
                  Stack Trace
                </summary>
                <pre className="text-red-300 text-xs overflow-auto max-h-96 bg-black/30 p-3 rounded whitespace-pre-wrap break-words">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
