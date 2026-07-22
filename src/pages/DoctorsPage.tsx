import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteDoctor, getDoctors } from '../api/doctor';
import type { DoctorResponseDto } from '../types/doctor';

export default function DoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<DoctorResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDoctors(user!.token);
      setDoctors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await deleteDoctor(pendingDelete.id, user!.token);
      setPendingDelete(null);
      await loadDoctors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Doctors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctor records</p>
        </div>
        <Link
          to="/doctors/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Add Doctor
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-md overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Loading doctors…</div>
        ) : doctors.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">No doctors found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">First Name</th>
                <th className="px-6 py-3 font-medium text-gray-500">Last Name</th>
                <th className="px-6 py-3 font-medium text-gray-500">Specialization</th>
                <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                <th className="px-6 py-3 font-medium text-gray-500">Phone</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800">{doctor.firstName ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-800">{doctor.lastName ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{doctor.specialization ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{doctor.email ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{doctor.phone ?? '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/doctors/${doctor.id}/edit`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(doctor)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete doctor?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently remove{' '}
              <span className="font-medium text-gray-800">
                {pendingDelete.firstName} {pendingDelete.lastName}
              </span>{' '}
              from the doctor records. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
