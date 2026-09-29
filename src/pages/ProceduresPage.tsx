import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { deleteProcedure, getProcedures } from '../api/procedure';
import { getErrorMessage } from '../api/apiErrors';
import type { ProcedureListDto } from '../types/procedure';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import { formatCurrency as formatPrice } from '../utils/currency';

function priceTier(price: number): { key: 'tierStandard' | 'tierElevated' | 'tierPremium'; color: 'green' | 'amber' | 'red' } {
  if (price < 100) {
    return { key: 'tierStandard', color: 'green' };
  }
  if (price < 300) {
    return { key: 'tierElevated', color: 'amber' };
  }
  return { key: 'tierPremium', color: 'red' };
}

export default function ProceduresPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{t('procedures.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('procedures.subtitle')}</p>
        </div>
        <Link
          to="/procedures/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {t('procedures.addProcedure')}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label={t('stats.totalProcedures')} value={totalCount} />
        <StatCard
          label={t('stats.showing')}
          value={
            totalCount === 0
              ? t('stats.showingZero')
              : t('stats.showingRange', {
                  from: (pageNumber - 1) * pageSize + 1,
                  to: Math.min(pageNumber * pageSize, totalCount),
                  total: totalCount,
                })
          }
        />
      </div>

      <DataTable
          columns={[
            { header: t('common.name'), render: (p) => p.name },
            { header: t('common.price'), render: (p) => formatPrice(p.price) },
            {
              header: t('procedures.columnTier'),
              render: (p) => {
                const tier = priceTier(p.price);
                return <Badge color={tier.color}>{t(`procedures.${tier.key}`)}</Badge>;
              },
            },
          ]}
          rows={procedures}
          rowKey={(p) => p.id}
          loading={loading}
          emptyMessage={t('procedures.noProceduresFound')}
          actions={(p) => (
              <>
                <Link to={`/procedures/${p.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  {t('common.edit')}
                </Link>
                <button type="button" onClick={() => setPendingDelete(p)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  {t('common.delete')}
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
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('procedures.deleteTitle')}</h2>
            <p className="text-sm text-gray-600 mb-6">
              <Trans
                i18nKey="procedures.deleteBody"
                values={{ name: pendingDelete.name }}
                components={{ bold: <span className="font-medium text-gray-800" /> }}
              />
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
