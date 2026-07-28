import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteProcedure, getProcedures } from '../api/procedure';
import type { ProcedureListDto } from '../types/procedure';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(price);
}

function priceTier(price: number): { label: string; color: 'green' | 'amber' | 'red' } {
  if (price < 100) {
    return { label: 'Standard', color: 'green' };
  }
  if (price < 300) {
    return { label: 'Elevated', color: 'amber' };
  }
  return { label: 'Premium', color: 'red' };
}

export default function ProceduresPage() {
  const { user } = useAuth();
  const [procedures, setProcedures] = useState<ProcedureListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ProcedureListDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 5;
  const [totalCount, setTotalCount] = useState(0);

  const loadProcedures = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProcedures(pageNumber, pageSize, user!.token);
      setProcedures(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [user, pageNumber]);

  useEffect(() => {
    void loadProcedures();
  }, [loadProcedures]);

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await deleteProcedure(pendingDelete.id, user!.token);
      setPendingDelete(null);
      await loadProcedures();
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
          <h1 className="text-2xl font-semibold text-gray-800">Procedures</h1>
          <p className="text-sm text-gray-500 mt-1">Manage procedures and their pricing</p>
        </div>
        <Link
          to="/procedures/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Add Procedure
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Procedures" value={totalCount} />
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
            { header: 'Name', render: (p) => p.name },
            { header: 'Price', render: (p) => formatPrice(p.price) },
            {
              header: 'Tier',
              render: (p) => {
                const tier = priceTier(p.price);
                return <Badge color={tier.color}>{tier.label}</Badge>;
              },
            },
          ]}
          rows={procedures}
          rowKey={(p) => p.id}
          loading={loading}
          emptyMessage="No procedures found."
          actions={(p) => (
              <>
                <Link to={`/procedures/${p.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete procedure?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently remove{' '}
              <span className="font-medium text-gray-800">{pendingDelete.name}</span> from the
              procedure list. This action cannot be undone.
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
