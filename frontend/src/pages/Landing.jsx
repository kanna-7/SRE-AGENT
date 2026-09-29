import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRealtime } from '../lib/realtime';
import ChaosButton from '../components/ChaosButton';

export default function Landing() {
  const navigate = useNavigate();
  const { incidents = [], connected } = useRealtime() || {};
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How does Hindsight persistent memory work?",
      a: "When an incident is resolved, the root cause, telemetry, log patterns, and executed fix are embedded into a vector database. Next time a similar anomaly occurs, vector similarity search instantly retrieves past proven fixes and boosts confidence by +10%."
    },
    {
      q: "What makes the AI SRE Agent different from generic LLM tools?",
      a: "Unlike generic stateless chatbots that forget everything after every conversation, our agent uses Hindsight persistent memory. First incident takes 4 minutes; same incident repeat takes 8 seconds."
    },
    {
      q: "Can the agent execute fixes automatically?",
      a: "Yes! When AI confidence crosses the high-confidence threshold (>= 75%), playbooks can auto-execute. For lower confidence scores, the system supports Human-In-The-Loop (HITL) approval with a 1-click approval workflow."
    },
    {
      q: "How long does it take to integrate?",
      a: "The agent connects to Prometheus, Kubernetes deploy events, Datadog/CloudWatch logs, and Supabase instantly out of the box."
    }
  ];

  return (
    <div className="bg-[#f8f9fa] text-[#0a0a0a] min-h-screen">
      
      {/* ─── Hero Section (Inspired by reference image hero) ──────────────── */}
      <section className="pt-10 pb-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="pill-tag">
                Welcome to AI SRE Agent
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 leading-[1.12]">
              WE HEAL OUTAGES & <br />
              <span className="text-black underline decoration-zinc-300 underline-offset-8">AUTOMATE RELIABILITY</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 max-w-xl leading-relaxed">
              Elevate your infrastructure with persistent vector memory. From live anomaly triage to AI diagnosis, we bring past incident memory to life with tailored automation.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/console"
                className="btn-black group"
              >
                <span>Launch Ops Console ↗</span>
              </Link>

              <ChaosButton />
            </div>

            {/* Micro proof counter */}
            <div className="flex items-center gap-4 pt-6">
              <div className="flex -space-x-2">
                <span className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs border-2 border-white">💳</span>
                <span className="w-9 h-9 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-xs border-2 border-white">🔐</span>
                <span className="w-9 h-9 rounded-full bg-zinc-700 text-white flex items-center justify-center font-bold text-xs border-2 border-white">📦</span>
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-black">250+ Incident Memories Indexed</p>
                <p className="text-zinc-500">Autonomous SRE Engine Active</p>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card (Reference Layout style) */}
          <div className="lg:col-span-5 relative animate-float">
            <div className="cw-card-dark p-8 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="pill-tag-dark hover:scale-105 transition-transform">Hindsight Active</span>
                <span className="text-xs font-mono font-bold text-emerald-400 live-dot">99.99% UPTIME</span>
              </div>

              <div className="space-y-4 my-8">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all">
                  <p className="text-xs font-bold text-zinc-400 mb-1">First Incident Resolution</p>
                  <p className="text-2xl font-black text-white mono">4 Minutes</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 transition-all">
                  <p className="text-xs font-bold text-emerald-400 mb-1">Same Incident Repeat (With Memory)</p>
                  <p className="text-3xl font-black text-emerald-400 mono">⚡ 8 Seconds</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>Solutions for Zero Downtime</span>
                <Link to="/console" className="font-bold text-white hover:text-emerald-400 transition-colors">View Live Console &rarr;</Link>
              </div>
            </div>
          </div>

        </div>

        {/* Brand Integration Bar */}
        <div className="mt-16 pt-8 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-6 opacity-70 grayscale hover:grayscale-0 transition-all text-xs font-mono font-bold text-zinc-500">
          <span>+ PAYMENT-API</span>
          <span>+ AUTH-SERVICE</span>
          <span>+ ORDERS-API</span>
          <span>+ HINDSIGHT MEMORY</span>
          <span>+ OPENAI GPT-4O</span>
        </div>
      </section>

      {/* ─── Section 2: About / Memory Partner (Reference Style) ─────────────── */}
      <section id="about" className="py-20 max-w-7xl mx-auto px-6">
        <div>
          <span className="pill-tag mb-4">About Hindsight</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-4">
            Meet Hindsight Memory: Your Reliability Partner
          </h2>
          <p className="text-zinc-600 max-w-2xl text-sm leading-relaxed mb-10">
            We're not just AI chatbots; we are an agentic memory engine. At Hindsight, we live and breathe production reliability, from capturing initial alerts to seamless vector memory recall.
          </p>
        </div>

        {/* Black Callout Box with Pills (from reference image) */}
        <div className="cw-card-dark p-10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <span className="text-5xl font-black text-white mono">40%</span>
              <p className="text-lg font-bold text-zinc-200">Faster MTTR Incident Recovery</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Vector embeddings continuously index root causes, diagnostic logs, and verified playbooks.
              </p>

              {/* Floating Pill Tags (from image) */}
              <div className="flex flex-wrap gap-2 pt-4">
                {['Alert Triage', 'Telemetry Analysis', 'Memory Recall', 'Auto-Heal', 'Postmortem'].map((tag) => (
                  <span key={tag} className="pill-tag-dark text-[11px]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 border-l border-zinc-800 lg:pl-10 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <p className="text-xs font-bold text-emerald-400 mb-1">🤖 Autonomous Pipeline</p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  When a production failure occurs, the AI agent triages the severity, pulls live telemetry metrics, checks vector memory, and auto-executes or requests 1-click human approval.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <p className="text-xs font-bold text-cyan-400 mb-1">📄 Blameless Postmortems</p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Synthesizes structured Markdown postmortem reports complete with root cause timelines, affected user metrics, and action items.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Section 3: Process Workflow (Note-Cards connected with dashed lines from image) */}
      <section id="process" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="pill-tag mb-3">How we work</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black">
            Let us show you how we drive reliability to new heights
          </h2>
        </div>

        {/* 4 Tilted Cards Grid (Directly adapted from reference image layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="process-card rotate-[-2deg]">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs mb-4">
              01
            </div>
            <h3 className="text-lg font-extrabold text-black mb-2">Triage & Classify</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              GPT-4o-mini triages incoming alerts, categorizes severity (SEV-1 to SEV-4), and measures affected blast radius.
            </p>
          </div>

          {/* Step 2 */}
          <div className="process-card rotate-[2deg]">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs mb-4">
              02
            </div>
            <h3 className="text-lg font-extrabold text-black mb-2">Gather Telemetry</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Fetches live metrics (p99 latency, error rates, DB pool usage) and correlates recent deployment events.
            </p>
          </div>

          {/* Step 3 */}
          <div className="process-card rotate-[-1deg]">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs mb-4">
              03
            </div>
            <h3 className="text-lg font-extrabold text-black mb-2">Memory Match</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cross-references vector embeddings with Hindsight memory, boosting AI confidence score by +10%.
            </p>
          </div>

          {/* Step 4 */}
          <div className="process-card rotate-[2deg]">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs mb-4">
              04
            </div>
            <h3 className="text-lg font-extrabold text-black mb-2">Auto-Heal & Report</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Executes playbook remediation, verifies recovery health, and generates a blameless Markdown postmortem.
            </p>
          </div>

        </div>

        {/* Hand-written style subtitle from image */}
        <div className="text-center mt-12">
          <span className="font-mono text-xs font-bold text-zinc-400 italic">
            ~ Ready to be delivered! ~
          </span>
        </div>
      </section>

      {/* ─── Section 4: Dark Grid Section (Reference image bottom section) ─── */}
      <section className="bg-[#0a0a0a] text-white py-20 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <span className="pill-tag-dark mb-3">What we do</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              We design meaningful reliability not just quick restarts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Persistent Memory Vector Store",
                desc: "Every incident solution is stored permanently to eliminate duplicate outages."
              },
              {
                title: "Human-In-The-Loop Safety",
                desc: "High-confidence fixes auto-execute; lower confidence items require 1-click human approval."
              },
              {
                title: "Blameless Postmortems",
                desc: "Auto-generates executive Markdown postmortems with root causes and action items."
              }
            ].map((card, i) => (
              <div key={i} className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <h3 className="text-lg font-extrabold text-white mb-2">{card.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-16 p-10 rounded-3xl bg-white text-black flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <h3 className="text-2xl font-black mb-1">Let's start healing your production outages</h3>
              <p className="text-xs text-zinc-600">Simulate chaos scenarios in our sandbox and test memory recall.</p>
            </div>
            <Link to="/console" className="btn-black text-xs py-3.5 px-8 flex-shrink-0">
              Launch Console Now ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 5: FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="pill-tag mb-3">FAQ</span>
          <h2 className="text-3xl font-extrabold text-black">Here's what people ask about our work</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="cw-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between text-sm font-bold text-black hover:text-zinc-600 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="font-bold ml-4">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-xs text-zinc-600 border-t border-zinc-100 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
