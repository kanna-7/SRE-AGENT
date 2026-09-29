import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerChaos } from '../lib/api';
import { useRealtime } from '../lib/realtime';

const SERVICES = [
  { value: 'payment-api', label: '💳 payment-api', desc: 'Payment processing gateway' },
  { value: 'auth-service', label: '🔐 auth-service', desc: 'JWT Authentication & tokens' },
  { value: 'orders-api', label: '📦 orders-api', desc: 'Order fulfillment service' },
];

const SCENARIOS = [
  { value: 'db_pool_exhaustion', label: '🗄️ DB Pool Exhaustion', desc: 'HikariCP pool saturated → DB queries timeout', sev: 'SEV-1' },
  { value: 'memory_leak', label: '📈 Memory Leak', desc: 'Heap memory leaks → OOM risk', sev: 'SEV-2' },
  { value: 'bad_deploy', label: '🚀 Bad Deployment', desc: 'Recent deploy broke critical validation path', sev: 'SEV-1' },
  { value: 'network_partition', label: '🌐 Network Partition', desc: 'ACL rule cuts inter-service connection', sev: 'SEV-2' },
];

const SEV_COLORS = { 'SEV-1': '#dc2626', 'SEV-2': '#ea580c', 'SEV-3': '#ca8a04' };

export default function ChaosButton() {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState('payment-api');
  const [scenario, setScenario] = useState('db_pool_exhaustion');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { demoMode } = useRealtime() || {};

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await triggerChaos(service, scenario);
      setOpen(false);
      navigate(`/incident/${result.incidentId}`);
    } catch (err) {
      alert('Error triggering drill: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        id="chaos-trigger-btn"
        onClick={() => setOpen(true)}
        className="btn-black text-xs py-2 px-5 shadow-sm"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        <span>Inject Chaos Anomaly ⚡</span>
        {demoMode && (
          <span className="ml-1 text-[9px] bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-full font-mono">DEMO</span>
        )}
      </button>

      {open && (
        <div className="modal-overlay animate-fade-in" onClick={() => !loading && setOpen(false)}>
          <div
            className="cw-card bg-white w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-fade-in border border-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-zinc-50 border-b border-zinc-200 p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">💥</span>
                  <h2 className="text-lg font-black text-black">Inject Chaos Anomaly</h2>
                </div>
                <p className="text-xs text-zinc-500">
                  Simulate a production outage to test AI diagnosis & vector memory recall.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 flex items-center justify-center font-black text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Service selection */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">Target Microservice</label>
                <div className="grid grid-cols-1 gap-2">
                  {SERVICES.map((s) => (
                    <label
                      key={s.value}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        service === s.value
                          ? 'border-black bg-zinc-50 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        value={s.value}
                        checked={service === s.value}
                        onChange={(e) => setService(e.target.value)}
                        className="hidden"
                      />
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${service === s.value ? 'border-black bg-black' : 'border-zinc-300'}`}>
                        {service === s.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <div>
                        <div className="text-xs font-mono font-extrabold text-black">{s.label}</div>
                        <div className="text-[11px] text-zinc-500">{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scenario selection */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">Failure Scenario</label>
                <div className="grid grid-cols-2 gap-2">
                  {SCENARIOS.map((s) => (
                    <label
                      key={s.value}
                      className={`flex flex-col gap-1 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        scenario === s.value
                          ? 'border-black bg-zinc-50 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scenario"
                        value={s.value}
                        checked={scenario === s.value}
                        onChange={(e) => setScenario(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-black">{s.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-extrabold" style={{ background: SEV_COLORS[s.sev] + '15', color: SEV_COLORS[s.sev] }}>{s.sev}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 leading-tight">{s.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="btn-outline flex-1 py-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  id="chaos-submit-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-black flex-1 py-3 text-xs disabled:opacity-60"
                >
                  {loading ? 'Launching Drill...' : '🚀 Trigger Instant Drill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
