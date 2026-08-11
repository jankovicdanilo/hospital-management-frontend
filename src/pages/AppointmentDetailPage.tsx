import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteAppointment, getAppointmentById } from '../api/appointment';
import type { AppointmentResponseDto } from '../types/appointment';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { STATUS_STYLES } from '../utils/appointmentStatus';
import { formatDurationLabel } from '../utils/appointmentDateTime';

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const appointmentId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAppointmentById(appointmentId, user!.token);
      setAppointment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, user]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  async function handleConfirmDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteAppointment(appointmentId, user!.token);
      navigate('/appointments', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const doctorName = appointment?.doctor
    ? `${appointment.doctor.firstName ?? ''} ${appointment.doctor.lastName ?? ''}`.trim() || 'Unknown doctor'
    : 'Unknown doctor';
  const patientName = appointment?.patient
    ? `${appointment.patient.name ?? ''} ${appointment.patient.lastName ?? ''}`.trim() || 'Unknown patient'
    : 'Unknown patient';

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link to="/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to Appointments
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white shadow-md p-12 text-center text-sm text-gray-500">
          Loading appointment…
        </div>
      ) : !appointment ? null : (
        <>
          <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-gray-800">
                    {new Date(appointment.dateTime).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </h1>
                  <Badge color={STATUS_STYLES[appointment.status].badge}>{appointment.status}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Duration: {formatDurationLabel(appointment.duration)}
                </p>
              </div>

              <div className="flex gap-3">
                {appointment.status === 'Pending' && (
                  <Link
                    to={`/appointments/${appointment.id}/edit`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Doctor</p>
                <div className="flex items-center gap-3">
                  <Avatar name={doctorName} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doctorName}</p>
                    {appointment.doctor?.specialization && (
                      <p className="text-xs text-gray-500">{appointment.doctor.specialization}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Patient</p>
                <div className="flex items-center gap-3">
                  <Avatar name={patientName} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{patientName}</p>
                    {appointment.patient?.email && (
                      <p className="text-xs text-gray-500">{appointment.patient.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Notes</p>
              <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                {appointment.notes || <span className="text-gray-400">No notes</span>}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Procedures Performed</h2>
            {appointment.procedures.length === 0 ? (
              <p className="text-sm text-gray-400">No procedures recorded.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {appointment.procedures.map((proc) => (
                  <div key={proc.procedureId} className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-800">{proc.procedureName}</span>
                    <span className="text-sm text-gray-600">${proc.procedurePrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Discount</span>
              <span className="text-sm text-gray-800">{appointment.discount}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Cost</span>
              <span className="text-sm font-semibold text-gray-900">${appointment.totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-md p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Treatment</h2>
            {appointment.treatment ? (
              <div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {appointment.treatment.description}
                </p>
                {appointment.treatment.medication && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Medication: </span>
                    {appointment.treatment.medication}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No treatment recorded.</p>
            )}
          </div>
        </>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete appointment?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently remove this appointment. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
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
