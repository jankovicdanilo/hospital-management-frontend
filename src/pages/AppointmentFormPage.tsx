import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import type { DayOfWeek, DoctorScheduleResponseDto } from '../types/doctorSchedule';
import DatePicker from '../components/DatePicker';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import SearchableSelect from '../components/SearchableSelect';
import type { ProcedureAttachFailure } from '../types/appointment';
import {
  CLINIC_TIME_ZONE,
  formatDateIso,
  formatTimeOfDayInZone,
  minutesToDurationString,
  parseDurationToMinutes,
  parseSlotTime,
  toApiDateTimeString,
} from '../utils/appointmentDateTime';
import { formatCurrency } from '../utils/currency';
import { doctorToOption, patientToOption } from '../utils/searchableSelectOptions';

const JS_DAY_TO_NAME: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const WEEK_ORDER: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

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
const todayIso = formatDateIso(new Date());

function weekdayOfIsoDate(iso: string): DayOfWeek {
  const [y, m, d] = iso.split('-').map(Number);
  return JS_DAY_TO_NAME[new Date(y, m - 1, d).getDay()];
}

// TimeSlotDto entries from getFreeSlots are bare clinic-local "HH:mm:ss" time-of-day
// strings (parseSlotTime's non-"T" branch), not absolute timestamps. The
// injected slot for the appointment being edited must use the same
// representation — otherwise it gets parsed as an absolute UTC instant while
// every other slot is parsed as clinic-local wall-clock time, and the two can
// silently disagree once converted to milliseconds via parseSlotTime. Extracting
// wall-clock components from the Date directly would use the browser's ambient
// timezone instead, so this goes through the clinic timezone explicitly.
function toClinicTimeOfDay(date: Date): string {
  return formatTimeOfDayInZone(date, CLINIC_TIME_ZONE);
}

