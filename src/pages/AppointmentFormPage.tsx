import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getDoctors, getPopularDoctors } from '../api/doctor';
import { getPatients, getPopularPatients } from '../api/patient';
import { getProcedures } from '../api/procedure';
import { getDoctorSchedulesByDoctor } from '../api/doctorSchedule';
import {
  createAppointment,
  createAppointmentProcedure,
  getAppointmentById,
  getFreeSlots,
  updateAppointment,
} from '../api/appointment';
import { ApiError, getErrorMessage } from '../api/apiErrors';
import type { ProcedureListDto } from '../types/procedure';
import type { TimeSlotDto } from '../types/appointment';
import type { DoctorScheduleResponseDto } from '../types/doctorSchedule';
import DatePicker from '../components/DatePicker';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import SearchableSelect from '../components/SearchableSelect';
import type { ProcedureAttachFailure } from '../types/appointment';
import {
  CLINIC_TIME_ZONE,
  addDays,
  clinicLocalDateIso,
  clinicLocalDayStartUtc,
  formatDateIso,
  formatTimeOfDayInZone,
  minutesToDurationString,
  parseDateIso,
  parseDurationToMinutes,
  scheduleWindowsForLocalDate,
  toApiDateTimeString,
  utcDaysForLocalDate,
  workingLocalWeekdays,
} from '../utils/appointmentDateTime';
import { formatCurrency } from '../utils/currency';
import { doctorToOption, patientToOption } from '../utils/searchableSelectOptions';
import { translateDayOfWeek } from '../utils/i18nLabels';

interface FormState {
  doctorId: string;
  patientId: string;
  date: string;
  notes: string;
}

type FormErrors = Partial<
  Record<'doctorId' | 'patientId' | 'date' | 'slot' | 'duration' | 'notes', string>
> & {
  general?: string;
};

const emptyForm: FormState = { doctorId: '', patientId: '', date: '', notes: '' };
const todayIso = clinicLocalDateIso(new Date());

/** A free (or selected) time interval as real instants, independent of which UTC day it was fetched from. */
interface SlotInterval {
  start: Date;
  end: Date;
}

/** Merges a flat list of intervals into contiguous free time ranges. */
function mergeFreeIntervals(slots: SlotInterval[]): SlotInterval[] {
  const parsed = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: SlotInterval[] = [];
  for (const slot of parsed) {
    const last = merged[merged.length - 1];
    if (last && slot.start.getTime() <= last.end.getTime()) {
      if (slot.end.getTime() > last.end.getTime()) {
        last.end = slot.end;
      }
    } else {
      merged.push({ start: slot.start, end: slot.end });
    }
  }
  return merged;
}

