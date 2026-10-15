import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getDoctorStatistics } from '../api/statistics';
import { ApiError, getErrorMessage } from '../api/apiErrors';
import type { DoctorStatisticsDto } from '../types/statistics';
import { defaultStatisticsDateRange, formatDateIso } from '../utils/appointmentDateTime';
import { formatPeriodMonthLabel } from '../utils/i18nLabels';
import { formatCurrency } from '../utils/currency';
import DatePicker from '../components/DatePicker';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';

function initialDateRange(searchParams: URLSearchParams): { from: string; to: string } {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (from && to && from <= to) {
    return { from, to };
  }
  return defaultStatisticsDateRange();
}

export default function DoctorStatisticsDetailPage() {
  const { doctorId } = useParams();
  const doctorIdNum = Number(doctorId);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [range, setRange] = useState(() => initialDateRange(searchParams));
  const { from, to } = range;
  const isRangeValid = from <= to;

  useEffect(() => {
    if (searchParams.get('from') !== from || searchParams.get('to') !== to) {
      setSearchParams({ from, to }, { replace: true });
    }
  }, [from, to, searchParams, setSearchParams]);

  const [stats, setStats] = useState<DoctorStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRetryable, setIsRetryable] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadStats = useCallback(async () => {
    if (!isRangeValid) {
      return;
    }
    setLoading(true);
    setError('');
    setIsRetryable(false);
    setNotFound(false);
    try {
      const data = await getDoctorStatistics(doctorIdNum, from, to, user!.token);
      setStats(data);
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'INVALID_DOCTOR_ID') {
        setNotFound(true);
      } else {
        setError(getErrorMessage(err));
        setIsRetryable(err instanceof ApiError && err.errorCode === 'UPSTREAM_FAILURE');
      }
    } finally {
      setLoading(false);
    }
  }, [doctorIdNum, from, to, user, isRangeValid]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const statusBreakdown = stats
    ? [
        { key: 'pending', label: t('status.pending'), value: stats.pendingCount },
        { key: 'completed', label: t('status.completed'), value: stats.completedCount },
        { key: 'missed', label: t('status.missed'), value: stats.missedCount },
        { key: 'cancelled', label: t('status.cancelled'), value: stats.cancelledCount },
      ]
    : [];
  const hasStatusData = statusBreakdown.some((d) => d.value > 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <Link
          to={`/statistics?from=${from}&to=${to}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← {t('doctorStatistics.backToStatistics')}
        </Link>
      </div>

      {notFound ? (
        <div className="rounded-2xl bg-white shadow-md p-12 text-center">
          <p className="text-lg font-semibold text-gray-800">{t('doctorStatistics.notFoundTitle')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('doctorStatistics.notFoundMessage')}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl bg-white shadow-md px-6 py-4 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="doctorStatsFrom" className="block text-sm font-medium text-gray-600 mb-1">
                {t('statistics.from')}
              </label>
              <DatePicker
                id="doctorStatsFrom"
                value={from}
                onChange={(iso) => setRange((prev) => ({ ...prev, from: iso }))}
                isDayDisabled={(date) => formatDateIso(date) > to}
              />
            </div>
            <div>
              <label htmlFor="doctorStatsTo" className="block text-sm font-medium text-gray-600 mb-1">
                {t('statistics.to')}
              </label>
              <DatePicker
                id="doctorStatsTo"
                value={to}
                onChange={(iso) => setRange((prev) => ({ ...prev, to: iso }))}
                min={from}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              {isRetryable && (
                <button
                  type="button"
                  onClick={() => void loadStats()}
                  className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  {t('common.retry')}
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-white shadow-md p-12 text-center text-sm text-gray-500">
              {t('doctorStatistics.loading')}
            </div>
          ) : (
            stats && (
              <>
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">{stats.doctorName}</h1>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                  <StatCard label={t('doctorStatistics.appointments')} value={stats.appointmentCount} />
                  <StatCard label={t('doctorStatistics.completed')} value={stats.completedCount} />
                  <StatCard label={t('doctorStatistics.revenue')} value={formatCurrency(stats.revenue)} />
                  <StatCard label={t('doctorStatistics.uniquePatients')} value={stats.uniquePatients} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl bg-white shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {t('doctorStatistics.statusBreakdownTitle')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      {t('doctorStatistics.statusBreakdownSubtitle')}
                    </p>
                    {hasStatusData ? (
                      <BarChart
                        data={statusBreakdown}
                        getId={(d) => d.key}
                        getLabel={(d) => d.label}
                        getValue={(d) => d.value}
                        formatValue={(v) => String(Math.round(v))}
                      />
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-500">{t('statistics.noData')}</div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {t('doctorStatistics.visitsOverTimeTitle')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      {t('doctorStatistics.visitsOverTimeSubtitle')}
                    </p>
                    {stats.visitsOverTime.length === 0 ? (
                      <div className="py-16 text-center text-sm text-gray-500">{t('statistics.noData')}</div>
                    ) : (
                      <LineChart
                        data={stats.visitsOverTime}
                        getId={(d) => d.period}
                        getLabel={(d) => formatPeriodMonthLabel(t, d.period)}
                        getValue={(d) => d.visits}
                        formatValue={(v) => String(Math.round(v))}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {t('doctorStatistics.topProceduresTitle')}
                  </h2>
                  {stats.topProcedures.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">{t('statistics.noData')}</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="py-2 pr-4 font-medium text-gray-500">{t('statistics.columnName')}</th>
                          <th className="py-2 pr-4 font-medium text-gray-500">
                            {t('doctorStatistics.columnTimesPerformed')}
                          </th>
                          <th className="py-2 font-medium text-gray-500">{t('statistics.columnRevenue')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.topProcedures.map((p) => (
                          <tr key={p.procedureId}>
                            <td className="py-2 pr-4 text-gray-600">{p.procedureName}</td>
                            <td className="py-2 pr-4 text-gray-600">{p.timesPerformed}</td>
                            <td className="py-2 text-gray-600">{formatCurrency(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-white shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('statistics.topPatientsTitle')}</h2>
                  {stats.topPatients.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">{t('statistics.noData')}</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="py-2 pr-4 font-medium text-gray-500">{t('statistics.columnName')}</th>
                          <th className="py-2 pr-4 font-medium text-gray-500">{t('statistics.columnVisits')}</th>
                          <th className="py-2 font-medium text-gray-500">{t('statistics.columnRevenue')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.topPatients.map((p) => (
                          <tr key={p.patientId}>
                            <td className="py-2 pr-4 text-gray-600">{p.patientName}</td>
                            <td className="py-2 pr-4 text-gray-600">{p.visits}</td>
                            <td className="py-2 text-gray-600">{formatCurrency(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
