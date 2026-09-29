import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getPatientById } from '../api/patient';
import { getAppointmentsByPatient, getPatientSummary } from '../api/appointment';
import { getErrorMessage } from '../api/apiErrors';
import type { PatientGetByIdDto } from '../types/patient';
import type { AppointmentListResponseDto, PatientSummaryResponseDto } from '../types/appointment';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { APPOINTMENT_STATUSES, STATUS_STYLES } from '../utils/appointmentStatus';
import { formatCurrency } from '../utils/currency';
import { translateStatus } from '../utils/i18nLabels';

function formatDateOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateTime: string): string {
  return new Date(dateTime).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const APPOINTMENTS_PAGE_SIZE = 5;

export default function PatientDetailPage() {
  const { id } = useParams();
  const patientId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [patient, setPatient] = useState<PatientGetByIdDto | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState<AppointmentListResponseDto[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Keyed by patient + language so switching the app's language and
  // re-clicking Summary fetches a fresh translation instead of re-showing
  // the stale cached one, and a cached summary never leaks across patients.
  const [summaryCache, setSummaryCache] = useState<Record<string, PatientSummaryResponseDto>>({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const summaryCacheKey = `${patientId}:${i18n.language}`;
  const summary = summaryCache[summaryCacheKey];

  const loadPatient = useCallback(async () => {
    setPatientLoading(true);
    try {
      const data = await getPatientById(patientId, user!.token);
      setPatient(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPatientLoading(false);
    }
  }, [patientId, user]);

  const loadAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const data = await getAppointmentsByPatient(patientId, pageNumber, APPOINTMENTS_PAGE_SIZE, user!.token);
      setAppointments(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAppointmentsLoading(false);
    }
  }, [patientId, pageNumber, user]);

  useEffect(() => {
    void loadPatient();
  }, [loadPatient]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  async function handleLoadSummary() {
    if (summary || summaryLoading) {
      return;
    }

    const cacheKey = summaryCacheKey;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const data = await getPatientSummary(patientId, i18n.language, user!.token);
      setSummaryCache((prev) => ({ ...prev, [cacheKey]: data }));
    } catch {
      setSummaryError(t('patientDetail.summaryError'));
    } finally {
      setSummaryLoading(false);
    }
  }

  // The backend has no status filter on this endpoint, so status filtering is
  // applied client-side against the already-fetched page, the same way it
  // works on the Appointments page. The date sort below is also client-side
  // and only reorders within that already-fetched page — it does NOT
  // guarantee "most recent first" across the full history, since sorting
  // happens after the backend has already paginated. There's no sort/orderBy
  // param on this endpoint to request server-side ordering.
  const displayedAppointments = useMemo(
    () =>
      appointments
        .filter((a) => statusFilter.length === 0 || statusFilter.includes(a.status))
        .slice()
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    [appointments, statusFilter],
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link to="/patients" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← {t('patientDetail.backToPatients')}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {patientLoading ? (
        <div className="rounded-2xl bg-white shadow-md p-12 text-center text-sm text-gray-500">
          {t('patientDetail.loading')}
        </div>
      ) : !patient ? null : (
        <>
          <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                {patient.name} {patient.lastName}
              </h1>

              <div className="flex items-center gap-2 shrink-0">
                {summaryLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                <button
                  type="button"
                  onClick={handleLoadSummary}
                  disabled={summaryLoading}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {summaryLoading ? t('patientDetail.generating') : t('patientDetail.summary')}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('common.email')}</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{patient.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('common.phone')}</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{patient.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('common.dateOfBirth')}</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{formatDateOnly(patient.dateOfBirth)}</p>
              </div>
            </div>
          </div>

          {summary && (
            <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('patientDetail.summary')}</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{summary.summary}</p>
            </div>
          )}

          {summaryError && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {summaryError}
            </div>
          )}

          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{t('patientDetail.appointmentHistory')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('patientDetail.appointmentHistorySubtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="historyStatusFilter" className="text-sm font-medium text-gray-600">
                {t('common.status')}
              </label>
              <MultiSelectDropdown
                id="historyStatusFilter"
                options={APPOINTMENT_STATUSES.map((s) => ({ value: s, label: translateStatus(t, s) }))}
                selected={statusFilter}
                onChange={setStatusFilter}
                placeholder={t('appointments.allStatuses')}
              />
            </div>
          </div>

          <DataTable
            columns={[
              { header: t('patientDetail.columnDateTime'), render: (a) => formatDateTime(a.dateTime) },
              { header: t('common.doctor'), render: (a) => a.doctorName ?? t('common.unknownDoctor') },
              {
                header: t('common.status'),
                render: (a) => <Badge color={STATUS_STYLES[a.status].badge}>{translateStatus(t, a.status)}</Badge>,
              },
              { header: t('patientDetail.columnTotalCost'), render: (a) => formatCurrency(a.totalCost) },
            ]}
            rows={displayedAppointments}
            rowKey={(a) => a.id}
            loading={appointmentsLoading}
            emptyMessage={t('patientDetail.noAppointmentsFound')}
            onRowClick={(a) => navigate(`/appointments/${a.id}`)}
            pagination={{
              pageNumber,
              pageSize: APPOINTMENTS_PAGE_SIZE,
              totalCount,
              onPageChange: setPageNumber,
            }}
          />
        </>
      )}
    </div>
  );
}