export default function AppointmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [procedures, setProcedures] = useState<ProcedureListDto[]>([]);
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [loadingAppointment, setLoadingAppointment] = useState(isEdit);
  const [notEditable, setNotEditable] = useState(false);
  const [initialDoctorLabel, setInitialDoctorLabel] = useState('');
  const [initialPatientLabel, setInitialPatientLabel] = useState('');

  const [doctorSchedules, setDoctorSchedules] = useState<DoctorScheduleResponseDto[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [freeSlots, setFreeSlots] = useState<SlotInterval[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SlotInterval | null>(null);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  const [originalDoctorId, setOriginalDoctorId] = useState<number | null>(null);
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [originalSlot, setOriginalSlot] = useState<SlotInterval | null>(null);

  const loading = loadingOptions || loadingAppointment;

  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);

    getProcedures(1, 100, user!.token)
      .then((procedureData) => {
        if (cancelled) {
          return;
        }
        setProcedures(procedureData.items);
      })
      .catch((err) => {
        if (!cancelled) {
          setFieldErrors((prev) => ({
            ...prev,
            general: getErrorMessage(err),
          }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    let cancelled = false;
    setLoadingAppointment(true);

    getAppointmentById(Number(id), user!.token)
      .then((appt) => {
        if (cancelled) {
          return;
        }

        if (appt.status !== 'Pending') {
          setNotEditable(true);
          return;
        }

        const start = new Date(appt.dateTime);
        const apptDurationMinutes = Math.round(parseDurationToMinutes(appt.duration));
        const end = new Date(start.getTime() + apptDurationMinutes * 60000);
        const slot: SlotInterval = { start, end };
        const dateIso = clinicLocalDateIso(start);

        setForm({
          doctorId: appt.doctor ? String(appt.doctor.id) : '',
          patientId: appt.patient ? String(appt.patient.id) : '',
          date: dateIso,
          notes: appt.notes ?? '',
        });
        setInitialDoctorLabel(
          appt.doctor
            ? `${appt.doctor.firstName ?? ''} ${appt.doctor.lastName ?? ''}${
                appt.doctor.specialization ? ` — ${appt.doctor.specialization}` : ''
              }`.trim()
            : '',
        );
        setInitialPatientLabel(
          appt.patient ? `${appt.patient.name ?? ''} ${appt.patient.lastName ?? ''}`.trim() : '',
        );
        setOriginalDoctorId(appt.doctor?.id ?? null);
        setOriginalDate(dateIso);
        setOriginalSlot(slot);
        setSelectedSlot(slot);
        setDurationHours(String(Math.floor(apptDurationMinutes / 60)));
        setDurationMinutes(String(apptDurationMinutes % 60));
      })
      .catch((err) => {
        if (!cancelled) {
          setFieldErrors((prev) => ({
            ...prev,
            general: getErrorMessage(err),
          }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAppointment(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, user]);

  useEffect(() => {
    if (!form.doctorId) {
      setDoctorSchedules([]);
      return;
    }

    let cancelled = false;
    setLoadingSchedule(true);

    getDoctorSchedulesByDoctor(Number(form.doctorId), user!.token)
      .then((schedules) => {
        if (!cancelled) {
          setDoctorSchedules(schedules);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFieldErrors((prev) => ({
            ...prev,
            general: getErrorMessage(err),
          }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSchedule(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.doctorId, user]);

  useEffect(() => {
    setSlotsError('');

    if (!form.doctorId || !form.date) {
      setFreeSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    const localStart = clinicLocalDayStartUtc(form.date);
    const localEnd = clinicLocalDayStartUtc(formatDateIso(addDays(parseDateIso(form.date), 1)));

    // A clinic-local day can straddle two UTC days, so free slots for it may come from
    // either. A UTC day with no schedule for that weekday throws a business-rule error
    // (see appointment-service-contract.md) rather than returning an empty array — that's
    // expected for the sliver UTC day and shouldn't fail the whole lookup, so it's treated
    // as "no slots from that day" rather than an error.
    Promise.all(
      utcDaysForLocalDate(form.date).map((utcDateIso) =>
        getFreeSlots(Number(form.doctorId), utcDateIso, user!.token).catch((err) => {
          if (err instanceof ApiError) {
            return [] as TimeSlotDto[];
          }
          throw err;
        }),
      ),
    )
      .then((results) => {
        if (cancelled) {
          return;
        }

        const slots = results
          .flat()
          .map((s) => ({
            start: new Date(Math.max(new Date(s.start).getTime(), localStart.getTime())),
            end: new Date(Math.min(new Date(s.end).getTime(), localEnd.getTime())),
          }))
          .filter((s) => s.start.getTime() < s.end.getTime());

        let merged = mergeFreeIntervals(slots);
        if (
          originalSlot &&
          Number(form.doctorId) === originalDoctorId &&
          form.date === originalDate &&
          !merged.some((s) => s.start.getTime() === originalSlot.start.getTime())
        ) {
          merged = mergeFreeIntervals([...merged, originalSlot]);
        }

        setFreeSlots(merged);
        setSelectedSlot((prev) =>
          prev && merged.some((s) => s.start.getTime() === prev.start.getTime()) ? prev : null,
        );
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        // If this doctor/date still matches the appointment being edited, keep its own
        // slot selectable even though the free-slots lookup itself failed — the user
        // should still be able to save without being forced to pick a new time.
        const canFallBackToOriginal =
          originalSlot && Number(form.doctorId) === originalDoctorId && form.date === originalDate;

        if (canFallBackToOriginal) {
          setFreeSlots([originalSlot]);
          setSelectedSlot((prev) => prev ?? originalSlot);
        } else {
          setFreeSlots([]);
          setSlotsError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.doctorId, form.date, user, originalSlot, originalDoctorId, originalDate]);

  // Whenever the selected slot is cleared (doctor/date changed, or the previous
  // selection is no longer valid), clear the duration fields along with it — they
  // were only ever meaningful relative to that start time.
  useEffect(() => {
    if (!selectedSlot) {
      setDurationHours('');
      setDurationMinutes('');
    }
  }, [selectedSlot]);

  function handleDoctorChange(value: string) {
    setForm((prev) => ({ ...prev, doctorId: value, date: '' }));
    setSelectedSlot(null);
  }

  function handleDateChange(value: string) {
    setForm((prev) => ({ ...prev, date: value }));
    setSelectedSlot(null);
  }

  function handleSlotSelect(slot: SlotInterval) {
    setSelectedSlot(slot);
    const totalMinutes = Math.round((slot.end.getTime() - slot.start.getTime()) / 60000);
    setDurationHours(String(Math.floor(totalMinutes / 60)));
    setDurationMinutes(String(totalMinutes % 60));
    setFieldErrors((prev) => ({ ...prev, slot: undefined, duration: undefined }));
  }

  const workingDaysLabel = workingLocalWeekdays(doctorSchedules)
    .map((d) => translateDayOfWeek(t, d))
    .join(', ');

  function isNonWorkingDay(date: Date): boolean {
    return scheduleWindowsForLocalDate(doctorSchedules, formatDateIso(date)).length === 0;
  }

  const customDurationMinutes = (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
  const selectedDateWindows = form.date ? scheduleWindowsForLocalDate(doctorSchedules, form.date) : [];
  const activeScheduleWindow = selectedSlot
    ? selectedDateWindows.find(
        (w) => w.start.getTime() <= selectedSlot.start.getTime() && selectedSlot.start.getTime() < w.end.getTime(),
      )
    : selectedDateWindows[0];
  const durationEndLabel =
    selectedSlot && customDurationMinutes > 0
      ? formatTimeOfDayInZone(
          new Date(selectedSlot.start.getTime() + customDurationMinutes * 60000),
          CLINIC_TIME_ZONE,
        ).slice(0, 5)
      : null;

  function validate(): FormErrors | null {
    const errors: FormErrors = {};

    if (!form.doctorId) {
      errors.doctorId = t('appointmentForm.doctorRequired');
    }
    if (!form.patientId) {
      errors.patientId = t('appointmentForm.patientRequired');
    }
    if (!form.date) {
      errors.date = t('appointmentForm.dateRequired');
    }

    if (!selectedSlot) {
      errors.slot = t('appointmentForm.slotRequired');
    } else {
      const start = selectedSlot.start;

      if (start.getTime() <= Date.now()) {
        errors.slot = t('appointmentForm.slotInFuture');
      }

      if (customDurationMinutes <= 0) {
        errors.duration = t('appointmentForm.durationPositive');
      } else if (customDurationMinutes > 480) {
        errors.duration = t('appointmentForm.durationMax');
      } else {
        const end = new Date(start.getTime() + customDurationMinutes * 60000);

        if (activeScheduleWindow && end.getTime() > activeScheduleWindow.end.getTime()) {
          errors.duration = t('appointmentForm.durationExceedsSchedule', {
            time: formatTimeOfDayInZone(activeScheduleWindow.end, CLINIC_TIME_ZONE).slice(0, 5),
          });
        }

        if (!errors.duration) {
          const fits = freeSlots.some(
            (iv) => iv.start.getTime() <= start.getTime() && end.getTime() <= iv.end.getTime(),
          );
          if (!fits) {
            errors.duration = t('appointmentForm.durationOverlap');
          }
        }
      }
    }

    if (form.notes.length > 500) {
      errors.notes = t('appointmentForm.notesMaxLength');
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors = validate();
    if (errors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      const start = selectedSlot!.start;

      const payload = {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        dateTime: toApiDateTimeString(start),
        duration: minutesToDurationString(customDurationMinutes),
        notes: form.notes.trim() || undefined,
      };

      if (isEdit) {
        await updateAppointment({ id: Number(id), ...payload }, user!.token);
        navigate('/appointments', { replace: true });
        return;
      }

      const created = await createAppointment(payload, user!.token);

      // Attach procedures one at a time (not in parallel) so a failure can be
      // attributed to a specific procedure. A failure here doesn't roll back the
      // appointment — it's surfaced as a banner on the detail page instead.
      const procedureFailures: ProcedureAttachFailure[] = [];
      for (const procedureIdStr of selectedProcedureIds) {
        const procedureId = Number(procedureIdStr);
        try {
          await createAppointmentProcedure({ appointmentId: created.id, procedureId }, user!.token);
        } catch (attachErr) {
          const procedureName =
            procedures.find((p) => p.id === procedureId)?.name ?? `Procedure #${procedureId}`;
          procedureFailures.push({ procedureName, message: getErrorMessage(attachErr) });
        }
      }

      navigate(`/appointments/${created.id}`, {
        replace: true,
        state: procedureFailures.length > 0 ? { procedureFailures } : undefined,
      });
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const mapped: FormErrors = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          const key = field.charAt(0).toLowerCase() + field.slice(1);
          if (key === 'doctorId' || key === 'patientId' || key === 'notes') {
            mapped[key as 'doctorId' | 'patientId' | 'notes'] = messages[0];
          } else if (key === 'dateTime') {
            mapped.slot = messages[0];
          } else if (key === 'duration') {
            mapped.duration = messages[0];
          } else {
            mapped.general = messages[0];
          }
        }
        setFieldErrors((prev) => ({ ...prev, ...mapped }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          general: getErrorMessage(err),
        }));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEdit ? t('appointmentForm.editTitle') : t('appointmentForm.newTitle')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? t('appointmentForm.editSubtitle') : t('appointmentForm.newSubtitle')}
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-md p-8">
        {fieldErrors.general && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {fieldErrors.general}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">{t('common.loading')}</div>
        ) : notEditable ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              {t('appointmentForm.notEditable')}
            </p>
            <Link to="/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              ← {t('appointments.backToAppointments')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="doctorId">
                  {t('common.doctor')}
                </label>
                <SearchableSelect
                  id="doctorId"
                  value={form.doctorId ? Number(form.doctorId) : null}
                  onChange={(value) => handleDoctorChange(value == null ? '' : String(value))}
                  fetchOptions={(search) =>
                    getDoctors(1, 100, user!.token, search).then((data) => data.items.map(doctorToOption))
                  }
                  fetchPopularOptions={() =>
                    getPopularDoctors(5, user!.token).then((doctors) => doctors.map(doctorToOption))
                  }
                  placeholder={t('appointmentForm.searchDoctor')}
                  initialLabel={initialDoctorLabel}
                  hasError={Boolean(fieldErrors.doctorId)}
                />
                {fieldErrors.doctorId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.doctorId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">
                  {t('common.date')}
                </label>
                <DatePicker
                  id="date"
                  value={form.date}
                  onChange={handleDateChange}
                  min={todayIso}
                  isDayDisabled={isNonWorkingDay}
                  disabled={!form.doctorId || loadingSchedule}
                  hasError={Boolean(fieldErrors.date)}
                  placeholder={
                    !form.doctorId
                      ? t('appointmentForm.selectDoctorFirst')
                      : loadingSchedule
                        ? t('appointmentForm.loadingSchedule')
                        : t('common.selectDate')
                  }
                />
                {fieldErrors.date ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>
                ) : (
                  form.doctorId &&
                  !loadingSchedule && (
                    <p className="mt-1 text-xs text-gray-500">
                      {doctorSchedules.length > 0
                        ? t('appointmentForm.worksLabel', { days: workingDaysLabel })
                        : t('appointmentForm.noWeeklySchedule')}
                    </p>
                  )
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patientId">
                {t('common.patient')}
              </label>
              <SearchableSelect
                id="patientId"
                value={form.patientId ? Number(form.patientId) : null}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, patientId: value == null ? '' : String(value) }))
                }
                fetchOptions={(search) =>
                  getPatients(1, 100, user!.token, search).then((data) => data.items.map(patientToOption))
                }
                fetchPopularOptions={() =>
                  getPopularPatients(5, user!.token).then((patients) => patients.map(patientToOption))
                }
                placeholder={t('appointmentForm.searchPatient')}
                initialLabel={initialPatientLabel}
                hasError={Boolean(fieldErrors.patientId)}
              />
              {fieldErrors.patientId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.patientId}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('appointmentForm.startTime')}</label>

              {!form.doctorId || !form.date ? (
                <p className="text-sm text-gray-400">{t('appointmentForm.selectDoctorAndDate')}</p>
              ) : loadingSlots ? (
                <p className="text-sm text-gray-500">{t('appointmentForm.loadingSlots')}</p>
              ) : slotsError ? (
                <p className="text-sm text-red-600">{slotsError}</p>
              ) : freeSlots.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {t('appointmentForm.noFreeSlots')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {freeSlots.map((slot) => {
                    const { start, end } = slot;
                    const isSelected = selectedSlot != null && selectedSlot.start.getTime() === start.getTime();
                    const label = `${formatTimeOfDayInZone(start, CLINIC_TIME_ZONE).slice(0, 5)}–${formatTimeOfDayInZone(end, CLINIC_TIME_ZONE).slice(0, 5)}`;

                    return (
                      <button
                        key={start.getTime()}
                        type="button"
                        onClick={() => handleSlotSelect(slot)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              {fieldErrors.slot && <p className="mt-2 text-xs text-red-600">{fieldErrors.slot}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('appointmentForm.duration')}</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <input
                    id="durationHours"
                    type="number"
                    min={0}
                    max={8}
                    step={1}
                    value={durationHours}
                    disabled={!selectedSlot}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className={`w-16 rounded-lg border px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                      fieldErrors.duration ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <label htmlFor="durationHours" className="text-sm text-gray-500">
                    {t('appointmentForm.hoursAbbrev')}
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id="durationMinutes"
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={durationMinutes}
                    disabled={!selectedSlot}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className={`w-16 rounded-lg border px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                      fieldErrors.duration ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <label htmlFor="durationMinutes" className="text-sm text-gray-500">
                    {t('appointmentForm.minutesAbbrev')}
                  </label>
                </div>
                {durationEndLabel && (
                  <span className="text-sm text-gray-500">{t('appointmentForm.endsAt', { time: durationEndLabel })}</span>
                )}
              </div>
              {fieldErrors.duration ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.duration}</p>
              ) : (
                activeScheduleWindow && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('appointmentForm.scheduledUntil', {
                      time: formatTimeOfDayInZone(activeScheduleWindow.end, CLINIC_TIME_ZONE).slice(0, 5),
                    })}
                  </p>
                )
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="notes">
                  {t('common.notes')} <span className="text-gray-400 font-normal">{t('common.optional')}</span>
                </label>
                <span className="text-xs text-gray-400">{form.notes.length}/500</span>
              </div>
              <textarea
                id="notes"
                rows={3}
                maxLength={500}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.notes ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {fieldErrors.notes && <p className="mt-1 text-xs text-red-600">{fieldErrors.notes}</p>}
            </div>

            {!isEdit && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="procedures">
                  {t('common.procedures')} <span className="text-gray-400 font-normal">{t('common.optional')}</span>
                </label>
                <MultiSelectDropdown
                  id="procedures"
                  options={procedures.map((p) => ({
                    value: String(p.id),
                    label: `${p.name} — ${formatCurrency(p.price)}`,
                  }))}
                  selected={selectedProcedureIds}
                  onChange={setSelectedProcedureIds}
                  placeholder={t('appointmentForm.noProceduresSelected')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('appointmentForm.proceduresHint')}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link
                to="/appointments"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : t('appointmentForm.createAppointment')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
