import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getDoctorById, getDoctors } from '../api/doctor';
import { getUsers, registerUser, updateUser } from '../api/user';
import { ApiError, getErrorMessage } from '../api/apiErrors';
import type { Role } from '../types/auth';
import type { DoctorResponseDto } from '../types/doctor';
import SearchableSelect from '../components/SearchableSelect';
import { doctorToOption } from '../utils/searchableSelectOptions';
import { translateRole } from '../utils/i18nLabels';

// The "available doctors" list promises every unlinked doctor, so it can't stop at one
// page — a hospital with more doctors than fit on a page would otherwise silently hide
// some from the default (pre-search) list and could show a wrong "all linked" message.
const DOCTOR_PAGE_SIZE = 100;

async function fetchAllDoctors(token: string): Promise<DoctorResponseDto[]> {
  const first = await getDoctors(1, DOCTOR_PAGE_SIZE, token);
  const totalPages = Math.ceil(first.totalCount / DOCTOR_PAGE_SIZE);
  if (totalPages <= 1) {
    return first.items;
  }

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => getDoctors(i + 2, DOCTOR_PAGE_SIZE, token)),
  );
  return [...first.items, ...rest.flatMap((page) => page.items)];
}

interface FormState {
  username: string;
  email: string;
  password: string;
  role: Role | '';
  doctorId: string;
}

type FormErrors = Partial<Record<'username' | 'email' | 'password' | 'role' | 'doctorId', string>>;

const ROLES: Role[] = ['Admin', 'Manager', 'Doctor'];

