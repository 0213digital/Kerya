import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Updated import
import { useTranslation } from '../contexts/LanguageContext';
import { User, LogIn, LogOut, ChevronDown, ChevronUp, Globe } from 'lucide-react';

export function Navbar() {
    // Use the custom hook to get all auth-related data and functions
    const { profile, handleLogout, isAuthenticated, isAgencyOwner, isAdmin } = useAuth();
    const { t, language, setLanguage } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleLanguage = () => setLanguage(language === 'en' ? 'fr' : 'en');
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 shadow-md bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <Link to="/" className="flex-shrink-0 cursor-pointer" onClick={closeMenu}>
                        {/* Corrected the image URL to a more stable path */}
                        <img src="https://amupkaaxnypendorkkrz.supabase.co/storage/v1/object/public/webpics/public/sayara-logo.png" alt="Sayara Logo" className="h-10" />
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
                        <Link to="/" className="hover:text-indigo-500">{t('navHome')}</Link>
                        <Link to="/search" className="hover:text-indigo-500">{t('navSearch')}</Link>
                    </nav>
                    <div className="hidden md:flex items-center space-x-4">
                        <button onClick={toggleLanguage} className="flex items-center p-2 rounded-full text-slate-600 hover:bg-slate-100"><Globe size={20} /><span className="ml-2 font-semibold text-sm">{language.toUpperCase()}</span></button>
                        {isAuthenticated ? (
                            <div className="relative">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-100">
                                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover" /> : <User className="text-slate-600" />}
                                    <span className="font-medium text-sm">{t('dashboard')}</span>{isMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
                                        <Link to="/profile" onClick={closeMenu} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t('myProfile')}</Link>
                                        {isAdmin && (
                                            <>
                                                <Link to="/admin/dashboard" onClick={closeMenu} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t('adminDashboard')}</Link>
                                                <Link to="/admin/users" onClick={closeMenu} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t('userManagement')}</Link>
                                            </>
                                        )}
                                        {isAgencyOwner ? (
                                            <>
                                                <Link to="/dashboard/agency" onClick={closeMenu} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t('agencyDashboard')}</Link>
                                                <Link to="/dashboard/agency/vehicles" onClick={closeMenu} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t('myVehicles')}</Link>
                                                <Link to="/dashboard/agency/bookings" onClick={closeMenu} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t('bookings')}</Link>
                                            </>
                                        ) : (!isAdmin && <Link to="/dashboard/bookings" onClick={closeMenu} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t('myBookings')}</Link>)}
                                        <div className="border-t border-slate-200 my-1"></div>
                                        <button onClick={() => { handleLogout(); closeMenu(); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100">
                                            <LogOut className="inline-block mr-2" size={16} /> {t('logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link to="/login" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200"><LogIn size={16} className="mr-2"/> {t('login')}</Link>
                                <Link to="/signup" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">{t('signup')}</Link>
                            </div>
                        )}
                    </div>
                    <div className="md:hidden flex items-center">
                        <button onClick={toggleLanguage} className="p-2 rounded-full text-slate-600"><Globe size={20} /></button>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-slate-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg></button>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="md:hidden"><div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">{/* Mobile links should also use <Link> */}</div></div>
                )}
            </div>
        </header>
    );
}
