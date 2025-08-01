import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../data/translations';

const Navbar = () => {
  const { session, profile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const t = translations[language];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Kerya</Link>
        <div>
          {session ? (
            <>
              <Link to="/dashboard/profile" className="mr-4">
                {profile ? `${t.welcome}, ${profile.full_name}` : t.profile}
              </Link>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mr-4">{t.login}</Link>
              <Link to="/signup" className="mr-4">{t.signup}</Link>
            </>
          )}
          <select onChange={(e) => setLanguage(e.target.value)} value={language} className="ml-4 bg-gray-700">
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>
        </div>
      </div>
    </nav>
  );
};
