import React, { useState, useEffect } from 'react';
import { useUser } from '../App';
import {
  analyzeHire, getRoster, addToRoster,
  getComplianceReport, generateSponsorDoc, getHiringHistory
} from '../api/client';
import {
  Users, UserPlus, ShieldCheck, FileText,
  AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Download
} from 'lucide-react';

const TABS = ['hiring', 'roster', 'compliance', 'documents'];
const TAB_LABELS = {
  hiring: '🔍 Hiring Intelligence',
  roster: '👥 Employee Roster',
  compliance: '✅ Compliance Report',
  documents: '📄 Sponsorship Docs'
};

const RISK_BADGE = {
  LOW:      'badge-low',
  MEDIUM:   'badge-medium',
  HIGH:     'badge-high',
  CRITICAL: 'badge-critical'
};

const JOB_CATEGORIES = [
  'Software Engineer', 'Data Scientist / ML Engineer', 'Product Manager',
  'UX / Design', 'DevOps / Infrastructure', 'Finance / Accounting',
  'Legal / Compliance', 'Sales / Business Development', 'Research Scientist',
  'Marketing', 'Operations', 'Executive / C-Suite'
];

const SPONSORSHIP_DOCS = [
  { type: 'sponsorship_intent',   label: 'H-1B Sponsorship Intent Letter',     desc: 'Company commitment to sponsor the hire' },
  { type: 'offer_letter',         label: 'Offer Letter with Visa Sponsorship',  desc: 'Formal offer including visa terms' },
  { type: 'critical_role_declaration', label: 'Critical Role Declaration',      desc: 'Expert letter for O-1A/EB-1A petition support' },
  { type: 'employment_verification',   label: 'Employment Verification Letter', desc: 'For airport / CBP / embassy use' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function CompanyHub() {
  const { user } = useUser();
  const [tab, setTab]               = useState('hiring');
  const [loading, setLoading]       = useState('');
  const [error, setError]           = useState('');

  // Hiring
  const [hireForm, setHireForm]     = useState({
    candidateName: '', candidateCountry: '', jobTitle: '',
    salary: '', jobCategory: '', yearsExperience: '',
    hasExtraordinaryAbility: false, foreignCompanyRelationship: false
  });
  const [hireResult, setHireResult] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);

  // Roster
  const [roster, setRoster]         = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmp, setNewEmp]         = useState({
    employeeName: '', citizenship: '', jobTitle: '',
    visaType: '', visaExpiry: '', salary: '', i9Status: 'complete', lcaStatus: 'valid'
  });

  // Compliance
  const [compReport, setCompReport] = useState(null);

  // Docs
  const [selectedDocType, setSelectedDocType] = useState('');
  const [empForDoc, setEmpForDoc]   = useState({ name: '', jobTitle: '', salary: '', startDate: '', citizenship: '', visaType: '' });
  const [generatedDoc, setGeneratedDoc] = useState(null);

  useEffect(() => {
    getRoster(user.id).then(r => setRoster(r.data)).catch(() => {});
  }, [user.id]);

  const setH = (k, v) => setHireForm(f => ({ ...f, [k]: v }));
  const setE = (k, v) => setNewEmp(f => ({ ...f, [k]: v }));

  // ── Hiring analysis ─────────────────────────────────────────────────────────
  const runHireAnalysis = async () => {
    setLoading('hire'); setError('');
    try {
      const { data } = await analyzeHire(user.id, {
        ...hireForm,
        salary: parseInt(hireForm.salary) || 0,
        yearsExperience: parseInt(hireForm.yearsExperience) || 0
      });
      setHireResult(data.analysis);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed');
    } finally { setLoading(''); }
  };

  // ── Add employee ────────────────────────────────────────────────────────────
  const addEmployee = async () => {
    setLoading('add'); setError('');
    try {
      await addToRoster(user.id, newEmp);
      const { data } = await getRoster(user.id);
      setRoster(data);
      setShowAddForm(false);
      setNewEmp({ employeeName: '', citizenship: '', jobTitle: '', visaType: '', visaExpiry: '', salary: '', i9Status: 'complete', lcaStatus: 'valid' });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add employee');
    } finally { setLoading(''); }
  };

  // ── Compliance report ───────────────────────────────────────────────────────
  const runCompliance = async () => {
    setLoading('compliance'); setError('');
    try {
      const { data } = await getComplianceReport(user.id);
      setCompReport(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Report failed');
    } finally { setLoading(''); }
  };

  // ── Sponsorship doc ─────────────────────────────────────────────────────────
  const genDoc = async () => {
    if (!selectedDocType) return;
    setLoading('doc'); setError('');
    try {
      const { data } = await generateSponsorDoc(user.id, selectedDocType, empForDoc);
      setGeneratedDoc(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Doc generation failed');
    } finally { setLoading(''); }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const expiryBadge = (days) => {
    if (days === null) return null;
    if (days < 0)   return <span className="badge-critical ml-2">Expired</span>;
    if (days < 30)  return <span className="badge-critical ml-2">{days}d left</span>;
    if (days < 90)  return <span className="badge-high ml-2">{days}d left</span>;
    if (days < 180) return <span className="badge-medium ml-2">{days}d left</span>;
    return <span className="badge-low ml-2">{days}d left</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Company Hub</h1>
        <p className="text-gray-500 mt-1">{user.company_name || 'Your company'} — immigration management for your team</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── HIRING INTELLIGENCE ─────────────────────────────────────────────── */}
      {tab === 'hiring' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-bold text-lg mb-1">Analyze a Prospective Hire</h2>
            <p className="text-sm text-gray-500 mb-5">Enter the candidate's details — we'll find the best visa pathway, your sponsorship obligations, timeline, and cost.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={hireForm.candidateName} onChange={e => setH('candidateName', e.target.value)} placeholder="e.g. Priya Patel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Citizenship *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={hireForm.candidateCountry} onChange={e => setH('candidateCountry', e.target.value)} placeholder="e.g. India, Canada, Germany" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={hireForm.jobTitle} onChange={e => setH('jobTitle', e.target.value)} placeholder="e.g. Senior ML Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Category *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={hireForm.jobCategory} onChange={e => setH('jobCategory', e.target.value)}>
                  <option value="">Select...</option>
                  {JOB_CATEGORIES.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offered Salary (USD/year)</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={hireForm.salary} onChange={e => setH('salary', e.target.value)} placeholder="e.g. 160000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={hireForm.yearsExperience} onChange={e => setH('yearsExperience', e.target.value)} placeholder="e.g. 7" />
              </div>
            </div>

            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded"
                  checked={hireForm.hasExtraordinaryAbility}
                  onChange={e => setH('hasExtraordinaryAbility', e.target.checked)} />
                Candidate has extraordinary ability (awards, publications, press coverage)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded"
                  checked={hireForm.foreignCompanyRelationship}
                  onChange={e => setH('foreignCompanyRelationship', e.target.checked)} />
                Candidate worked at our foreign affiliate / parent company
              </label>
            </div>

            <button className="btn-primary mt-5"
              onClick={runHireAnalysis}
              disabled={loading === 'hire' || !hireForm.candidateCountry || !hireForm.jobTitle}>
              {loading === 'hire' ? 'Analyzing...' : 'Analyze This Hire →'}
            </button>
          </div>

          {loading === 'hire' && (
            <div className="card text-center py-10">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Analyzing visa options and employer obligations...</p>
            </div>
          )}

          {hireResult && !loading && (
            <div className="space-y-4">
              {/* Recommended visa */}
              <div className="card border-l-4 border-l-brand-500">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">Recommended Visa</div>
                    <h3 className="text-2xl font-bold">{hireResult.recommendedVisa?.category}</h3>
                    <p className="text-gray-600 mt-1">{hireResult.recommendedVisa?.reason}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hireResult.recommendedVisa?.citations?.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-mono text-blue-700">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-6 flex-shrink-0">
                    <div className="text-2xl font-bold text-brand-600">${hireResult.recommendedVisa?.estimatedCost?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">est. cost</div>
                    <div className="text-lg font-semibold text-gray-700 mt-1">{hireResult.recommendedVisa?.timelineMonths} months</div>
                    <div className="text-xs text-gray-500">timeline</div>
                  </div>
                </div>
              </div>

              {/* Risk flags */}
              {hireResult.riskFlags?.length > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-orange-500" />
                    <span className="font-semibold text-orange-800">Risk Flags</span>
                  </div>
                  {hireResult.riskFlags.map((f, i) => <div key={i} className="text-sm text-orange-700">• {f}</div>)}
                </div>
              )}

              {/* Step-by-step hiring process */}
              {hireResult.hiringSteps?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold mb-4">Step-by-Step Hiring Process</h3>
                  <div className="space-y-2">
                    {hireResult.hiringSteps.map((step, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                          onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {step.step}
                            </div>
                            <div>
                              <span className="font-medium text-sm">{step.action}</span>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
                                ${step.owner === 'HR' ? 'bg-blue-100 text-blue-700' :
                                  step.owner === 'Attorney' ? 'bg-purple-100 text-purple-700' :
                                  step.owner === 'USCIS' ? 'bg-gray-100 text-gray-700' :
                                  'bg-green-100 text-green-700'}`}>
                                {step.owner}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{step.timeline}</span>
                            {expandedStep === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>
                        {expandedStep === i && (
                          <div className="px-4 pb-3 pt-1 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
                            {step.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance checklist */}
              {hireResult.complianceChecklist && (
                <div className="card">
                  <h3 className="font-bold mb-4">Your Compliance Obligations</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {hireResult.complianceChecklist.lcaRequired && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">LCA Requirements</div>
                        {hireResult.complianceChecklist.lcaSteps?.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700 mb-1">
                            <CheckCircle size={14} className="text-brand-500 mt-0.5 flex-shrink-0" /> {s}
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">I-9 Steps</div>
                      {hireResult.complianceChecklist.i9Steps?.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700 mb-1">
                          <CheckCircle size={14} className="text-brand-500 mt-0.5 flex-shrink-0" /> {s}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Ongoing Obligations</div>
                      {hireResult.complianceChecklist.ongoingObligations?.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700 mb-1">
                          <Clock size={14} className="text-orange-400 mt-0.5 flex-shrink-0" /> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All visa options comparison */}
              {hireResult.allOptions?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold mb-4">All Visa Options Compared</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 pr-4 font-semibold text-gray-600">Visa</th>
                          <th className="text-left py-2 pr-4 font-semibold text-gray-600">Fit</th>
                          <th className="text-left py-2 pr-4 font-semibold text-gray-600">Est. Cost</th>
                          <th className="text-left py-2 pr-4 font-semibold text-gray-600">Timeline</th>
                          <th className="text-left py-2 font-semibold text-gray-600">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hireResult.allOptions.map(opt => (
                          <tr key={opt.category} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 pr-4 font-semibold">{opt.category}</td>
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                                  <div className="h-1.5 bg-brand-500 rounded-full" style={{ width: `${opt.fitScore}%` }} />
                                </div>
                                <span className="text-xs text-gray-500">{opt.fitScore}%</span>
                              </div>
                            </td>
                            <td className="py-2 pr-4 text-gray-600">${opt.employerCost?.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-gray-600">{opt.timelineMonths}mo</td>
                            <td className="py-2 text-xs text-gray-500">{opt.pros?.[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">{hireResult.trustLayer?.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EMPLOYEE ROSTER ────────────────────────────────────────────────── */}
      {tab === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">International Employee Roster</h2>
              <p className="text-sm text-gray-500">{roster.length} employees tracked</p>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddForm(v => !v)}>
              <UserPlus size={16} /> Add Employee
            </button>
          </div>

          {showAddForm && (
            <div className="card border-2 border-brand-200">
              <h3 className="font-bold mb-4">Add International Employee</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.employeeName} onChange={e => setE('employeeName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.citizenship} onChange={e => setE('citizenship', e.target.value)} placeholder="India, Canada..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.jobTitle} onChange={e => setE('jobTitle', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Visa Type</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.visaType} onChange={e => setE('visaType', e.target.value)} placeholder="H-1B, L-1A, TN..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visa Expiry</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.visaExpiry} onChange={e => setE('visaExpiry', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Salary (USD)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.salary} onChange={e => setE('salary', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">I-9 Status</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.i9Status} onChange={e => setE('i9Status', e.target.value)}>
                    <option value="complete">Complete</option>
                    <option value="pending">Pending</option>
                    <option value="reverification_needed">Re-verification Needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LCA Status</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newEmp.lcaStatus} onChange={e => setE('lcaStatus', e.target.value)}>
                    <option value="valid">Valid</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="not_required">Not Required</option>
                    <option value="missing">Missing</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={addEmployee} disabled={loading === 'add' || !newEmp.employeeName || !newEmp.citizenship}>
                  {loading === 'add' ? 'Adding...' : 'Add to Roster'}
                </button>
              </div>
            </div>
          )}

          {roster.length === 0 && !showAddForm ? (
            <div className="card text-center py-16 border-dashed border-2 border-gray-200">
              <Users className="mx-auto text-gray-300 mb-3" size={40} />
              <h3 className="font-semibold text-gray-700">No employees in roster yet</h3>
              <p className="text-sm text-gray-500 mt-1">Add your international employees to track visa expirations and compliance</p>
              <button className="btn-primary mt-4" onClick={() => setShowAddForm(true)}>Add First Employee</button>
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Citizenship</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Visa</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Expires</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">I-9</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">LCA</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map(emp => {
                    const days = daysUntil(emp.visa_expiry);
                    return (
                      <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{emp.employee_name}</div>
                          <div className="text-xs text-gray-500">{emp.job_title}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{emp.citizenship}</td>
                        <td className="px-4 py-3 font-medium">{emp.visa_type || '—'}</td>
                        <td className="px-4 py-3">
                          {emp.visa_expiry ? (
                            <div className="flex items-center">
                              <span className="text-gray-600">{emp.visa_expiry}</span>
                              {expiryBadge(days)}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {emp.i9_status === 'complete'
                            ? <CheckCircle size={16} className="text-green-500" />
                            : emp.i9_status === 'reverification_needed'
                            ? <AlertTriangle size={16} className="text-orange-500" />
                            : <Clock size={16} className="text-yellow-500" />
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${emp.lca_status === 'valid' ? 'bg-green-100 text-green-700' :
                              emp.lca_status === 'missing' ? 'bg-red-100 text-red-700' :
                              emp.lca_status === 'not_required' ? 'bg-gray-100 text-gray-600' :
                              'bg-yellow-100 text-yellow-700'}`}>
                            {emp.lca_status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── COMPLIANCE REPORT ─────────────────────────────────────────────── */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Compliance Report</h2>
              <p className="text-sm text-gray-500">AI-generated audit of your entire international workforce</p>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={runCompliance} disabled={loading === 'compliance'}>
              <ShieldCheck size={16} /> {loading === 'compliance' ? 'Running...' : 'Run Audit'}
            </button>
          </div>

          {loading === 'compliance' && (
            <div className="card text-center py-12">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Auditing {roster.length} employees for compliance issues...</p>
            </div>
          )}

          {compReport && !loading && (
            <div className="space-y-4">
              <div className={`card border-2 ${compReport.overallRisk === 'CRITICAL' ? 'border-red-400' : compReport.overallRisk === 'HIGH' ? 'border-orange-300' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <span className={RISK_BADGE[compReport.overallRisk] + ' text-sm px-3 py-1'}>
                    {compReport.overallRisk} RISK
                  </span>
                  <p className="text-gray-700">{compReport.summary}</p>
                </div>
              </div>

              {compReport.criticalAlerts?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold mb-3 text-red-700">🚨 Critical Alerts</h3>
                  {compReport.criticalAlerts.map((a, i) => (
                    <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
                      <div className="font-medium text-sm">{a.employee} — {a.issue}</div>
                      <div className="text-xs text-red-700 mt-1">Deadline: {a.deadline} | Action: {a.action}</div>
                      {a.citation && <span className="text-xs font-mono text-red-600">{a.citation}</span>}
                    </div>
                  ))}
                </div>
              )}

              {compReport.expiringWithin90Days?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold mb-3 text-orange-700">⏰ Expiring Within 90 Days</h3>
                  {compReport.expiringWithin90Days.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg mb-2">
                      <div>
                        <span className="font-medium text-sm">{e.employee}</span>
                        <span className="text-xs text-orange-700 ml-2">{e.visaType} expires {e.expiry}</span>
                      </div>
                      <div className="text-xs text-gray-600">{e.renewalAction}</div>
                    </div>
                  ))}
                </div>
              )}

              {compReport.recommendations?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold mb-3">Recommendations</h3>
                  {compReport.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700 mb-2">
                      <CheckCircle size={14} className="text-brand-500 mt-0.5 flex-shrink-0" /> {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!compReport && !loading && (
            <div className="card text-center py-16 border-dashed border-2 border-gray-200">
              <ShieldCheck className="mx-auto text-gray-300 mb-3" size={40} />
              <h3 className="font-semibold text-gray-700">Run your compliance audit</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                We'll check every employee for expiring visas, LCA violations, I-9 issues, and H-1B compliance risks.
              </p>
              <button className="btn-primary mt-4" onClick={runCompliance}>Run Audit Now</button>
            </div>
          )}
        </div>
      )}

      {/* ── SPONSORSHIP DOCUMENTS ─────────────────────────────────────────── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-bold text-lg">Sponsorship Documents</h2>
            <p className="text-sm text-gray-500">Generate offer letters, sponsorship commitments, and support letters for your international hires</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-bold mb-4">1. Select Document Type</h3>
              <div className="space-y-2">
                {SPONSORSHIP_DOCS.map(d => (
                  <button key={d.type}
                    onClick={() => setSelectedDocType(d.type)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all
                      ${selectedDocType === d.type ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>

              <h3 className="font-bold mt-6 mb-4">2. Employee Details</h3>
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Employee Name', placeholder: 'Priya Patel' },
                  { key: 'jobTitle', label: 'Job Title', placeholder: 'Senior ML Engineer' },
                  { key: 'citizenship', label: 'Citizenship', placeholder: 'India' },
                  { key: 'visaType', label: 'Visa Type', placeholder: 'H-1B' },
                  { key: 'salary', label: 'Salary (USD)', placeholder: '160000' },
                  { key: 'startDate', label: 'Start Date', placeholder: '2026-10-01' }
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={empForDoc[f.key]} onChange={e => setEmpForDoc(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} />
                  </div>
                ))}
              </div>

              <button className="btn-primary w-full mt-4"
                onClick={genDoc}
                disabled={loading === 'doc' || !selectedDocType}>
                {loading === 'doc' ? 'Generating...' : 'Generate Document'}
              </button>
            </div>

            <div>
              {loading === 'doc' && (
                <div className="card text-center py-16">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Drafting document with legal citations...</p>
                </div>
              )}

              {generatedDoc && !loading && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">{generatedDoc.letter?.title}</h3>
                    {generatedDoc.documentId && (
                      <a href={`/api/documents/${generatedDoc.documentId}/pdf`} target="_blank" rel="noreferrer"
                        className="btn-secondary flex items-center gap-1.5 text-xs py-1.5">
                        <Download size={12} /> PDF
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Confidence: {generatedDoc.letter?.trustLayer?.confidenceScore}%
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
                    {generatedDoc.letter?.letterContent}
                  </div>
                  {generatedDoc.letter?.citations?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {generatedDoc.letter.citations.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-mono text-blue-700">{c}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3">{generatedDoc.letter?.trustLayer?.disclaimer}</p>
                </div>
              )}

              {!generatedDoc && !loading && (
                <div className="card text-center py-16 border-dashed border-2 border-gray-200 h-full">
                  <FileText className="mx-auto text-gray-300 mb-3" size={36} />
                  <p className="text-sm text-gray-500">Select a document type and fill in employee details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
