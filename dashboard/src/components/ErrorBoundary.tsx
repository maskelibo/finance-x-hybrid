import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1a1d27] border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 mb-2">Bir şeyler ters gitti</h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenileyerek tekrar deneyebilirsiniz.
            </p>
            {this.state.error && (
              <pre className="text-left text-[11px] text-red-300/60 bg-[#0f1117] border border-[#2d3148] rounded-lg p-3 mb-6 overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Sayfayı Yenile
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
