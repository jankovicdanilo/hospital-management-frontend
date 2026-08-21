import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteDoctor, getDoctors } from '../api/doctor';
import { getErrorMessage } from '../api/apiErrors';
import type { DoctorResponseDto } from '../types/doctor';
import DataTable from '../components/DataTable';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

export default function DoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<DoctorResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 5;
  const [totalCount, setTotalCount] = useState(0);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDoctors(pageNumber, pageSize, user!.token);
      setDoctors(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user, pageNumber]);

  useEffect(() => {
    void loadDoctors();
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
      setError(getErrorMessage(err));
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

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Doctors" value={totalCount} />
        <StatCard
          label="Showing"
          value={
            totalCount === 0
              ? '0 of 0'
              : `${(pageNumber - 1) * pageSize + 1}–${Math.min(pageNumber * pageSize, totalCount)} of ${totalCount}`
          }
        />
      </div>

      <DataTable
          columns={[
            {
              header: 'Doctor',
              render: (d) => (
                <div className="flex items-center gap-3">
                  <Avatar name={`${d.firstName ?? ''} ${d.lastName ?? ''}`} />
                  <span className="font-medium text-gray-800">
                    {d.firstName ?? '—'} {d.lastName ?? ''}
                  </span>
                </div>
              ),
            },
            {
              header: 'Specialization',
              render: (d) =>
                d.specialization ? <Badge color="blue">{d.specialization}</Badge> : '—',
            },
            { header: 'Email', render: (d) => d.email ?? '—' },
            { header: 'Phone', render: (d) => d.phone ?? '—' },
          ]}
          rows={doctors}
          rowKey={(d) => d.id}
          loading={loading}
          emptyMessage="No doctors found."
          actions={(d) => (
              <>
                <Link to={`/doctors/${d.id}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  View
                </Link>
                <Link to={`/doctors/${d.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit
                </Link>
                <button type="button" onClick={() => setPendingDelete(d)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              </>
          )}
          pagination={{
            pageNumber,
            pageSize,
            totalCount,
            onPageChange: setPageNumber,
          }}
      />

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