const emptyForm: FormState = { username: '', email: '', password: '', role: '', doctorId: '' };

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [initialDoctorLabel, setInitialDoctorLabel] = useState('');
  const [original, setOriginal] = useState<{ role: Role; doctorId: number | null } | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [linkedDoctorIds, setLinkedDoctorIds] = useState<Set<number>>(new Set());
  // SearchableSelect caches its default (pre-search) list for the lifetime of its mount,
  // so the doctor picker below isn't rendered until linkedDoctorIds has actually loaded —
  // otherwise a fast click could cache an unfiltered list before the exclusions arrive.
  const [doctorsLoaded, setDoctorsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (isEdit) {
      setLoading(true);
      setServerError('');
    }

    getUsers(user!.token)
      .then(async (users) => {
        if (cancelled) {
          return;
        }

        // Doctors already linked to another account aren't offered in the picker below —
        // except the one already linked to the user being edited, who keeps his own link
        // selectable. This is a UX nicety, not an authority: on failure the set just stays
        // empty and the backend's DOCTOR_ALREADY_LINKED refusal (mapped to the doctorId
        // field below) is the actual guard.
        setLinkedDoctorIds(
          new Set(
            users
              .filter((u) => u.role === 'Doctor' && u.doctorId != null && (!isEdit || u.id !== Number(id)))
              .map((u) => u.doctorId as number),
          ),
        );

        if (!isEdit) {
          return;
        }

        const existing = users.find((u) => u.id === Number(id));
        if (!existing) {
          setNotFound(true);
          return;
        }

        setForm({
          username: existing.username,
          email: existing.email,
          password: '',
          role: existing.role,
          doctorId: existing.doctorId != null ? String(existing.doctorId) : '',
        });
        setOriginal({ role: existing.role, doctorId: existing.doctorId });
        setIsSelf(existing.username === user!.username);

        if (existing.role === 'Doctor' && existing.doctorId != null) {
          try {
            const doctor = await getDoctorById(existing.doctorId, user!.token);
            if (!cancelled) {
              setInitialDoctorLabel(`${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim());
            }
          } catch {
            // Doctor lookup is a display nicety only — leave the label blank on failure.
          }
        }
      })
      .catch((err) => {
        if (!cancelled && isEdit) {
          setServerError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDoctorsLoaded(true);
          if (isEdit) {
            setLoading(false);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, user]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRoleChange(role: Role) {
    setForm((prev) => ({ ...prev, role, doctorId: role === 'Doctor' ? prev.doctorId : '' }));
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.username.trim()) {
      errors.username = t('userForm.usernameRequired');
    }
    if (!form.email.trim()) {
      errors.email = t('common.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t('common.emailInvalid');
    }
    if (!isEdit && !form.password) {
      errors.password = t('userForm.passwordRequired');
    }
    if (!form.role) {
      errors.role = t('userForm.roleRequired');
    }
    if (form.role === 'Doctor' && !form.doctorId) {
      errors.doctorId = t('userForm.doctorRequired');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setServerError('');
    setSaving(true);

    try {
      const role = form.role as Role;
      const doctorId = role === 'Doctor' ? Number(form.doctorId) : null;

      if (isEdit) {
        await updateUser(
          { id: Number(id), username: form.username.trim(), email: form.email.trim(), role, doctorId },
          user!.token,
        );
      } else {
        await registerUser(
          { username: form.username.trim(), email: form.email.trim(), password: form.password, role, doctorId },
          user!.token,
        );
      }

      const appliesNextLogin =
        isEdit && original != null && (original.role !== role || original.doctorId !== doctorId);

      navigate('/users', { replace: true, state: appliesNextLogin ? { appliesNextLogin: true } : undefined });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const mapped: FormErrors = {};
          for (const [field, messages] of Object.entries(err.errors)) {
            const key = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof FormErrors;
            if (key in emptyForm) {
              mapped[key] = messages[0];
            }
          }
          setFieldErrors((prev) => ({ ...prev, ...mapped }));
        } else if (err.errorCode === 'USERNAME_TAKEN') {
          setFieldErrors((prev) => ({ ...prev, username: err.message }));
        } else if (err.errorCode === 'EMAIL_TAKEN') {
          setFieldErrors((prev) => ({ ...prev, email: err.message }));
        } else if (err.errorCode === 'DOCTOR_ALREADY_LINKED') {
          setFieldErrors((prev) => ({ ...prev, doctorId: err.message }));
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEdit ? t('userForm.editTitle') : t('userForm.addTitle')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? t('userForm.editSubtitle') : t('userForm.addSubtitle')}
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-md p-8">
        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">{t('userForm.loading')}</div>
        ) : notFound ? (
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-gray-800">{t('userForm.notFoundTitle')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('userForm.notFoundMessage')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
                  {t('userForm.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.username && <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  {t('common.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>
            </div>

            {!isEdit && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                  {t('userForm.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
                {t('userForm.role')}
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value as Role)}
                disabled={isSelf}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                  fieldErrors.role ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="" disabled>
                  {t('userForm.selectRole')}
                </option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {translateRole(t, role)}
                  </option>
                ))}
              </select>
              {fieldErrors.role && <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>}
              {isSelf && <p className="mt-1 text-xs text-gray-500">{t('userForm.cannotChangeOwnRole')}</p>}
            </div>

            {form.role === 'Doctor' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="doctorId">
                  {t('userForm.doctor')}
                </label>
                {doctorsLoaded ? (
                  <SearchableSelect
                    id="doctorId"
                    value={form.doctorId ? Number(form.doctorId) : null}
                    onChange={(value) => updateField('doctorId', value == null ? '' : String(value))}
                    fetchOptions={(search) =>
                      getDoctors(1, DOCTOR_PAGE_SIZE, user!.token, search).then((data) =>
                        data.items.filter((d) => !linkedDoctorIds.has(d.id)).map(doctorToOption),
                      )
                    }
                    fetchPopularOptions={() =>
                      fetchAllDoctors(user!.token).then((doctors) =>
                        doctors.filter((d) => !linkedDoctorIds.has(d.id)).map(doctorToOption),
                      )
                    }
                    popularLabel={t('userForm.availableDoctors')}
                    emptyPopularMessage={t('userForm.allDoctorsLinked')}
                    placeholder={t('userForm.searchDoctor')}
                    initialLabel={initialDoctorLabel}
                    hasError={Boolean(fieldErrors.doctorId)}
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('userForm.loadingDoctors')}
                  </div>
                )}
                {fieldErrors.doctorId && <p className="mt-1 text-xs text-red-600">{fieldErrors.doctorId}</p>}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link
                to="/users"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : t('userForm.addTitle')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
