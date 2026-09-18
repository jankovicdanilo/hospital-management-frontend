import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { deleteDoctor, getDoctors } from '../api/doctor';
import { getErrorMessage } from '../api/apiErrors';
import type { DoctorResponseDto } from '../types/doctor';
import DataTable from '../components/DataTable';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';

export default function DoctorsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<DoctorResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<DoctorResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 5;
  const [totalCount, setTotalCount] = useState(0);
  const { searchInput, setSearchInput, search } = useDebouncedSearch({
    onChange: () => setPageNumber(1),
  });

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDoctors(pageNumber, pageSize, user!.token, search || undefined);
      setDoctors(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user, pageNumber, search]);

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
          <h1 className="text-2xl font-semibold text-gray-800">{t('doctors.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('doctors.subtitle')}</p>
        </div>
        <Link
          to="/doctors/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {t('doctors.addDoctor')}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label={t('stats.totalDoctors')} value={totalCount} />
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

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('doctors.searchPlaceholder')}
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <DataTable
          columns={[
            {
              header: t('doctors.columnDoctor'),
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
              header: t('doctors.columnSpecialization'),
              render: (d) =>
                d.specialization ? <Badge color="blue">{d.specialization}</Badge> : '—',
            },
            { header: t('common.email'), render: (d) => d.email ?? '—' },
            { header: t('common.phone'), render: (d) => d.phone ?? '—' },
          ]}
          rows={doctors}
          rowKey={(d) => d.id}
          loading={loading}
          emptyMessage={t('doctors.noDoctorsFound')}
          actions={(d) => (
              <>
                <Link to={`/doctors/${d.id}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  {t('common.view')}
                </Link>
                <Link to={`/doctors/${d.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  {t('common.edit')}
                </Link>
                <button type="button" onClick={() => setPendingDelete(d)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
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
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('doctors.deleteTitle')}</h2>
            <p className="text-sm text-gray-600 mb-6">
              <Trans
                i18nKey="doctors.deleteBody"
                values={{ name: `${pendingDelete.firstName} ${pendingDelete.lastName}` }}
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
