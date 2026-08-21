import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoctorById } from '../api/doctor';
import {
  createDoctorSchedule,
  deleteDoctorSchedule,
  getDoctorSchedulesByDoctor,
  updateDoctorSchedule,
} from '../api/doctorSchedule';
import { ApiError, getErrorMessage } from '../api/apiErrors';
import type { DoctorResponseDto } from '../types/doctor';
import type { DayOfWeek, DoctorScheduleResponseDto } from '../types/doctorSchedule';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';

const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ScheduleFormState {
  startHour: string;
  endHour: string;
}

type ScheduleFormErrors = Partial<Record<'startHour' | 'endHour', string>> & { general?: string };

const emptyScheduleForm: ScheduleFormState = { startHour: '', endHour: '' };

function formatHour(hour: number): string {
  return `${hour}:00`;
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const doctorId = Number(id);
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<DoctorResponseDto | null>(null);
  const [schedules, setSchedules] = useState<DoctorScheduleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(emptyScheduleForm);
  const [formErrors, setFormErrors] = useState<ScheduleFormErrors>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<DoctorScheduleResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [doctorData, scheduleData] = await Promise.all([
        getDoctorById(doctorId, user!.token),
        getDoctorSchedulesByDoctor(doctorId, user!.token),
      ]);
      setDoctor(doctorData);
      setSchedules(scheduleData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [doctorId, user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function scheduleForDay(day: DayOfWeek): DoctorScheduleResponseDto | undefined {
    return schedules.find((s) => s.dayOfWeek === day);
  }

  function startAdd(day: DayOfWeek) {
    setEditingDay(day);
    setForm(emptyScheduleForm);
    setFormErrors({});
  }

  function startEdit(schedule: DoctorScheduleResponseDto) {
    setEditingDay(schedule.dayOfWeek);
    setForm({ startHour: String(schedule.startHour), endHour: String(schedule.endHour) });
    setFormErrors({});
  }

  function cancelEdit() {
    setEditingDay(null);
    setForm(emptyScheduleForm);
    setFormErrors({});
  }

  function validate(): ScheduleFormErrors | null {
    const errors: ScheduleFormErrors = {};
    const start = Number(form.startHour);
    const end = Number(form.endHour);

    if (!form.startHour.trim() || Number.isNaN(start)) {
      errors.startHour = 'Start hour is required.';
    } else if (start < 8 || start > 19) {
      errors.startHour = 'Start hour must be between 8 and 19.';
    }

    if (!form.endHour.trim() || Number.isNaN(end)) {
      errors.endHour = 'End hour is required.';
    } else if (end < 9 || end > 20) {
      errors.endHour = 'End hour must be between 9 and 20.';
    }

    if (!errors.startHour && !errors.endHour && end <= start) {
      errors.endHour = 'End hour must be after start hour.';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  async function handleSubmit(e: FormEvent, day: DayOfWeek) {
    e.preventDefault();

    const errors = validate();
    if (errors) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    const existing = scheduleForDay(day);

    try {
      if (existing) {
        await updateDoctorSchedule(
          {
            id: existing.id,
            dayOfWeek: day,
            startHour: Number(form.startHour),
            endHour: Number(form.endHour),
          },
          user!.token,
        );
      } else {
        await createDoctorSchedule(
          {
            doctorId,
            dayOfWeek: day,
            startHour: Number(form.startHour),
            endHour: Number(form.endHour),
          },
          user!.token,
        );
      }

      cancelEdit();
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const mapped: ScheduleFormErrors = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          const key = field.charAt(0).toLowerCase() + field.slice(1);
          if (key === 'startHour' || key === 'endHour') {
            mapped[key] = messages[0];
          }
        }
        setFormErrors(Object.keys(mapped).length > 0 ? mapped : { general: err.message });
      } else {
        setFormErrors({
          general: getErrorMessage(err),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await deleteDoctorSchedule(pendingDelete.id, user!.token);
      setPendingDelete(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link to="/doctors" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to Doctors
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white shadow-md p-12 text-center text-sm text-gray-500">
          Loading doctor…
        </div>
      ) : !doctor ? null : (
        <>
          <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
            <div className="flex items-center gap-4">
              <Avatar name={`${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`} size="lg" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  {doctor.firstName ?? '—'} {doctor.lastName ?? ''}
                </h1>
                {doctor.specialization && (
                  <div className="mt-1.5">
                    <Badge color="blue">{doctor.specialization}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{doctor.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{doctor.phone ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Weekly Schedule</h2>
            <p className="text-sm text-gray-500 mt-1">Working hours by day of the week.</p>
          </div>

          <div className="rounded-2xl bg-white shadow-md overflow-hidden">
            <div className="divide-y divide-gray-100">
              {WEEKDAYS.map((day) => {
                const schedule = scheduleForDay(day);
                const isEditing = editingDay === day;

                return (
                  <div key={day} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-800">{day}</p>
                        {!isEditing &&
                          (schedule ? (
                            <p className="text-sm text-gray-600 mt-0.5">
                              {formatHour(schedule.startHour)}–{formatHour(schedule.endHour)}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 mt-0.5">Not scheduled</p>
                          ))}
                      </div>

                      {!isEditing && (
                        <div className="flex gap-2 shrink-0">
                          {schedule ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(schedule)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDelete(schedule)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startAdd(day)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Add Schedule
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <form
                        onSubmit={(e) => handleSubmit(e, day)}
                        noValidate
                        className="mt-4 rounded-lg bg-gray-50 p-4"
                      >
                        {formErrors.general && (
                          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                            {formErrors.general}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              className="block text-xs font-medium text-gray-700 mb-1"
                              htmlFor={`start-${day}`}
                            >
                              Start Hour
                            </label>
                            <input
                              id={`start-${day}`}
                              type="number"
                              min={8}
                              max={19}
                              value={form.startHour}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, startHour: e.target.value }))
                              }
                              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.startHour
                                  ? 'border-red-400 bg-red-50'
                                  : 'border-gray-300 bg-white'
                              }`}
                            />
                            {formErrors.startHour && (
                              <p className="mt-1 text-xs text-red-600">{formErrors.startHour}</p>
                            )}
                          </div>

                          <div>
                            <label
                              className="block text-xs font-medium text-gray-700 mb-1"
                              htmlFor={`end-${day}`}
                            >
                              End Hour
                            </label>
                            <input
                              id={`end-${day}`}
                              type="number"
                              min={9}
                              max={20}
                              value={form.endHour}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, endHour: e.target.value }))
                              }
                              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.endHour
                                  ? 'border-red-400 bg-red-50'
                                  : 'border-gray-300 bg-white'
                              }`}
                            />
                            {formErrors.endHour && (
                              <p className="mt-1 text-xs text-red-600">{formErrors.endHour}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Remove schedule?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will remove the{' '}
              <span className="font-medium text-gray-800">{pendingDelete.dayOfWeek}</span>{' '}
              schedule for this doctor. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
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
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
