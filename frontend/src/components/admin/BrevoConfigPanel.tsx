import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Send, ShieldCheck, Key, Server } from 'lucide-react';
import { adminApi } from '../../services/api';

export const BrevoConfigPanel: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBrevoStatus();
      if (res.success && res.data) {
        setStatusData(res.data);
        setSenderEmail(res.data.senderEmail || '');
        setSenderName(res.data.senderName || '');
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setFeedbackMsg(null);
    try {
      const res = await adminApi.testBrevoConnection();
      if (res.success && res.data) {
        setTestResult(res.data);
        if (res.data.success) {
          setFeedbackMsg({ type: 'success', text: `Connection handshake successful! Latency: ${res.data.latencyMs}ms` });
        } else {
          setFeedbackMsg({ type: 'error', text: res.data.error || 'Brevo API handshake failed.' });
        }
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Connection test failed.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Network error during connection test.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const res = await adminApi.updateBrevoConfig({ senderEmail, senderName });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Brevo sender configuration updated successfully!' });
        fetchStatus();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to update Brevo configuration.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error updating configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Loading Brevo Email Telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0D111A] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Brevo Transactional Email Service</h2>
            <p className="text-xs text-slate-400">
              Manage sender identities, email templates & verify real REST API connectivity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <CheckCircle2 className="h-4 w-4" /> Status: {statusData?.connectionStatus || 'Connected'}
          </span>
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-950/40 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Handshake...' : 'Test Brevo Connection'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Message Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 font-sans animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Live Handshake Result Box */}
      {testResult && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Server className="h-4 w-4" /> Live Brevo Handshake Telemetry
            </span>
            <span className="text-slate-400">{new Date().toLocaleTimeString()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500">API Status: </span>
              <strong className={testResult.success ? 'text-emerald-400' : 'text-rose-400'}>
                {testResult.status}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Account Email: </span>
              <strong className="text-white">{testResult.accountEmail || statusData?.senderEmail}</strong>
            </div>
            <div>
              <span className="text-slate-500">Response Latency: </span>
              <strong className="text-cyan-400">{testResult.latencyMs} ms</strong>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Current Configuration Readout */}
        <div className="p-6 rounded-2xl bg-[#0D111A] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" /> Active Security Configuration
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-mono">API Key Status:</span>
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1">
                <Key className="h-3 w-3" /> {statusData?.apiKeyMasked || '••••••••••••'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-mono">Email Provider:</span>
              <span className="font-bold text-white">{statusData?.provider || 'Brevo SMTP / REST API v3'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-mono">Transactional Template:</span>
              <span className="font-bold text-slate-300">{statusData?.templateStyle}</span>
            </div>
          </div>
        </div>

        {/* Update Sender Configuration Form */}
        <div className="p-6 rounded-2xl bg-[#0D111A] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="h-4 w-4 text-cyan-400" /> Update Sender Identity
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase tracking-wider">Sender Name</label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="PointX Esports Studio"
                className="w-full bg-[#131825] border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase tracking-wider">Sender Email</label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="support@pointx.gg"
                className="w-full bg-[#131825] border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Sender Configuration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
