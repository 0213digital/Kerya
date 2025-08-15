import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Home, Car, Calendar, MessageSquare, User, Settings, Shield, Users, MapPin, LogOut } from 'lucide-react';

const iconProps = {
  className: "h-5 w-5 mr-3",
  strokeWidth: 1.5,
};

export function DashboardLayout({ children }) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const location = useLocation();

  const isAgency = profile?.role === 'agency';
  const isAdmin = profile?.role === 'admin';

  const getNavLinks = () => {
    const baseUserLinks = [
      { to: "/profile", label: t('myProfile'), icon: <User {...iconProps} /> },
      { to: "/dashboard/bookings", label: t('myBookings'), icon: <Calendar {...iconProps} /> },
      { to: "/dashboard/messages", label: t('messages'), icon: <MessageSquare {...iconProps} /> },
    ];

    if (isAgency) {
      return [
        { to: "/dashboard/agency", label: t('agencyDashboard'), icon: <Home {...iconProps} /> },
        { to: "/dashboard/agency/vehicles", label: t('vehicles'), icon: <Car {...iconProps} /> },
        { to: "/dashboard/agency/bookings", label: t('bookings'), icon: <Calendar {...iconProps} /> },
        { to: "/dashboard/agency/settings", label: t('settings'), icon: <Settings {...iconProps} /> },
        ...baseUserLinks,
      ];
    }

    if (isAdmin) {
      return [
        { to: "/admin/dashboard", label: t('adminDashboard'), icon: <Shield {...iconProps} /> },
        { to: "/admin/users", label: t('userManagement'), icon: <Users {...iconProps} /> },
        { to: "/admin/locations", label: t('locationManagement'), icon: <MapPin {...iconProps} /> },
        ...baseUserLinks,
      ];
    }

    return baseUserLinks;
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-64 bg-white shadow-md flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">
            {isAgency ? t('agencyDashboard') : isAdmin ? t('adminDashboard') : t('dashboard')}
          </h2>
        </div>
        <nav className="p-2">
          <ul>
            {navLinks.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/dashboard/agency" || to === "/admin/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {icon}
                  {label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={signOut}
                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors duration-150 mt-4"
              >
                <LogOut {...iconProps} />
                {t('logout')}
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
