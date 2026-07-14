import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user, logout } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-2 text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="mb-6 text-gray-600">
          Logged in as <span className="font-medium text-gray-900">{user.username}</span>
        </p>
        <button
          onClick={logout}
          className="w-full rounded-lg bg-gray-800 py-2.5 font-medium text-white transition hover:bg-gray-900"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
