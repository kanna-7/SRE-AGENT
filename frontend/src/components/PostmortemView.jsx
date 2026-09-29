import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { getPostmortem } from '../lib/api';

export default function PostmortemView({ incidentId }) {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const d = await getPostmortem(incidentId);
      setMarkdown(d.markdown || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">📄 Blameless AI Postmortem Report</div>
        <div className="flex gap-2">
          {markdown && (
            <button
              id="postmortem-copy-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {copied ? '✅ Copied!' : '📋 Copy Markdown'}
            </button>
          )}
          <button
            id="postmortem-generate-btn"
            onClick={handleGenerate}
            disabled={loading}
            className="btn-cyber-primary text-xs py-2 px-5"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Synthesizing Report...
              </>
            ) : '✨ Generate AI Postmortem'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-3 mb-4 bg-rose-950/40 border border-rose-900">
          <p className="text-xs font-semibold text-rose-300">{error}</p>
        </div>
      )}

      {markdown ? (
        <div className="rounded-xl p-6 overflow-auto max-h-[600px] bg-[#030712] border border-slate-800 text-slate-200">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-base font-extrabold text-white mt-6 mb-3 pb-2 first:mt-0 border-b border-slate-800">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-bold mt-4 mb-2 text-emerald-400">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-xs sm:text-sm leading-relaxed mb-3 text-slate-300">{children}</p>
              ),
              ul: ({ children }) => <ul className="space-y-1.5 mb-3 ml-3">{children}</ul>,
              li: ({ children }) => (
                <li className="flex gap-2 text-xs sm:text-sm text-slate-300">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{children}</span>
                </li>
              ),
              code: ({ children }) => (
                <code className="mono text-xs px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800">{children}</code>
              ),
              strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
              blockquote: ({ children }) => (
                <blockquote className="pl-3 italic text-xs sm:text-sm border-l-2 border-emerald-500 text-slate-400">{children}</blockquote>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      ) : !loading && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm font-bold text-white mb-1">Synthesize Blameless AI Postmortem Report</p>
          <p className="text-xs text-slate-400">Includes anomaly root cause, blast radius impact, vector memory match history, and action items.</p>
        </div>
      )}
    </div>
  );
}
