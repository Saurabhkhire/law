import React, { useState, useEffect } from 'react';
import { useUser } from '../App';
import { useSearchParams } from 'react-router-dom';
import { generateDocument, generateRFE, getUserDocuments, markReviewed } from '../api/client';
import { FileText, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const DOC_CATEGORIES = {
  'Travel & Airport': ['employment_verification', 'business_travel', 'founder_role', 'advance_parole_travel', 'reentry_support', 'b1_business_purpose'],
  'Petition & Visa': ['critical_role_declaration', 'sponsorship_intent'],
  'HR & Hiring': ['offer_letter']
};

const DOC_INFO = {
  employment_verification: { label: 'Employment Verification', desc: 'For CBP / airport use', icon: '🛂' },
  business_travel: { label: 'Business Travel Letter', desc: 'For international business trips', icon: '✈️' },
  founder_role: { label: 'Founder Role Letter', desc: 'Establishes your critical role & equity', icon: '🚀' },
  advance_parole_travel: { label: 'Advance Parole Letter', desc: 'For pending I-485 holders', icon: '📋' },
  reentry_support: { label: 'Re-Entry Support Letter', desc: 'Support letter for CBP on return', icon: '🔄' },
  b1_business_purpose: { label: 'B-1 Purpose Letter', desc: 'Clarifies B-1 permitted activities', icon: '💼' },
  critical_role_declaration: { label: 'Critical Role Declaration', desc: 'Expert support for O-1A/EB-1A', icon: '⭐' },
  sponsorship_intent: { label: 'Sponsorship Intent Letter', desc: 'Company commitment to sponsor', icon: '🤝' },
  offer_letter: { label: 'Offer Letter with Visa Sponsorship', desc: 'For international hires', icon: '📝' }
};

export default function DocumentStudio() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [generating, setGenerating] = useState('');
  const [rfeMode, setRfeMode] = useState(false);
  const [rfeForm, setRfeForm] = useState({ rfeText: '', criterionChallenged: '', receiptNumber: '', deadline: '' });
  const [error, setError] = useState('');

  const preselectedType = searchParams.get('type');

  useEffect(() => {
    getUserDocuments(user.id).then(r => setDocuments(r.data)).catch(() => {});
    if (preselectedType === 'rfe') setRfeMode(true);
  }, [user.id, preselectedType]);

  const generate = async (docType) => {
    setGenerating(docType);
    setError('');
    try {
      const { data } = await generateDocument(user.id, docType);
      setActiveDoc(data);
      getUserDocuments(user.id).then(r => setDocuments(r.data));
    } catch (e) {
      setError(e.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating('');
    }
  };

  const submitRFE = async () => {
    setGenerating('rfe');
    setError('');
    try {
      const { data } = await generateRFE(user.id, rfeForm);
      setActiveDoc(data);
      getUserDocuments(user.id).then(r => setDocuments(r.data));
    } catch (e) {
      setError(e.response?.data?.error || 'RFE generation failed');
    } finally {
      setGenerating('');
    }
  };

  const handleMarkReviewed = async (id) => {
    await markReviewed(id);
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, attorney_reviewed: 1 } : d));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Document Studio</h1>
        <p className="text-gray-500 mt-1">Generate, download, and manage all your immigration documents</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: document types */}
        <div className="col-span-1 space-y-4">
          {/* RFE Shield */}
          <div
            className={`card cursor-pointer border-2 transition-all ${rfeMode ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => { setRfeMode(true); setActiveDoc(null); }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛡️</span>
              <span className="font-bold">RFE Shield</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">URGENT</span>
            </div>
            <p className="text-xs text-gray-500">Got a USCIS Request for Further Evidence? Draft your response with case law citations</p>
          </div>

          {/* Document categories */}
          {Object.entries(DOC_CATEGORIES).map(([category, types]) => (
            <div key={category} className="card">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{category}</h3>
              <div className="space-y-2">
                {types.map(type => {
                  const info = DOC_INFO[type];
                  const existing = documents.find(d => d.doc_type === type);
                  return (
                    <button
                      key={type}
                      className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-all hover:bg-gray-50 border ${
                        activeDoc?.letter?.letterType === type || preselectedType === type
                          ? 'border-brand-300 bg-brand-50'
                          : 'border-transparent'
                      }`}
                      onClick={() => { setRfeMode(false); generate(type); }}
                      disabled={generating === type}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-1">
                          {info.label}
                          {existing?.attorney_reviewed === 1 && <CheckCircle size={12} className="text-green-500" />}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{info.desc}</div>
                      </div>
                      {generating === type && (
                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: content area */}
        <div className="col-span-2 space-y-4">
          {/* RFE form */}
          {rfeMode && (
            <div className="card">
              <h2 className="font-bold text-lg mb-4">RFE Response Drafter</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={rfeForm.receiptNumber} onChange={e => setRfeForm(f => ({ ...f, receiptNumber: e.target.value }))}
                      placeholder="EAC-24-..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response Deadline</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={rfeForm.deadline} onChange={e => setRfeForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Criterion Being Challenged</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={rfeForm.criterionChallenged} onChange={e => setRfeForm(f => ({ ...f, criterionChallenged: e.target.value }))}
                    placeholder="e.g. High Salary, Critical Role, Press Coverage" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paste RFE Text</label>
                  <textarea rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={rfeForm.rfeText} onChange={e => setRfeForm(f => ({ ...f, rfeText: e.target.value }))}
                    placeholder="Paste the full text of the RFE from USCIS..." />
                </div>
                <button className="btn-primary" onClick={submitRFE} disabled={!rfeForm.rfeText || generating === 'rfe'}>
                  {generating === 'rfe' ? 'Drafting response...' : 'Draft RFE Response'}
                </button>
              </div>
            </div>
          )}

          {/* Generated document preview */}
          {activeDoc && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold">{activeDoc.letter?.title || activeDoc.response?.coverLetterContent?.slice(0, 40)}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      Confidence: {activeDoc.letter?.trustLayer?.confidenceScore || activeDoc.response?.confidenceScore}%
                    </span>
                    {activeDoc.letter?.trustLayer?.requiresAttorneyReview && (
                      <span className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertTriangle size={12} /> Attorney review recommended
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeDoc.documentId && (
                    <a
                      href={`/api/documents/${activeDoc.documentId}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary flex items-center gap-1.5 text-sm"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                  {activeDoc.documentId && (
                    <button className="btn-primary text-sm flex items-center gap-1.5" onClick={() => handleMarkReviewed(activeDoc.documentId)}>
                      <CheckCircle size={14} /> Mark Reviewed
                    </button>
                  )}
                </div>
              </div>

              {/* Letter content */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
                {activeDoc.letter?.letterContent || activeDoc.response?.coverLetterContent || 'No content'}
              </div>

              {/* Citations */}
              {(activeDoc.letter?.citations || activeDoc.response?.citations || []).length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Legal Citations:</div>
                  <div className="flex flex-wrap gap-1">
                    {(activeDoc.letter?.citations || activeDoc.response?.citations).map(c => (
                      <span key={c} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-mono text-blue-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* RFE-specific */}
              {activeDoc.response?.evidenceRequested?.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-xs font-semibold text-yellow-800 mb-2">Evidence to Gather:</div>
                  {activeDoc.response.evidenceRequested.map((e, i) => (
                    <div key={i} className="text-xs text-yellow-700">• {e}</div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-500">
                  {activeDoc.letter?.trustLayer?.disclaimer || 'AI-generated. Not legal advice. Review with a licensed attorney before use.'}
                </p>
              </div>
            </div>
          )}

          {/* Past documents */}
          {documents.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4">Your Documents ({documents.length})</h3>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {doc.attorney_reviewed
                        ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        : <Clock size={16} className="text-yellow-500 flex-shrink-0" />
                      }
                      <div>
                        <div className="text-sm font-medium">{doc.title}</div>
                        <div className="text-xs text-gray-500">
                          {doc.confidence_score}% confidence · {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!doc.attorney_reviewed && (
                        <button className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded-lg"
                          onClick={() => handleMarkReviewed(doc.id)}>Mark reviewed</button>
                      )}
                      <a href={`/api/documents/${doc.id}/pdf`} target="_blank" rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline border border-brand-200 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Download size={12} /> PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!activeDoc && !rfeMode && (
            <div className="card text-center py-16 border-dashed border-2 border-gray-200">
              <FileText className="mx-auto text-gray-300 mb-4" size={40} />
              <h3 className="font-semibold text-gray-700">Select a document type to generate</h3>
              <p className="text-sm text-gray-500 mt-2">Choose from the panel on the left. All letters are AI-drafted with legal citations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
