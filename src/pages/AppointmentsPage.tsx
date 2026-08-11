import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../api/doctor';
import { getAppointmentsByWeek, updateAppointmentStatus } from '../api/appointment';
import type { AppointmentListResponseDto } from '../types/appointment';
import type { DoctorResponseDto } from '../types/doctor';
import { APPOINTMENT_STATUSES, STATUS_STYLES } from '../utils/appointmentStatus';
import { addDays, formatDateIso, getMonday, parseDurationToMinutes } from '../utils/appointmentDateTime';

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 20;
const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const HOUR_HEIGHT = 88;
// Tall enough to fit a block's 3 text lines (time, doctor, patient) plus the
// status control / View link row without clipping, even for a short appointment.
const MIN_BLOCK_HEIGHT = 84;
// The time-equivalent of MIN_BLOCK_HEIGHT. A block shorter than this renders
// taller than its real duration, so two back-to-back short appointments in
// the same column would visually collide even though they don't overlap in
// time. Column assignment below treats every block as occupying at least
// this many minutes so it never places two such blocks in the same column.
const MIN_BLOCK_MINUTES = Math.ceil((MIN_BLOCK_HEIGHT / HOUR_HEIGHT) * 60);
// Cap how many appointments render side by side in a single overlap cluster.
// Beyond this, the rest collapse into a single "+N more" chip — otherwise a
// busy slot with many overlapping appointments would shrink every column to
// an unreadable sliver.
const MAX_VISIBLE_COLUMNS = 3;

interface PositionedAppointment {
  type: 'appointment';
  appt: AppointmentListResponseDto;
  startMinutes: number;
  endMinutes: number;
  column: number;
  totalColumns: number;
}

interface PositionedOverflow {
  type: 'overflow';
  appts: AppointmentListResponseDto[];
  startMinutes: number;
  endMinutes: number;
  column: number;
  totalColumns: number;
}

type PositionedItem = PositionedAppointment | PositionedOverflow;

