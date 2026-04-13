import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../App';
import { Plane, FileText, BarChart2, Home, LogOut, Building2 } from 'lucide-react';

const NAV_ALL = [
  { to: '/dashboard',  label: 'Dashboard',       Icon: Home,      personas: null },
  { to: '/company',    label: 'Company Hub',      Icon: Building2, personas: ['company'] },
  { to: '/visa',       label: 'Visa Strategy',    Icon: BarChart2, personas: ['founder','cofounder','employee','preincorporation','traveler'] },
  { to: '/travel',     label: 'Travel Advisory',  Icon: Plane,     personas: null },
  { to: '/documents',  label: 'Documents',        Icon: FileText,  personas: null },
];

export default function Navbar() {
  const { user, logout } = useUser();
  const { pathname } = useLocation();

  const NAV = NAV_ALL.filter(n =>
    n.personas === null || n.personas.includes(user?.persona_type)
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IA</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">ImmigAI</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${pathname === to
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
