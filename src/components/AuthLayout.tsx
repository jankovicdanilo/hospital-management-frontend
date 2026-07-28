import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <span className="text-lg font-semibold text-gray-800">Hospital Management</span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">{user.username}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-5xl px-6 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Danilo Jankovic &amp; Aleksei Kudriavtsev
        </div>
      </footer>
    </div>
  );
}
