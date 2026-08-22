import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPatientById } from '../api/patient';
import { getAppointmentsByPatient } from '../api/appointment';
import { getErrorMessage } from '../api/apiErrors';
import type { PatientGetByIdDto } from '../types/patient';
import type { AppointmentListResponseDto } from '../types/appointment';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { APPOINTMENT_STATUSES, STATUS_STYLES } from '../utils/appointmentStatus';
import { formatCurrency } from '../utils/currency';

function formatDateOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateTime: string): string {
  return new Date(dateTime).toLocaleString(undefined, {
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

  const [patient, setPatient] = useState<PatientGetByIdDto | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState<AppointmentListResponseDto[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

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

  // The backend has no status filter on this endpoint, so status filtering is
  // applied client-side against the already-fetched page, the same way it
  // works on the Appointments page. Sorting is also done client-side since
  // the backend's ordering for this endpoint isn't guaranteed.
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
          ← Back to Patients
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {patientLoading ? (
        <div className="rounded-2xl bg-white shadow-md p-12 text-center text-sm text-gray-500">
          Loading patient…
        </div>
      ) : !patient ? null : (
        <>
          <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              {patient.name} {patient.lastName}
            </h1>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{patient.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{patient.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Date of Birth</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{formatDateOnly(patient.dateOfBirth)}</p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Appointment History</h2>
              <p className="text-sm text-gray-500 mt-1">All appointments booked for this patient.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="historyStatusFilter" className="text-sm font-medium text-gray-600">
                Status
              </label>
              <MultiSelectDropdown
                id="historyStatusFilter"
                options={APPOINTMENT_STATUSES.map((s) => ({ value: s, label: s }))}
                selected={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Statuses"
              />
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'Date & Time', render: (a) => formatDateTime(a.dateTime) },
              { header: 'Doctor', render: (a) => a.doctorName ?? 'Unknown doctor' },
              {
                header: 'Status',
                render: (a) => <Badge color={STATUS_STYLES[a.status].badge}>{a.status}</Badge>,
              },
              { header: 'Total Cost', render: (a) => formatCurrency(a.totalCost) },
            ]}
            rows={displayedAppointments}
            rowKey={(a) => a.id}
            loading={appointmentsLoading}
            emptyMessage="No appointments found."
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
