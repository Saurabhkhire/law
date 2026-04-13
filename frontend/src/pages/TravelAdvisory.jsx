import React, { useState } from 'react';
import { useUser } from '../App';
import { assessTravel, generateTravelLetter } from '../api/client';
import { AlertTriangle, CheckCircle, FileText, Download } from 'lucide-react';

const RISK_STYLES = {
  LOW:      { bar: 'bg-green-500',  badge: 'badge-low',      icon: '✅' },
  MEDIUM:   { bar: 'bg-yellow-500', badge: 'badge-medium',   icon: '⚠️' },
  HIGH:     { bar: 'bg-orange-500', badge: 'badge-high',     icon: '🔶' },
  CRITICAL: { bar: 'bg-red-500',    badge: 'badge-critical', icon: '🚨' }
};

const LETTER_LABELS = {
  employment_verification: 'Employment Verification Letter',
  business_travel: 'Business Travel Letter',
  founder_role: 'Founder Role Letter',
  advance_parole_travel: 'Advance Parole Letter',
  reentry_support: 'Re-Entry Support Letter',
  b1_business_purpose: 'B-1 Purpose Letter'
};

const PURPOSES = [
  'Business meeting / conference',
  'Investor meetings',
  'Family visit',
  'Vacation / tourism',
  'Medical travel',
  'Home country visit',
  'Pre-incorporation exploration'
];

export default function TravelAdvisory() {
  const { user } = useUser();
  const [form, setForm] = useState({ destination: '', purpose: '', travelDate: '', returnDate: '' });
  const [assessment, setAssessment] = useState(null);
  const [advisoryId, setAdvisoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [letterLoading, setLetterLoading] = useState('');
  const [generatedLetters, setGeneratedLetters] = useState({});
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const runAssessment = async () => {
    if (!form.destination || !form.purpose) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await assessTravel(user.id, form);
      setAssessment(data.assessment);
      setAdvisoryId(data.advisoryId);
    } catch (e) {
      setError(e.response?.data?.error || 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  const getLetter = async (letterType) => {
    setLetterLoading(letterType);
    try {
      const { data } = await generateTravelLetter(user.id, letterType, {
        destination: form.destination,
        purpose: form.purpose,
        travelDate: form.travelDate,
        returnDate: form.returnDate
      });
      setGeneratedLetters(prev => ({ ...prev, [letterType]: data }));
    } catch (e) {
      setError('Letter generation failed');
    } finally {
      setLetterLoading('');
    }
  };

  const risk = assessment ? RISK_STYLES[assessment.riskLevel] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Travel Advisory</h1>
        <p className="text-gray-500 mt-1">Get your travel risk assessment and generate documents for the airport</p>
      </div>

      {/* Travel form */}
      <div className="card mb-6">
        <h2 className="font-bold mb-4">Where are you traveling?</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.destination}
              onChange={e => set('destination', e.target.value)}
              placeholder="e.g. India, United Kingdom, Canada"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Travel *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.purpose}
              onChange={e => set('purpose', e.target.value)}
            >
              <option value="">Select purpose...</option>
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.travelDate} onChange={e => set('travelDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.returnDate} onChange={e => set('returnDate', e.target.value)} />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={runAssessment} disabled={loading || !form.destination || !form.purpose}>
          {loading ? 'Assessing...' : 'Get Risk Assessment'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      {loading && (
        <div className="card text-center py-12">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="font-semibold">Analyzing travel risk...</div>
          <p className="text-sm text-gray-500 mt-1">Checking visa rules, unlawful presence, and re-entry requirements</p>
        </div>
      )}

      {assessment && !loading && (
        <div className="space-y-6">
          {/* Risk level banner */}
          <div className={`card border-2 ${assessment.riskLevel === 'CRITICAL' ? 'border-red-400' : assessment.riskLevel === 'HIGH' ? 'border-orange-300' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Travel Risk Assessment</div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{risk.icon}</span>
                  <div>
                    <span className={risk.badge + ' text-sm px-3 py-1'}>{assessment.riskLevel} RISK</span>
                    <p className="text-gray-700 mt-1">{assessment.riskSummary}</p>
                  </div>
                </div>
              </div>
              {assessment.unlawfulPresenceDays > 0 && (
                <div className="text-right bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="text-2xl font-bold text-red-600">{assessment.unlawfulPresenceDays}</div>
                  <div className="text-xs text-red-700">days unlawful presence</div>
                </div>
              )}
            </div>
          </div>

          {/* Risk factors */}
          {assessment.riskFactors?.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4">Risk Factors</h3>
              <div className="space-y-3">
                {assessment.riskFactors.map((rf, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5
                      ${rf.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        rf.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        rf.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'}`}>
                      {rf.severity}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{rf.factor}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{rf.explanation}</div>
                      {rf.citation && <span className="text-xs font-mono text-blue-600">{rf.citation}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {assessment.recommendations?.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4">What to Do</h3>
              <div className="space-y-3">
                {assessment.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5
                      ${rec.priority === 'IMMEDIATE' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'BEFORE_TRAVEL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'}`}>
                      {rec.priority.replace('_', ' ')}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{rec.action}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{rec.explanation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to say at border */}
          {assessment.borderScript && (
            <div className="card bg-green-50 border border-green-200">
              <h3 className="font-bold mb-2 text-green-800">✅ What to Say at the Border</h3>
              <p className="text-sm text-green-900">{assessment.borderScript}</p>
              {assessment.whatNotToSay && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <span className="text-xs font-bold text-red-700">🚫 What NOT to say: </span>
                  <span className="text-xs text-red-700">{assessment.whatNotToSay}</span>
                </div>
              )}
            </div>
          )}

          {/* Document checklist */}
          {assessment.documentChecklist?.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4">Documents to Carry</h3>
              <div className="space-y-2">
                {assessment.documentChecklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                    {item.required
                      ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      : <div className="w-4 h-4 border-2 border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                    }
                    <div>
                      <span className="text-sm font-medium">{item.document}</span>
                      {item.required && <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Required</span>}
                      <div className="text-xs text-gray-500 mt-0.5">{item.reason}</div>
                      {item.obtainedFrom && <div className="text-xs text-gray-400">Get from: {item.obtainedFrom}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate letters */}
          {assessment.lettersToGenerate?.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-2">Recommended Letters to Generate</h3>
              <p className="text-sm text-gray-500 mb-4">AI-drafted letters to carry at the airport. Attorney review recommended before use.</p>
              <div className="space-y-3">
                {assessment.lettersToGenerate.map(lt => (
                  <div key={lt} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        <span className="text-sm font-medium">{LETTER_LABELS[lt] || lt}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn-secondary text-xs py-1.5 px-3"
                          onClick={() => getLetter(lt)}
                          disabled={letterLoading === lt}
                        >
                          {letterLoading === lt ? 'Drafting...' : generatedLetters[lt] ? 'Re-draft' : 'Draft Letter'}
                        </button>
                        {generatedLetters[lt] && (
                          <a
                            href={`/api/documents/${generatedLetters[lt].documentId}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Download size={12} /> PDF
                          </a>
                        )}
                      </div>
                    </div>
                    {generatedLetters[lt] && (
                      <div className="p-4 text-sm text-gray-700 whitespace-pre-line max-h-64 overflow-y-auto bg-white border-t border-gray-100 font-mono text-xs leading-relaxed">
                        {generatedLetters[lt].letter?.letterContent}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust disclaimer */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs text-gray-500">{assessment.trustLayer?.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