function formatTimeRange(appt: AppointmentListResponseDto): string {
  const start = new Date(appt.dateTime);
  const end = new Date(start.getTime() + parseDurationToMinutes(appt.duration) * 60000);
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(start)}–${fmt(end)}`;
}

function layoutDay(appointments: AppointmentListResponseDto[]): PositionedItem[] {
  const items = appointments
    .map((appt) => {
      const start = new Date(appt.dateTime);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = startMinutes + parseDurationToMinutes(appt.duration);
      const layoutEndMinutes = Math.max(endMinutes, startMinutes + MIN_BLOCK_MINUTES);
      return { appt, startMinutes, endMinutes, layoutEndMinutes };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const clusters: (typeof items)[] = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -Infinity;

  for (const item of items) {
    if (currentCluster.length === 0 || item.startMinutes < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.layoutEndMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.layoutEndMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedItem[] = [];
  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const columnOf = new Map<(typeof items)[number], number>();

    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < columnEnds.length; i++) {
        if (columnEnds[i] <= item.startMinutes) {
          columnEnds[i] = item.layoutEndMinutes;
          columnOf.set(item, i);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columnEnds.push(item.layoutEndMinutes);
        columnOf.set(item, columnEnds.length - 1);
      }
    }

    if (columnEnds.length <= MAX_VISIBLE_COLUMNS) {
      for (const item of cluster) {
        result.push({
          type: 'appointment',
          appt: item.appt,
          startMinutes: item.startMinutes,
          endMinutes: item.endMinutes,
          column: columnOf.get(item)!,
          totalColumns: columnEnds.length,
        });
      }
      continue;
    }

    // Too many concurrent appointments to show side by side — keep the
    // first (MAX_VISIBLE_COLUMNS - 1) columns individually visible and
    // collapse the rest into a single "+N more" chip in the last column.
    const overflowColumnIndex = MAX_VISIBLE_COLUMNS - 1;
    const visible = cluster.filter((item) => columnOf.get(item)! < overflowColumnIndex);
    const overflow = cluster.filter((item) => columnOf.get(item)! >= overflowColumnIndex);

    for (const item of visible) {
      result.push({
        type: 'appointment',
        appt: item.appt,
        startMinutes: item.startMinutes,
        endMinutes: item.endMinutes,
        column: columnOf.get(item)!,
        totalColumns: MAX_VISIBLE_COLUMNS,
      });
    }

    if (overflow.length > 0) {
      result.push({
        type: 'overflow',
        appts: overflow.map((o) => o.appt),
        startMinutes: Math.min(...overflow.map((o) => o.startMinutes)),
        endMinutes: Math.max(...overflow.map((o) => o.endMinutes)),
        column: overflowColumnIndex,
        totalColumns: MAX_VISIBLE_COLUMNS,
      });
    }
  }

  return result;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [appointments, setAppointments] = useState<AppointmentListResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [doctors, setDoctors] = useState<DoctorResponseDto[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('');

  const [overflowModal, setOverflowModal] = useState<{
    dayLabel: string;
    appts: AppointmentListResponseDto[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDoctors(1, 100, user!.token)
      .then((data) => {
        if (!cancelled) {
          setDoctors(data.items);
        }
      })
      .catch(() => {
        // Filter list is a convenience — silently skip if it fails to load.
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const days = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const date = addDays(weekStart, i);
        return {
          date,
          iso: formatDateIso(date),
          weekdayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
      }),
    [weekStart],
  );

  const weekRangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[4].dateLabel}, ${weekStart.getFullYear()}`;

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAppointmentsByWeek(
        formatDateIso(weekStart),
        formatDateIso(addDays(weekStart, 4)),
        user!.token,
        doctorFilter ? Number(doctorFilter) : undefined,
      );
      setAppointments(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [user, weekStart, doctorFilter]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  const appointmentsByDay = useMemo(
    () =>
      days.map((day) =>
        layoutDay(appointments.filter((a) => formatDateIso(new Date(a.dateTime)) === day.iso)),
      ),
    [appointments, days],
  );

  async function handleStatusChange(appt: AppointmentListResponseDto, status: 'Completed' | 'Cancelled') {
    setOverflowModal(null);
    setUpdatingId(appt.id);
    setError('');
    try {
      await updateAppointmentStatus({ id: appt.id, status }, user!.token);
      await loadWeek();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setUpdatingId(null);
    }
  }

  function renderStatusControl(appt: AppointmentListResponseDto) {
    return appt.status === 'Pending' ? (
      <select
        value={appt.status}
        disabled={updatingId === appt.id}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => void handleStatusChange(appt, e.target.value as 'Completed' | 'Cancelled')}
        className="rounded border border-white/70 bg-white/70 px-1 py-0.5 text-[10px] font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
      >
        <option value="Pending">Pending</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    ) : (
      <span className="text-[10px] font-medium">{appt.status}</span>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Weekly schedule across all doctors</p>
        </div>
        <Link
          to="/appointments/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          New Appointment
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekStart((prev) => addDays(prev, -7))}
                disabled={loading}
                aria-label="Previous week"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-gray-800 min-w-[180px] text-center">
                {weekRangeLabel}
              </span>
              <button
                type="button"
                onClick={() => setWeekStart((prev) => addDays(prev, 7))}
                disabled={loading}
                aria-label="Next week"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="doctorFilter" className="text-sm font-medium text-gray-600">
                Doctor
              </label>
              <select
                id="doctorFilter"
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-600">
            {APPOINTMENT_STATUSES.map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                {status}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-24 text-center text-sm text-gray-500">Loading appointments…</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="flex border-b border-gray-100">
                <div className="w-16 shrink-0" />
                {days.map((day) => (
                  <div key={day.iso} className="flex-1 border-l border-gray-100 px-2 py-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {day.weekdayLabel}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{day.dateLabel}</p>
                  </div>
                ))}
              </div>

              <div className="flex">
                <div className="w-16 shrink-0">
                  {HOURS.map((h) => (
                    <div key={h} className="relative border-b border-gray-50" style={{ height: HOUR_HEIGHT }}>
                      <span className="absolute -top-2 right-2 text-[11px] text-gray-400">{h}:00</span>
                    </div>
                  ))}
                </div>

                {days.map((day, dayIndex) => (
                  <div
                    key={day.iso}
                    className="relative flex-1 border-l border-gray-100"
                    style={{ height: HOURS.length * HOUR_HEIGHT }}
                  >
                    {HOURS.map((h) => (
                      <div key={h} className="border-b border-gray-50" style={{ height: HOUR_HEIGHT }} />
                    ))}

                    {appointmentsByDay[dayIndex].map((item) => {
                      const gridStartMinutes = GRID_START_HOUR * 60;
                      const gridEndMinutes = GRID_END_HOUR * 60;
                      const clampedStart = Math.max(item.startMinutes, gridStartMinutes);
                      const clampedEnd = Math.min(item.endMinutes, gridEndMinutes);
                      const top = ((clampedStart - gridStartMinutes) / 60) * HOUR_HEIGHT;
                      const height = Math.max(
                        MIN_BLOCK_HEIGHT,
                        ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT,
                      );
                      const positionStyle = {
                        top,
                        height,
                        left: `calc(${item.column} * (100% / ${item.totalColumns}))`,
                        width: `calc(100% / ${item.totalColumns} - 4px)`,
                      };

                      if (item.type === 'overflow') {
                        return (
                          <button
                            key={`overflow-${item.startMinutes}-${item.column}`}
                            type="button"
                            onClick={() => setOverflowModal({ dayLabel: day.dateLabel, appts: item.appts })}
                            className="absolute overflow-hidden rounded-lg border border-gray-300 bg-gray-100 px-2 py-1 text-left text-xs text-gray-700 shadow-sm hover:bg-gray-200 transition-colors"
                            style={positionStyle}
                          >
                            <p className="font-semibold">+{item.appts.length} more</p>
                            <p className="text-[10px] text-gray-500">Click to view</p>
                          </button>
                        );
                      }

                      const { appt } = item;
                      const styles = STATUS_STYLES[appt.status];
                      const timeRangeLabel = formatTimeRange(appt);

                      return (
                        <div
                          key={appt.id}
                          role="button"
                          tabIndex={0}
                          title={`${timeRangeLabel} · ${appt.doctorName ?? 'Unknown doctor'} · ${appt.patientName ?? 'Unknown patient'} — click to view`}
                          onClick={() => navigate(`/appointments/${appt.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/appointments/${appt.id}`);
                            }
                          }}
                          className={`absolute overflow-hidden rounded-lg border px-2 py-1 text-xs shadow-sm cursor-pointer hover:brightness-95 transition-[filter] ${styles.bg} ${styles.border} ${styles.text}`}
                          style={positionStyle}
                        >
                          <p className="font-semibold truncate">{timeRangeLabel}</p>
                          <p className="flex items-center gap-1 truncate">
                            <Stethoscope className="h-3 w-3 shrink-0" />
                            <span className="truncate">{appt.doctorName ?? 'Unknown doctor'}</span>
                          </p>
                          <p className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{appt.patientName ?? 'Unknown patient'}</span>
                          </p>
                          <div className="mt-1">{renderStatusControl(appt)}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {overflowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{overflowModal.dayLabel} appointments</h2>
              <button
                type="button"
                onClick={() => setOverflowModal(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {overflowModal.appts
                .slice()
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                .map((appt) => {
                  const styles = STATUS_STYLES[appt.status];
                  const timeRangeLabel = formatTimeRange(appt);

                  return (
                    <div
                      key={appt.id}
                      role="button"
                      tabIndex={0}
                      title={`${appt.doctorName ?? 'Unknown doctor'} · ${appt.patientName ?? 'Unknown patient'} — click to view`}
                      onClick={() => navigate(`/appointments/${appt.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/appointments/${appt.id}`);
                        }
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-[filter] hover:brightness-95 ${styles.bg} ${styles.border} ${styles.text}`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{timeRangeLabel}</p>
                        <p className="flex items-center gap-1.5 truncate">
                          <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{appt.doctorName ?? 'Unknown doctor'}</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{appt.patientName ?? 'Unknown patient'}</span>
                        </p>
                      </div>
                      <div className="shrink-0">{renderStatusControl(appt)}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
