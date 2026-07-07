// TEST VERSION - Simplified App to verify React rendering works
import { useState } from 'react'

export default function AppTest() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="text-6xl mb-4">🏥</div>
        <h1 className="text-5xl font-bold mb-4">MedOps AI</h1>
        <p className="text-xl text-slate-300 mb-8">
          If you can see this message, React is working correctly!
        </p>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <p className="text-slate-400 mb-4">
            This is a minimal test to verify the React rendering pipeline.
          </p>
          <p className="text-slate-300 font-mono text-sm mb-4">
            Current time: {new Date().toLocaleTimeString()}
          </p>
          <p className="text-blue-400 font-mono text-sm mb-4">
            Counter: {count}
          </p>
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
          >
            Click Me
          </button>
        </div>
        <p className="text-slate-400 text-sm">
          If this page works but the main app doesn't, the issue is in the routing or auth setup.
        </p>
      </div>
    </div>
  )
}
