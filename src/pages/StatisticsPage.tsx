import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getDoctorsLoad,
  getDoctorsLoadTimeline,
  getDoctorsRevenue,
  getPatientStatistics,
  getProceduresProfitability,
} from '../api/statistics';
import type {
  DoctorLoadDto,
  DoctorLoadTimelineDto,
  DoctorRevenueDto,
  PatientStatisticsDto,
  ProcedureProfitabilityDto,
  VisitsOverTimeDto,
} from '../types/statistics';
import { useDateRangeSection } from '../hooks/useDateRangeSection';
import { defaultStatisticsDateRange, formatDateIso } from '../utils/appointmentDateTime';
import { formatPeriodMonthLabel } from '../utils/i18nLabels';
import { formatCurrency } from '../utils/currency';
import DatePicker from '../components/DatePicker';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';

/** Fills gaps between the first and last returned month with zero-visit entries, so the line chart doesn't skip over months with no data. */
function fillVisitMonthGaps(visits: VisitsOverTimeDto[]): VisitsOverTimeDto[] {
  if (visits.length === 0) {
    return [];
  }

  const byPeriod = new Map(visits.map((v) => [v.period, v.visits]));
  const [firstYear, firstMonth] = visits[0].period.split('-').map(Number);
  const [lastYear, lastMonth] = visits[visits.length - 1].period.split('-').map(Number);

  const filled: VisitsOverTimeDto[] = [];
  let year = firstYear;
  let month = firstMonth;
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    const period = `${year}-${String(month).padStart(2, '0')}`;
    filled.push({ period, visits: byPeriod.get(period) ?? 0 });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return filled;
}

function initialDateRange(searchParams: URLSearchParams): { from: string; to: string } {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (from && to && from <= to) {
    return { from, to };
  }
  return defaultStatisticsDateRange();
}

