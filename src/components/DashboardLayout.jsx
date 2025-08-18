import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext'; // CORRECTED
import { Home, Car, Calendar, MessageSquare, User, Settings, Shield, Users, MapPin, LogOut } from 'lucide-react';

const iconProps = {
  className: "h-5 w-5 mr-3",
  strokeWidth: 1.5,
};

export function DashboardLayout({ children, title, description }) {
  const { handleLogout, isAgencyOwner, isAdmin } = useAuth();
  const { t } = useTranslation(); // CORRECTED

  const getNavLinks = () => {
    const baseLinks = [
        { to: "/profile", label: t('myProfile'), icon: <User {...iconProps} /> },
        { to: "/dashboard/messages", label: t('navMessages'), icon: <MessageSquare {...iconProps} /> },
    ];
    if (isAgencyOwner) {
      return [
        { to: "/dashboard/agency", label: t('agencyDashboard'), icon: <Home {...iconProps} /> },
        { to: "/dashboard/agency/vehicles", label: t('myVehicles'), icon: <Car {...iconProps} /> },
        { to: "/dashboard/agency/bookings", label: t('bookings'), icon: <Calendar {...iconProps} /> },
        { to: "/dashboard/agency/calendar", label: t('agencyCalendar'), icon: <Calendar {...iconProps} /> }, // AJOUT DU LIEN
        { to: "/dashboard/agency/settings", label: t('agencySettings'), icon: <Settings {...iconProps} /> },
        ...baseLinks,
      ];
    }
    if (isAdmin) {
      return [
        { to: "/admin/dashboard", label: t('adminDashboard'), icon: <Shield {...iconProps} /> },
        { to: "/admin/users", label: t('userManagement'), icon: <Users {...iconProps} /> },
        { to: "/admin/locations", label: t('locationManagement'), icon: <MapPin {...iconProps} /> },
        ...baseLinks.filter(link => link.to !== '/dashboard/bookings'),
      ];
    }
    return [
        { to: "/dashboard/bookings", label: t('myBookings'), icon: <Calendar {...iconProps} /> },
        ...baseLinks
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden md:block w-64 bg-white shadow-lg flex-shrink-0">
        <nav className="p-4">
          <ul>
            {navLinks.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/dashboard/agency" || to === "/admin/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 my-1 text-sm font-medium rounded-md transition-colors duration-150 ${
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
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2.5 my-1 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors duration-150 mt-4"
              >
                <LogOut {...iconProps} />
                {t('logout')}
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {title && <h1 className="text-3xl font-bold text-slate-800">{title}</h1>}
                {description && <p className="mt-1 text-slate-500">{description}</p>}
                <div className="mt-8">
                    {children}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}