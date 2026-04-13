import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import VisaStrategy from './pages/VisaStrategy';
import TravelAdvisory from './pages/TravelAdvisory';
import DocumentStudio from './pages/DocumentStudio';
import CompanyHub from './pages/CompanyHub';
import Navbar from './components/Navbar';

export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('immigai_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('immigai_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('immigai_user');
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        {user && <Navbar />}
        <div className={user ? 'pt-16' : ''}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Onboarding />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/visa" element={user ? <VisaStrategy /> : <Navigate to="/" />} />
            <Route path="/travel" element={user ? <TravelAdvisory /> : <Navigate to="/" />} />
            <Route path="/documents" element={user ? <DocumentStudio /> : <Navigate to="/" />} />
            <Route path="/company"   element={user ? <CompanyHub />     : <Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </UserContext.Provider>
  );
}