interface SectionCardProps {
  title: string;
  subtitle: string;
  loading: boolean;
  error: string;
  isRetryable: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

function StatisticsSectionCard({
  title,
  subtitle,
  loading,
  error,
  isRetryable,
  onRetry,
  isEmpty,
  emptyMessage,
  children,
}: SectionCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-white shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">{subtitle}</p>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500">{t('common.loading')}</div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          {isRetryable && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              {t('common.retry')}
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="py-16 text-center text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        children
      )}
    </div>
  );
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [range, setRange] = useState(() => initialDateRange(searchParams));
  const { from, to } = range;
  const isRangeValid = from <= to;

  useEffect(() => {
    if (searchParams.get('from') !== from || searchParams.get('to') !== to) {
      setSearchParams({ from, to }, { replace: true });
    }
  }, [from, to, searchParams, setSearchParams]);

  function goToDoctor(doctorId: number) {
    navigate(`/statistics/doctors/${doctorId}?from=${from}&to=${to}`);
  }

  const [doctorsLoad, retryDoctorsLoad] = useDateRangeSection(
    getDoctorsLoad,
    [] as DoctorLoadDto[],
    from,
    to,
    user?.token,
    isRangeValid,
  );
  const [doctorsRevenue, retryDoctorsRevenue] = useDateRangeSection(
    getDoctorsRevenue,
    [] as DoctorRevenueDto[],
    from,
    to,
    user?.token,
    isRangeValid,
  );
  const [doctorsLoadTimeline, retryDoctorsLoadTimeline] = useDateRangeSection(
    getDoctorsLoadTimeline,
    [] as DoctorLoadTimelineDto[],
    from,
    to,
    user?.token,
    isRangeValid,
  );
  const [proceduresProfitability, retryProceduresProfitability] = useDateRangeSection(
    getProceduresProfitability,
    [] as ProcedureProfitabilityDto[],
    from,
    to,
    user?.token,
    isRangeValid,
  );
  const [patientStatistics, retryPatientStatistics] = useDateRangeSection<PatientStatisticsDto | null>(
    getPatientStatistics,
    null,
    from,
    to,
    user?.token,
    isRangeValid,
  );

  const visitsOverTime = patientStatistics.data ? fillVisitMonthGaps(patientStatistics.data.visitsOverTime) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t('statistics.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('statistics.subtitle')}</p>
      </div>

      <div className="mb-6 rounded-2xl bg-white shadow-md px-6 py-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="statsFrom" className="block text-sm font-medium text-gray-600 mb-1">
            {t('statistics.from')}
          </label>
          <DatePicker
            id="statsFrom"
            value={from}
            onChange={(iso) => setRange((prev) => ({ ...prev, from: iso }))}
            isDayDisabled={(date) => formatDateIso(date) > to}
          />
        </div>
        <div>
          <label htmlFor="statsTo" className="block text-sm font-medium text-gray-600 mb-1">
            {t('statistics.to')}
          </label>
          <DatePicker
            id="statsTo"
            value={to}
            onChange={(iso) => setRange((prev) => ({ ...prev, to: iso }))}
            min={from}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatisticsSectionCard
          title={t('statistics.doctorsLoadTitle')}
          subtitle={t('statistics.doctorsLoadSubtitle')}
          loading={doctorsLoad.loading}
          error={doctorsLoad.error}
          isRetryable={doctorsLoad.isRetryable}
          onRetry={retryDoctorsLoad}
          isEmpty={!doctorsLoad.loading && !doctorsLoad.error && doctorsLoad.data.length === 0}
          emptyMessage={t('statistics.noData')}
        >
          <BarChart
            data={doctorsLoad.data}
            getId={(d) => d.doctorId}
            getLabel={(d) => d.doctorName}
            getValue={(d) => d.appointmentCount}
            formatValue={(v) => String(Math.round(v))}
            onBarClick={(d) => goToDoctor(d.doctorId)}
          />
        </StatisticsSectionCard>

        <StatisticsSectionCard
          title={t('statistics.doctorsRevenueTitle')}
          subtitle={t('statistics.doctorsRevenueSubtitle')}
          loading={doctorsRevenue.loading}
          error={doctorsRevenue.error}
          isRetryable={doctorsRevenue.isRetryable}
          onRetry={retryDoctorsRevenue}
          isEmpty={!doctorsRevenue.loading && !doctorsRevenue.error && doctorsRevenue.data.length === 0}
          emptyMessage={t('statistics.noData')}
        >
          <BarChart
            data={doctorsRevenue.data}
            getId={(d) => d.doctorId}
            getLabel={(d) => d.doctorName}
            getValue={(d) => d.revenue}
            formatValue={formatCurrency}
            getTooltipDetail={(d) => t('statistics.completedCountDetail', { count: d.completedCount })}
            onBarClick={(d) => goToDoctor(d.doctorId)}
          />
        </StatisticsSectionCard>
      </div>

      <div className="mt-6">
        <StatisticsSectionCard
          title={t('statistics.doctorsLoadTimelineTitle')}
          subtitle={t('statistics.doctorsLoadTimelineSubtitle')}
          loading={doctorsLoadTimeline.loading}
          error={doctorsLoadTimeline.error}
          isRetryable={doctorsLoadTimeline.isRetryable}
          onRetry={retryDoctorsLoadTimeline}
          isEmpty={
            !doctorsLoadTimeline.loading && !doctorsLoadTimeline.error && doctorsLoadTimeline.data.length === 0
          }
          emptyMessage={t('statistics.noData')}
        >
          <LineChart
            series={doctorsLoadTimeline.data.map((d) => ({
              id: d.doctorId,
              label: d.doctorName,
              data: d.points,
              onClick: () => goToDoctor(d.doctorId),
            }))}
            getId={(p) => p.period}
            getLabel={(p) => formatPeriodMonthLabel(t, p.period)}
            getValue={(p) => p.visits}
            formatValue={(v) => String(Math.round(v))}
          />
        </StatisticsSectionCard>
      </div>

      <div className="mt-6">
        <StatisticsSectionCard
          title={t('statistics.proceduresProfitabilityTitle')}
          subtitle={t('statistics.proceduresProfitabilitySubtitle')}
          loading={proceduresProfitability.loading}
          error={proceduresProfitability.error}
          isRetryable={proceduresProfitability.isRetryable}
          onRetry={retryProceduresProfitability}
          isEmpty={
            !proceduresProfitability.loading &&
            !proceduresProfitability.error &&
            proceduresProfitability.data.length === 0
          }
          emptyMessage={t('statistics.noData')}
        >
          <BarChart
            data={proceduresProfitability.data}
            getId={(d) => d.procedureId}
            getLabel={(d) => d.procedureName}
            getValue={(d) => d.revenue}
            formatValue={formatCurrency}
            getTooltipDetail={(d) => t('statistics.timesPerformedDetail', { count: d.timesPerformed })}
          />
        </StatisticsSectionCard>
      </div>

      <div className="mt-6">
        <StatisticsSectionCard
          title={t('statistics.patientStatisticsTitle')}
          subtitle={t('statistics.patientStatisticsSubtitle')}
          loading={patientStatistics.loading}
          error={patientStatistics.error}
          isRetryable={patientStatistics.isRetryable}
          onRetry={retryPatientStatistics}
          isEmpty={!patientStatistics.loading && !patientStatistics.error && patientStatistics.data?.totalVisits === 0}
          emptyMessage={t('statistics.noData')}
        >
          {patientStatistics.data && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label={t('statistics.totalPatients')} value={patientStatistics.data.totalPatients} />
                <StatCard label={t('statistics.totalVisits')} value={patientStatistics.data.totalVisits} />
                <StatCard
                  label={t('statistics.totalRevenue')}
                  value={formatCurrency(patientStatistics.data.totalRevenue)}
                />
                <StatCard
                  label={t('statistics.averageRevenuePerPatient')}
                  value={formatCurrency(patientStatistics.data.averageRevenuePerPatient)}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('statistics.visitsOverTime')}</h3>
                <LineChart
                  data={visitsOverTime}
                  getId={(d) => d.period}
                  getLabel={(d) => formatPeriodMonthLabel(t, d.period)}
                  getValue={(d) => d.visits}
                  formatValue={(v) => String(Math.round(v))}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('statistics.topPatientsTitle')}</h3>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="py-2 pr-4 font-medium text-gray-500">{t('statistics.columnName')}</th>
                      <th className="py-2 pr-4 font-medium text-gray-500">{t('statistics.columnVisits')}</th>
                      <th className="py-2 font-medium text-gray-500">{t('statistics.columnRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patientStatistics.data.topPatients.map((p) => (
                      <tr key={p.patientId}>
                        <td className="py-2 pr-4 text-gray-600">{p.patientName}</td>
                        <td className="py-2 pr-4 text-gray-600">{p.visits}</td>
                        <td className="py-2 text-gray-600">{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </StatisticsSectionCard>
      </div>
    </div>
  );
}
