import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../data/translations';

const ProfilePage = () => {
  const { profile, updateProfile, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile({
      full_name: fullName,
      phone_number: phoneNumber,
      address: address,
    });
    setLoading(false);
  };

  if (authLoading || !profile) {
    return <div>{t.loading}...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t.profile}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">{t.fullName}</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">{t.phoneNumber}</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">{t.address}</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2" disabled={loading}>
          {loading ? t.saving : t.saveChanges}
        </button>
      </form>
    </div>
  );
};