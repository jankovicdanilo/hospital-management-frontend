import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { deleteAppointment, getAppointmentById } from '../api/appointment';
import { downloadInvoice, type InvoiceFormat } from '../api/invoice';
import { getErrorMessage } from '../api/apiErrors';
import type { AppointmentResponseDto, ProcedureAttachFailure } from '../types/appointment';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { STATUS_STYLES } from '../utils/appointmentStatus';
import { formatDurationParts } from '../utils/appointmentDateTime';
import { formatCurrency } from '../utils/currency';
import { translateStatus } from '../utils/i18nLabels';

function buildInvoiceFilename(patientName: string, format: InvoiceFormat): string {
  const sanitized = patientName.trim().replace(/\s+/g, '_');
  return sanitized ? `${sanitized}.${format}` : `invoice.${format}`;
}

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const appointmentId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [procedureFailures, setProcedureFailures] = useState<ProcedureAttachFailure[]>(
    (location.state as { procedureFailures?: ProcedureAttachFailure[] } | null)?.procedureFailures ?? [],
  );
  const [appointment, setAppointment] = useState<AppointmentResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [invoiceFormat, setInvoiceFormat] = useState<InvoiceFormat>('pdf');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAppointmentById(appointmentId, user!.token);
      setAppointment(data);
    } catch (err) {
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const doctorName = appointment?.doctor
    ? `${appointment.doctor.firstName ?? ''} ${appointment.doctor.lastName ?? ''}`.trim() || t('common.unknownDoctor')
    : t('common.unknownDoctor');
  const rawPatientName = appointment?.patient
    ? `${appointment.patient.name ?? ''} ${appointment.patient.lastName ?? ''}`.trim()
    : '';
  const patientName = rawPatientName || t('common.unknownPatient');

  async function handleDownloadInvoice() {
    if (!appointment) {
      return;
    }
    setDownloadingInvoice(true);
    setError('');
    try {
      const blob = await downloadInvoice(appointment.id, invoiceFormat, i18n.language, user!.token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildInvoiceFilename(rawPatientName, invoiceFormat);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloadingInvoice(false);
    }
  }

  const durationParts = appointment ? formatDurationParts(appointment.duration) : null;
  const durationLabel = durationParts
    ? durationParts.hours === 0
      ? t('common.durationMinutes', { m: durationParts.minutes })
      : durationParts.minutes === 0
        ? t('common.durationHours', { h: durationParts.hours })
        : t('common.durationHoursMinutes', { h: durationParts.hours, m: durationParts.minutes })
    : '';

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link to="/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← {t('appointments.backToAppointments')}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {procedureFailures.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {t('appointmentDetail.attachFailuresIntro', { count: procedureFailures.length })}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {procedureFailures.map((failure, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{failure.procedureName}</span> — {failure.message}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-amber-700">{t('appointmentDetail.retryHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setProcedureFailures([])}
              aria-label={t('common.dismiss')}
              className="text-amber-500 hover:text-amber-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white shadow-md p-12 text-center text-sm text-gray-500">
          {t('appointmentDetail.loading')}
        </div>
      ) : !appointment ? null : (
        <>
          <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
            <div className="flex items-start justify-between gap-4">
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
                  <Badge color={STATUS_STYLES[appointment.status].badge}>
                    {translateStatus(t, appointment.status)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t('appointmentDetail.durationLabel', { duration: durationLabel })}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {appointment.status === 'Completed' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={invoiceFormat}
                      onChange={(e) => setInvoiceFormat(e.target.value as InvoiceFormat)}
                      disabled={downloadingInvoice}
                      aria-label={t('appointmentDetail.invoiceFormatLabel')}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      <option value="pdf">PDF</option>
                      <option value="docx">DOCX</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleDownloadInvoice()}
                      disabled={downloadingInvoice}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      {downloadingInvoice ? t('appointmentDetail.downloading') : t('appointmentDetail.downloadInvoice')}
                    </button>
                  </div>
                )}
                {appointment.status === 'Pending' && (
                  <Link
                    to={`/appointments/${appointment.id}/edit`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('common.edit')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">{t('common.doctor')}</p>
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
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">{t('common.patient')}</p>
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
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('common.notes')}</p>
              <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                {appointment.notes || <span className="text-gray-400">{t('appointmentDetail.noNotes')}</span>}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('appointmentDetail.proceduresPerformed')}</h2>
            {appointment.procedures.length === 0 ? (
              <p className="text-sm text-gray-400">{t('appointmentDetail.noProceduresRecorded')}</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {appointment.procedures.map((proc) => (
                  <div key={proc.procedureId} className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-800">{proc.procedureName}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(proc.procedurePrice)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('appointmentDetail.discount')}</span>
              <span className="text-sm text-gray-800">{formatCurrency(appointment.discount)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t('appointmentDetail.totalCost')}</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(appointment.totalCost)}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-md p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('appointmentDetail.treatment')}</h2>
            {appointment.treatment ? (
              <div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {appointment.treatment.description}
                </p>
                {appointment.treatment.medication && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">{t('appointmentDetail.medication')} </span>
                    {appointment.treatment.medication}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t('appointmentDetail.noTreatmentRecorded')}</p>
            )}
          </div>
        </>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('appointmentDetail.deleteTitle')}</h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('appointmentDetail.deleteBody')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
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
