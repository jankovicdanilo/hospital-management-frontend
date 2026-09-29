import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '../context/AuthContext';
import { getDoctorsLoad, getDoctorsRevenue, getPatientStatistics, getProceduresProfitability } from '../api/statistics';
import type {
  DoctorLoadDto,
  DoctorRevenueDto,
  PatientStatisticsDto,
  ProcedureProfitabilityDto,
  VisitsOverTimeDto,
} from '../types/statistics';
import { useDateRangeSection } from '../hooks/useDateRangeSection';
import { formatDateIso, getTodayInClinicTimeZone } from '../utils/appointmentDateTime';
import { formatCurrency } from '../utils/currency';
import DatePicker from '../components/DatePicker';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

function formatMonthLabel(t: TFunction, period: string): string {
  const [year, month] = period.split('-');
  const monthKey = MONTH_KEYS[Number(month) - 1];
  return `${t(`monthsShort.${monthKey}`)} '${year.slice(2)}`;
}

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

function defaultDateRange(): { from: string; to: string } {
  const today = getTodayInClinicTimeZone();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  return { from: formatDateIso(oneYearAgo), to: formatDateIso(today) };
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

  const [range, setRange] = useState(defaultDateRange);
  const { from, to } = range;
  const isRangeValid = from <= to;

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
                  getLabel={(d) => formatMonthLabel(t, d.period)}
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
