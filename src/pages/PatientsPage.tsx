import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deletePatient, getPatients } from '../api/patient';
import { getErrorMessage } from '../api/apiErrors';
import type { PatientListDto } from '../types/patient';
import DataTable from '../components/DataTable';
import Avatar from '../components/Avatar';
import StatCard from '../components/StatCard';

const SEARCH_MIN_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 300;

function formatDate(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PatientListDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 5;
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearch(trimmed.length >= SEARCH_MIN_LENGTH ? trimmed : '');
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPageNumber(1);
  }, [search]);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPatients(pageNumber, pageSize, user!.token, search || undefined);
      setPatients(data.items);
      setTotalCount((data.totalCount))
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user, pageNumber, search]);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await deletePatient(pendingDelete.id, user!.token);
      setPendingDelete(null);
      await loadPatients();
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
          <h1 className="text-2xl font-semibold text-gray-800">Patients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage patient records</p>
        </div>
        <Link
          to="/patients/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Add Patient
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Patients" value={totalCount} />
        <StatCard
          label="Showing"
          value={
            totalCount === 0
              ? '0 of 0'
              : `${(pageNumber - 1) * pageSize + 1}–${Math.min(pageNumber * pageSize, totalCount)} of ${totalCount}`
          }
        />
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or last name…"
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <DataTable
          columns={[
            {
              header: 'Patient',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <Avatar name={`${p.name} ${p.lastName}`} />
                  <span className="font-medium text-gray-800">
                    {p.name} {p.lastName}
                  </span>
                </div>
              ),
            },
            { header: 'Email', render: (p) => p.email },
            { header: 'Phone', render: (p) => p.phone ?? '—' },
            { header: 'Date of Birth', render: (p) => formatDate(p.dateOfBirth) },
          ]}
          rows={patients}
          rowKey={(p) => p.id}
          loading={loading}
          emptyMessage="No patients found."
          actions={(p) => (
              <>
                <Link to={`/patients/${p.id}/history`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  History
                </Link>
                <Link to={`/patients/${p.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit
                </Link>
                <button type="button" onClick={() => setPendingDelete(p)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
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
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete patient?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently remove{' '}
              <span className="font-medium text-gray-800">
                {pendingDelete.name} {pendingDelete.lastName}
              </span>{' '}
              from the patient records. This action cannot be undone.
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
