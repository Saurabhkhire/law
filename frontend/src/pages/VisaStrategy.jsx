import React, { useState, useEffect } from 'react';
import { useUser } from '../App';
import { analyzeVisa, getAssessments } from '../api/client';
import { CheckCircle, XCircle, Clock, DollarSign, AlertTriangle, ExternalLink } from 'lucide-react';

const FIT_COLOR = (score) => {
  if (score >= 75) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const DIFFICULTY_BADGE = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700'
};

export default function VisaStrategy() {
  const { user } = useUser();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pathways');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await analyzeVisa(user.id);
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Check your OpenAI API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Visa Strategy</h1>
          <p className="text-gray-500 mt-1">AI-powered analysis of your best immigration pathways</p>
        </div>
        <button className="btn-primary" onClick={runAnalysis} disabled={loading}>
          {loading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {loading && (
        <div className="card text-center py-16">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="font-semibold">Analyzing your profile...</div>
          <p className="text-sm text-gray-500 mt-1">Matching against USCIS criteria and case law</p>
        </div>
      )}

      {analysis && !loading && (
        <>
          {/* Top recommendation */}
          <div className="card border-l-4 border-l-brand-500 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">
                  Top Recommendation
                </div>
                <h2 className="text-2xl font-bold">{analysis.topRecommendation?.visaCategory}</h2>
                <p className="text-gray-700 mt-2">{analysis.topRecommendation?.explanation}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {analysis.topRecommendation?.citations?.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 font-mono">{c}</span>
                  ))}
                </div>
              </div>
              <div className="text-right ml-6 flex-shrink-0">
                <div className="text-4xl font-bold text-brand-600">{analysis.topRecommendation?.fitScore}%</div>
                <div className="text-xs text-gray-500">fit score</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.topRecommendation?.confidenceScore}% confidence
                </div>
              </div>
            </div>
          </div>

          {/* Urgent warnings */}
          {analysis.urgentWarnings?.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-500" size={16} />
                <span className="font-semibold text-red-800">Important Warnings</span>
              </div>
              {analysis.urgentWarnings.map((w, i) => (
                <div key={i} className="text-sm text-red-700 mt-1">• {w}</div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {['pathways', 'gaps', 'advice'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize
                  ${activeTab === tab ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'gaps' ? 'Evidence Gaps' : tab === 'advice' ? 'Founder Advice' : 'All Pathways'}
              </button>
            ))}
          </div>

          {/* Pathways */}
          {activeTab === 'pathways' && (
            <div className="space-y-4">
              {analysis.allPathways?.map(pathway => (
                <div key={pathway.visaCategory} className={`card border ${FIT_COLOR(pathway.fitScore)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">{pathway.visaCategory}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${FIT_COLOR(pathway.fitScore)}`}>
                          {pathway.fitScore}% fit
                        </span>
                        {pathway.meetsMinimum
                          ? <CheckCircle size={16} className="text-green-500" />
                          : <XCircle size={16} className="text-red-400" />
                        }
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{pathway.summary}</p>
                      <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={14} />{pathway.timelineMonths}mo timeline</span>
                        <span className="flex items-center gap-1"><DollarSign size={14} />${pathway.estimatedCostUsd?.toLocaleString()}</span>
                        <span>{pathway.criteriaMetCount}/{pathway.criteriaTotalCount} criteria</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-xs font-semibold text-green-700 mb-1">Strengths</div>
                      {pathway.pros?.map((p, i) => <div key={i} className="text-xs text-gray-600">✓ {p}</div>)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-red-700 mb-1">Weaknesses</div>
                      {pathway.cons?.map((c, i) => <div key={i} className="text-xs text-gray-600">✗ {c}</div>)}
                    </div>
                  </div>
                  {pathway.citations?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {pathway.citations.map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-600">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Evidence Gaps */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              {analysis.evidenceGaps?.length === 0 && (
                <div className="card text-center py-8 text-gray-500">No evidence gaps found — strong profile!</div>
              )}
              {analysis.evidenceGaps?.map((gap, i) => (
                <div key={i} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">{gap.visaCategory}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_BADGE[gap.difficulty]}`}>
                          {gap.difficulty}
                        </span>
                      </div>
                      <h4 className="font-semibold mt-1">{gap.missingCriterion}</h4>
                      <p className="text-sm text-gray-600 mt-1">{gap.actionable}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500 flex-shrink-0 ml-4">
                      <div>{gap.timeToClose}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{gap.citation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Founder advice */}
          {activeTab === 'advice' && (
            <div className="card">
              <h3 className="font-bold mb-3">Founder-Specific Advice</h3>
              <p className="text-gray-700 leading-relaxed">{analysis.founderSpecificAdvice || 'No specific founder advice for your profile.'}</p>
            </div>
          )}

          {/* Trust layer */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Trust Layer Active</span>
              <span className="text-xs text-gray-500">({analysis.trustLayer?.provider})</span>
            </div>
            <p className="text-xs text-gray-500">{analysis.trustLayer?.disclaimer}</p>
          </div>
        </>
      )}

      {!analysis && !loading && (
        <div className="card text-center py-16 border-dashed border-2 border-gray-200">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold">Ready to analyze your visa options</h3>
          <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
            We'll match your profile against all relevant US visa categories, score your fit, and identify exactly what evidence you need.
          </p>
          <button className="btn-primary mt-6" onClick={runAnalysis}>Run Analysis Now</button>
        </div>
      )}
    </div>
  );
}
