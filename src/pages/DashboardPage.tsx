import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-2xl bg-white shadow-md p-8">
        <p className="text-sm text-gray-500 mb-1">Welcome back,</p>
        <p className="text-2xl font-semibold text-gray-800">{user!.username}</p>
        <div className="mt-4 flex gap-6 text-sm text-gray-600">
          <span>Email: <span className="font-medium text-gray-800">{user!.email}</span></span>
          <span>Role: <span className="font-medium text-gray-800 capitalize">{user!.role}</span></span>
        </div>
      </div>
    </div>
  );
}
