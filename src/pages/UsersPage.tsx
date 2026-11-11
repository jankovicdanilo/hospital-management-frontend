import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { deleteUser, getUsers } from '../api/user';
import { getErrorMessage } from '../api/apiErrors';
import type { UserDto } from '../types/user';
import type { Role } from '../types/auth';
import type { BadgeColor } from '../components/Badge';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { translateRole } from '../utils/i18nLabels';

const ROLE_BADGE_COLOR: Record<Role, BadgeColor> = {
  Admin: 'blue',
  Manager: 'amber',
  Doctor: 'green',
};

const PAGE_SIZE = 8;

export default function UsersPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<UserDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [notice, setNotice] = useState(
    Boolean((location.state as { appliesNextLogin?: boolean } | null)?.appliesNextLogin),
  );
  const { searchInput, setSearchInput, search } = useDebouncedSearch({
    onChange: () => setPageNumber(1),
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers(user!.token);
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    if (!search) {
      return users;
    }
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  const totalCount = filteredUsers.length;
  const pagedUsers = useMemo(
    () => filteredUsers.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE),
    [filteredUsers, pageNumber],
  );

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await deleteUser(pendingDelete.id, user!.token);
      setPendingDelete(null);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{t('users.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('users.subtitle')}</p>
        </div>
        <Link
          to="/users/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {t('users.addUser')}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          <p>{t('users.appliesNextLoginNotice')}</p>
          <button
            type="button"
            onClick={() => setNotice(false)}
            aria-label={t('common.dismiss')}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label={t('stats.totalUsers')} value={totalCount} />
        <StatCard
          label={t('stats.showing')}
          value={
            totalCount === 0
              ? t('stats.showingZero')
              : t('stats.showingRange', {
                  from: (pageNumber - 1) * PAGE_SIZE + 1,
                  to: Math.min(pageNumber * PAGE_SIZE, totalCount),
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
          placeholder={t('users.searchPlaceholder')}
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <DataTable
        columns={[
          {
            header: t('users.columnUsername'),
            render: (u) => (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{u.username}</span>
                {u.username === user!.username && <Badge color="gray">{t('users.you')}</Badge>}
              </div>
            ),
          },
          { header: t('common.email'), render: (u) => u.email },
          {
            header: t('users.columnRole'),
            render: (u) => <Badge color={ROLE_BADGE_COLOR[u.role]}>{translateRole(t, u.role)}</Badge>,
          },
        ]}
        rows={pagedUsers}
        rowKey={(u) => u.id}
        loading={loading}
        emptyMessage={t('users.noUsersFound')}
        actions={(u) => (
          <>
            <Link
              to={`/users/${u.id}/edit`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common.edit')}
            </Link>
            {u.username !== user!.username && (
              <button
                type="button"
                onClick={() => setPendingDelete(u)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </>
        )}
        pagination={{
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount,
          onPageChange: setPageNumber,
        }}
      />

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('users.deleteTitle')}</h2>
            <p className="text-sm text-gray-600 mb-6">
              <Trans
                i18nKey="users.deleteBody"
                values={{ name: pendingDelete.username }}
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
