import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../data/translations';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await signUp(email, password, { full_name: fullName });
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard/profile');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{t.signup}</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          placeholder={t.fullName}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border p-2 mb-2 w-full"
        />
        <input
          type="email"
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mb-2 w-full"
        />
        <input
          type="password"
          placeholder={t.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mb-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">{t.signup}</button>
      </form>
    </div>
  );
};