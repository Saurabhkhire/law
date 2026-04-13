import React, { useState } from 'react';
import { useUser } from '../App';
import { createUser } from '../api/client';
import axios from 'axios';

const PERSONAS = [
  {
    id: 'company',
    label: 'Company / Employer',
    description: 'HR, VP Eng, CEO, or Legal Counsel hiring international talent — sponsorship, compliance, and roster tracking',
    icon: '🏢'
  },
  {
    id: 'founder',
    label: 'Startup Founder',
    description: 'Building a company from scratch, need visa to run it',
    icon: '🚀'
  },
  {
    id: 'cofounder',
    label: 'Co-Founder',
    description: 'Shared equity, need visa that works with your ownership stake',
    icon: '🤝'
  },
  {
    id: 'employee',
    label: 'Employee',
    description: 'Getting sponsored by a company for work visa',
    icon: '💼'
  },
  {
    id: 'preincorporation',
    label: 'Pre-Incorporation',
    description: 'Exploring startup idea, need legal advice before filing anything',
    icon: '💡'
  },
  {
    id: 'traveler',
    label: 'Traveler / Visitor',
    description: 'Planning international travel, need risk assessment',
    icon: '✈️'
  }
];

const VISA_OPTIONS = [
  'H-1B', 'O-1A', 'L-1A', 'TN', 'E-2', 'EB-2 NIW', 'EB-1A',
  'F-1 OPT', 'F-1 STEM OPT', 'J-1', 'B-1/B-2', 'DACA',
  'Green Card (pending)', 'US Citizen', 'None / Other'
];

const STAGES = ['idea', 'incorporated', 'seed', 'series_a', 'series_b', 'public'];

const DEMO_USERS = [
  { id: 1, name: 'Sarah Johnson',  persona: 'company',         flag: '🏢', label: 'Company / Employer',   sub: 'TechScale Inc — hiring international talent' },
  { id: 2, name: 'Arjun Sharma',   persona: 'founder',         flag: '🚀', label: 'Startup Founder',       sub: 'O-1A path · NeuralFlow AI Series A' },
  { id: 3, name: 'Sofia Mendes',   persona: 'cofounder',       flag: '🤝', label: 'Co-Founder',            sub: '30% equity · HealthBridge · E-2 / O-1A' },
  { id: 4, name: 'Wei Zhang',      persona: 'employee',        flag: '💼', label: 'Employee',              sub: 'H-1B sponsored · CloudVentures' },
  { id: 5, name: 'Amara Okafor',   persona: 'preincorporation',flag: '💡', label: 'Pre-Incorporation',      sub: 'Ideation stage · fintech · no entity yet' },
  { id: 6, name: 'Lucas Weber',    persona: 'traveler',        flag: '✈️', label: 'Traveler / Visitor',    sub: 'H-1B · complex travel history' },
];

export default function Onboarding() {
  const { login } = useUser();
  const [step, setStep] = useState(1);
  const [demoLoading, setDemoLoading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', persona_type: '',
    citizenship: '', current_visa_type: '', visa_status: 'valid',
    visa_expiry: '', i94_expiry: '',
    company_name: '', company_stage: '', company_role: '',
    equity_percent: '', salary_usd: '', location_state: '',
    pending_applications: []
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const togglePendingApp = (app) => {
    set('pending_applications',
      form.pending_applications.includes(app)
        ? form.pending_applications.filter(a => a !== app)
        : [...form.pending_applications, app]
    );
  };

  const loginAsDemo = async (persona) => {
    setDemoLoading(persona);
    try {
      const { data: users } = await axios.get('/api/users');
      const user = users.find(u => u.persona_type === persona);
      if (!user) throw new Error('not found');
      login(user);
    } catch (e) {
      alert('Could not load demo user. Make sure the backend is running and seeded (npm run db:seed).');
    } finally {
      setDemoLoading(null);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await createUser(form);
      login(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-xl">IA</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ImmigAI</h1>
          <p className="text-gray-500 mt-1">Your AI-powered immigration co-pilot</p>
        </div>

        <div className="card">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-brand-600' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* Step 1: Who are you? */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-1">Who are you?</h2>
              <p className="text-gray-500 text-sm mb-6">Select the role that best describes you</p>
              <div className="grid grid-cols-1 gap-3">
                {PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => set('persona_type', p.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                      ${form.persona_type === p.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <div className="font-semibold">{p.label}</div>
                      <div className="text-sm text-gray-500">{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                className="btn-primary w-full mt-6"
                disabled={!form.persona_type}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Basic info */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-1">Your profile</h2>
              <p className="text-gray-500 text-sm mb-6">Basic information about you and your visa status</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country of Citizenship *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.citizenship} onChange={e => set('citizenship', e.target.value)} placeholder="e.g. India, Nigeria, Brazil" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Visa / Status</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.current_visa_type} onChange={e => set('current_visa_type', e.target.value)}>
                    <option value="">Select...</option>
                    {VISA_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visa Expiry</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.visa_expiry} onChange={e => set('visa_expiry', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">I-94 Expiry</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.i94_expiry} onChange={e => set('i94_expiry', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pending Applications (check all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {['I-485', 'I-140', 'EAD', 'AP', 'I-539', 'I-765', 'H-1B Extension'].map(app => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => togglePendingApp(app)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                          ${form.pending_applications.includes(app)
                            ? 'bg-brand-100 border-brand-400 text-brand-700'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary flex-1" disabled={!form.name || !form.citizenship} onClick={() => setStep(3)}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Company info */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-1">
                {form.persona_type === 'company'
                  ? 'Your company details'
                  : ['founder', 'cofounder', 'preincorporation'].includes(form.persona_type)
                  ? 'Your company'
                  : form.persona_type === 'employee' ? 'Your employer' : 'Optional company details'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">Helps us find the right visa pathway for your situation</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Acme Inc." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Role / Title</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.company_role} onChange={e => set('company_role', e.target.value)} placeholder="CEO, CTO, Engineer..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Stage</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.company_stage} onChange={e => set('company_stage', e.target.value)}>
                      <option value="">Select...</option>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {['founder', 'cofounder'].includes(form.persona_type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Equity % (affects visa options)</label>
                    <input type="number" min="0" max="100"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.equity_percent} onChange={e => set('equity_percent', e.target.value)} placeholder="e.g. 40" />
                    {form.equity_percent > 50 && (
                      <p className="text-xs text-orange-600 mt-1">⚠ Owning &gt;50% affects H-1B eligibility — we'll flag this in your analysis</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Salary (USD)</label>
                  <input type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.salary_usd} onChange={e => set('salary_usd', e.target.value)} placeholder="e.g. 150000" />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary flex-1" onClick={submit} disabled={loading}>
                  {loading ? 'Setting up...' : 'Get Started →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Demo quick-login */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">or jump in with demo data</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map(u => (
              <button
                key={u.persona}
                onClick={() => loginAsDemo(u.persona)}
                disabled={demoLoading !== null}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-brand-400 hover:bg-brand-50 text-left transition-all disabled:opacity-50"
              >
                <span className="text-xl mt-0.5">{u.flag}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    {demoLoading === u.persona ? <span className="text-brand-600">Loading…</span> : u.name}
                  </div>
                  <div className="text-xs text-brand-600 font-medium">{u.label}</div>
                  <div className="text-xs text-gray-400 truncate">{u.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ImmigAI is not a law firm. All outputs require attorney review before use.
        </p>
      </div>
    </div>
  );
}
