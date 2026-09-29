import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { setLanguage, type Language } from '../i18n';

export default function AuthLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold text-gray-800">{t('nav.appName')}</span>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {t('nav.dashboard')}
              </NavLink>
              <NavLink
                to="/patients"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {t('nav.patients')}
              </NavLink>
                <NavLink
                    to="/doctors"
                    className={({ isActive }) =>
                        `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                    }
                >
                    {t('nav.doctors')}
                </NavLink>
                <NavLink
                    to="/procedures"
                    className={({ isActive }) =>
                        `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                    }
                >
                    {t('nav.procedures')}
                </NavLink>
                <NavLink
                    to="/appointments"
                    className={({ isActive }) =>
                        `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                    }
                >
                    {t('nav.appointments')}
                </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={i18n.language === 'me' ? 'me' : 'en'}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label={t('nav.language')}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="en">EN</option>
              <option value="me">ME</option>
            </select>
            <span className="text-sm font-medium text-gray-500">{user.username}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-5xl px-6 py-4 text-center text-sm text-gray-500">
          {t('nav.footer', { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
}