/** Merges a flat list of free slots into contiguous free time ranges. */
function mergeFreeIntervals(slots: TimeSlotDto[], dateIso: string): { start: Date; end: Date }[] {
  const parsed = slots
    .map((s) => ({ start: parseSlotTime(dateIso, s.start), end: parseSlotTime(dateIso, s.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: { start: Date; end: Date }[] = [];
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

  const [freeSlots, setFreeSlots] = useState<TimeSlotDto[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDto | null>(null);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  const [originalDoctorId, setOriginalDoctorId] = useState<number | null>(null);
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [originalSlot, setOriginalSlot] = useState<TimeSlotDto | null>(null);

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
        const slot: TimeSlotDto = { start: toClinicTimeOfDay(start), end: toClinicTimeOfDay(end) };
        const dateIso = formatDateIso(start);

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

    getFreeSlots(Number(form.doctorId), form.date, user!.token)
      .then((slots) => {
        if (cancelled) {
          return;
        }

        let merged = slots;
        if (
          originalSlot &&
          Number(form.doctorId) === originalDoctorId &&
          form.date === originalDate &&
          !slots.some(
            (s) =>
              parseSlotTime(form.date, s.start).getTime() ===
              parseSlotTime(form.date, originalSlot.start).getTime(),
          )
        ) {
          merged = [...slots, originalSlot].sort(
            (a, b) =>
              parseSlotTime(form.date, a.start).getTime() - parseSlotTime(form.date, b.start).getTime(),
          );
        }

        setFreeSlots(merged);
        setSelectedSlot((prev) =>
          prev &&
          merged.some(
            (s) => parseSlotTime(form.date, s.start).getTime() === parseSlotTime(form.date, prev.start).getTime(),
          )
            ? prev
            : null,
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

  function handleSlotSelect(slot: TimeSlotDto) {
    setSelectedSlot(slot);
    const start = parseSlotTime(form.date, slot.start);
    const end = parseSlotTime(form.date, slot.end);
    const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    setDurationHours(String(Math.floor(totalMinutes / 60)));
    setDurationMinutes(String(totalMinutes % 60));
    setFieldErrors((prev) => ({ ...prev, slot: undefined, duration: undefined }));
  }

  const workingDays = new Set(doctorSchedules.map((s) => s.dayOfWeek));
  const workingDaysLabel = WEEK_ORDER.filter((d) => workingDays.has(d)).join(', ');

  function isNonWorkingDay(date: Date): boolean {
    return !workingDays.has(JS_DAY_TO_NAME[date.getDay()]);
  }

  const customDurationMinutes = (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
  const selectedDaySchedule = form.date
    ? doctorSchedules.find((s) => s.dayOfWeek === weekdayOfIsoDate(form.date))
    : undefined;
  const durationEndLabel =
    selectedSlot && customDurationMinutes > 0
      ? formatTimeOfDayInZone(
          new Date(parseSlotTime(form.date, selectedSlot.start).getTime() + customDurationMinutes * 60000),
          CLINIC_TIME_ZONE,
        ).slice(0, 5)
      : null;

  function validate(): FormErrors | null {
    const errors: FormErrors = {};

    if (!form.doctorId) {
      errors.doctorId = 'Doctor is required.';
    }
    if (!form.patientId) {
      errors.patientId = 'Patient is required.';
    }
    if (!form.date) {
      errors.date = 'Date is required.';
    }

    if (!selectedSlot) {
      errors.slot = 'A time slot is required.';
    } else {
      const start = parseSlotTime(form.date, selectedSlot.start);

      if (start.getTime() <= Date.now()) {
        errors.slot = 'The selected date and time must be in the future.';
      }

      if (customDurationMinutes <= 0) {
        errors.duration = 'Duration must be greater than 0.';
      } else if (customDurationMinutes > 480) {
        errors.duration = 'Duration cannot exceed 8 hours.';
      } else {
        const end = new Date(start.getTime() + customDurationMinutes * 60000);
        const daySchedule = doctorSchedules.find((s) => s.dayOfWeek === weekdayOfIsoDate(form.date));

        if (daySchedule) {
          const scheduleEnd = parseSlotTime(form.date, `${String(daySchedule.endHour).padStart(2, '0')}:00:00`);

          if (end.getTime() > scheduleEnd.getTime()) {
            errors.duration = `This doctor is only scheduled until ${daySchedule.endHour}:00 that day — reduce the duration or pick an earlier slot.`;
          }
        }

        if (!errors.duration) {
          const merged = mergeFreeIntervals(freeSlots, form.date);
          const fits = merged.some(
            (iv) => iv.start.getTime() <= start.getTime() && end.getTime() <= iv.end.getTime(),
          );
          if (!fits) {
            errors.duration =
              'This duration overlaps another appointment for this doctor. Choose a shorter duration or a different slot.';
          }
        }
      }
    }

    if (form.notes.length > 500) {
      errors.notes = 'Notes cannot exceed 500 characters.';
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
      const start = parseSlotTime(form.date, selectedSlot!.start);

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
          {isEdit ? 'Edit Appointment' : 'New Appointment'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? 'Update the appointment below.' : 'Schedule a new appointment.'}
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-md p-8">
        {fieldErrors.general && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {fieldErrors.general}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
        ) : notEditable ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Only pending appointments can be edited. This appointment can no longer be changed.
            </p>
            <Link to="/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              ← Back to Appointments
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="doctorId">
                  Doctor
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
                  placeholder="Search for a doctor…"
                  initialLabel={initialDoctorLabel}
                  hasError={Boolean(fieldErrors.doctorId)}
                />
                {fieldErrors.doctorId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.doctorId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">
                  Date
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
                      ? 'Select a doctor first…'
                      : loadingSchedule
                        ? 'Loading schedule…'
                        : 'Select a date…'
                  }
                />
                {fieldErrors.date ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>
                ) : (
                  form.doctorId &&
                  !loadingSchedule && (
                    <p className="mt-1 text-xs text-gray-500">
                      {workingDays.size > 0
                        ? `Works: ${workingDaysLabel}`
                        : 'No weekly schedule on file for this doctor.'}
                    </p>
                  )
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patientId">
                Patient
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
                placeholder="Search for a patient…"
                initialLabel={initialPatientLabel}
                hasError={Boolean(fieldErrors.patientId)}
              />
              {fieldErrors.patientId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.patientId}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>

              {!form.doctorId || !form.date ? (
                <p className="text-sm text-gray-400">Select a doctor and date to see available slots.</p>
              ) : loadingSlots ? (
                <p className="text-sm text-gray-500">Loading available slots…</p>
              ) : slotsError ? (
                <p className="text-sm text-red-600">{slotsError}</p>
              ) : freeSlots.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No free slots for this doctor on this date. The doctor may not have a schedule for that
                  day.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {freeSlots.map((slot) => {
                    const start = parseSlotTime(form.date, slot.start);
                    const end = parseSlotTime(form.date, slot.end);
                    const isSelected =
                      selectedSlot != null &&
                      parseSlotTime(form.date, selectedSlot.start).getTime() === start.getTime();
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
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
                    hr
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
                    min
                  </label>
                </div>
                {durationEndLabel && (
                  <span className="text-sm text-gray-500">Ends at {durationEndLabel}</span>
                )}
              </div>
              {fieldErrors.duration ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.duration}</p>
              ) : (
                selectedDaySchedule && (
                  <p className="mt-1 text-xs text-gray-500">
                    Doctor is scheduled until {selectedDaySchedule.endHour}:00 that day.
                  </p>
                )
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="notes">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
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
                  Procedures <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <MultiSelectDropdown
                  id="procedures"
                  options={procedures.map((p) => ({
                    value: String(p.id),
                    label: `${p.name} — ${formatCurrency(p.price)}`,
                  }))}
                  selected={selectedProcedureIds}
                  onChange={setSelectedProcedureIds}
                  placeholder="No procedures selected"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Selected procedures are attached once the appointment is created.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link
                to="/appointments"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
