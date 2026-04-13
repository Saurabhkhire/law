import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../App';
import { getAssessments, getUserDocuments, getTravelHistory } from '../api/client';
import { BarChart2, Plane, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const PERSONA_LABEL = {
  founder: 'Startup Founder', cofounder: 'Co-Founder',
  employee: 'Employee', preincorporation: 'Pre-Incorporation',
  traveler: 'Traveler / Visitor'
};

const RISK_COLOR = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  HIGH: 'text-orange-600 bg-orange-50',
  CRITICAL: 'text-red-600 bg-red-50'
};

export default function Dashboard() {
  const { user } = useUser();
  const [assessments, setAssessments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [travelHistory, setTravelHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAssessments(user.id).then(r => setAssessments(r.data)).catch(() => {}),
      getUserDocuments(user.id).then(r => setDocuments(r.data)).catch(() => {}),
      getTravelHistory(user.id).then(r => setTravelHistory(r.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, [user.id]);

  const topAssessment = assessments.sort((a, b) => b.fit_score - a.fit_score)[0];
  const latestTravel = travelHistory[0];
  const pendingApps = user.pending_applications || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500 mt-1">
          {PERSONA_LABEL[user.persona_type]} · {user.citizenship} · {user.current_visa_type || 'No current visa'}
        </p>
      </div>

      {/* Alerts */}
      {pendingApps.includes('I-485') && !pendingApps.includes('AP') && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <div className="font-semibold text-red-800">Travel Warning</div>
            <div className="text-sm text-red-700">
              You have a pending I-485 without Advance Parole. Traveling outside the US may abandon your Green Card application.
              <Link to="/travel" className="underline ml-1">Get travel advice →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-brand-600">{assessments.length}</div>
          <div className="text-sm text-gray-500 mt-1">Visa Pathways Analyzed</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-brand-600">{documents.length}</div>
          <div className="text-sm text-gray-500 mt-1">Documents Generated</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-brand-600">{travelHistory.length}</div>
          <div className="text-sm text-gray-500 mt-1">Travel Assessments</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — main actions */}
        <div className="col-span-2 space-y-4">
          {/* Top visa recommendation */}
          {topAssessment ? (
            <div className="card border-l-4 border-l-brand-500">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide">Best Visa Match</div>
                  <div className="text-xl font-bold mt-1">{topAssessment.visa_category}</div>
                  <div className="text-sm text-gray-600 mt-1">{topAssessment.explanation}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand-600">{topAssessment.fit_score}%</div>
                  <div className="text-xs text-gray-500">fit score</div>
                </div>
              </div>
              <Link to="/visa" className="btn-primary inline-block mt-4 text-sm">View full analysis</Link>
            </div>
          ) : (
            <div className="card text-center border-dashed border-2 border-gray-200">
              <BarChart2 className="mx-auto text-gray-300 mb-3" size={36} />
              <div className="font-semibold text-gray-700">No visa analysis yet</div>
              <p className="text-sm text-gray-500 mt-1">Get your personalized visa pathway ranking</p>
              <Link to="/visa" className="btn-primary inline-block mt-4 text-sm">Analyze My Visa Options</Link>
            </div>
          )}

          {/* Travel status */}
          {latestTravel ? (
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Latest Travel Advisory</div>
                  <div className="font-bold mt-1">{latestTravel.destination_country}</div>
                  <div className="text-sm text-gray-600">{latestTravel.purpose}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${RISK_COLOR[latestTravel.risk_level]}`}>
                  {latestTravel.risk_level}
                </span>
              </div>
              <Link to="/travel" className="text-sm text-brand-600 hover:underline mt-3 inline-block">Plan another trip →</Link>
            </div>
          ) : (
            <div className="card text-center border-dashed border-2 border-gray-200">
              <Plane className="mx-auto text-gray-300 mb-3" size={36} />
              <div className="font-semibold text-gray-700">Planning to travel?</div>
              <p className="text-sm text-gray-500 mt-1">Get your risk assessment and border documents</p>
              <Link to="/travel" className="btn-primary inline-block mt-4 text-sm">Check Travel Safety</Link>
            </div>
          )}
        </div>

        {/* Right column — recent docs */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Recent Documents</h3>
              <Link to="/documents" className="text-xs text-brand-600 hover:underline">View all</Link>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="mx-auto text-gray-300 mb-2" size={28} />
                <p className="text-sm text-gray-500">No documents yet</p>
                <Link to="/documents" className="text-xs text-brand-600 hover:underline mt-1 inline-block">Generate a letter</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 5).map(doc => (
                  <div key={doc.id} className="flex items-start gap-2">
                    {doc.attorney_reviewed
                      ? <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      : <Clock size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    }
                    <div>
                      <div className="text-sm font-medium truncate">{doc.title}</div>
                      <div className="text-xs text-gray-500">{doc.confidence_score}% confidence</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card">
            <h3 className="font-bold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/documents?type=employment_verification" className="block text-sm text-gray-700 hover:text-brand-600 hover:underline">
                → Generate airport letter
              </Link>
              <Link to="/documents?type=offer_letter" className="block text-sm text-gray-700 hover:text-brand-600 hover:underline">
                → Create offer letter
              </Link>
              <Link to="/documents?type=rfe" className="block text-sm text-gray-700 hover:text-brand-600 hover:underline">
                → Respond to RFE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
