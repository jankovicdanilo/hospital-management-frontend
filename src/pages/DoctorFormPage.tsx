import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { createDoctor, getDoctorById, updateDoctor } from '../api/doctor';
import { ApiError, getErrorMessage } from '../api/apiErrors';

interface FormState {
  firstName: string;
  lastName: string;
  specialization: string;
  email: string;
  phone: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = { firstName: '', lastName: '', specialization: '', email: '', phone: '' };

export default function DoctorFormPage() {
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

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setServerError('');

    getDoctorById(Number(id), user!.token)
      .then((doctor) => {
        if (cancelled) {
          return;
        }
        setForm({
          firstName: doctor.firstName ?? '',
          lastName: doctor.lastName ?? '',
          specialization: doctor.specialization ?? '',
          email: doctor.email ?? '',
          phone: doctor.phone ?? '',
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setServerError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, user]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.firstName.trim()) {
      errors.firstName = t('common.firstNameRequired');
    }
    if (!form.lastName.trim()) {
      errors.lastName = t('common.lastNameRequired');
    }
    if (!form.specialization.trim()) {
      errors.specialization = t('doctorForm.specializationRequired');
    }
    if (!form.email.trim()) {
      errors.email = t('common.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t('common.emailInvalid');
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
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        specialization: form.specialization.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      };

      if (isEdit) {
        await updateDoctor({ id: Number(id), ...payload }, user!.token);
      } else {
        await createDoctor(payload, user!.token);
      }

      navigate('/doctors', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const mapped: FormErrors = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          const key = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof FormState;
          if (key in emptyForm) {
            mapped[key] = messages[0];
          }
        }
        setFieldErrors((prev) => ({ ...prev, ...mapped }));
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
          {isEdit ? t('doctorForm.editTitle') : t('doctorForm.addTitle')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? t('doctorForm.editSubtitle') : t('doctorForm.addSubtitle')}
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-md p-8">
        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">{t('doctorForm.loading')}</div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                  {t('common.firstName')}
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                  {t('common.lastName')}
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="specialization">
                {t('doctorForm.specialization')}
              </label>
              <input
                id="specialization"
                type="text"
                value={form.specialization}
                onChange={(e) => updateField('specialization', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.specialization ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {fieldErrors.specialization && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.specialization}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                  {t('common.phone')} <span className="text-gray-400 font-normal">{t('common.optional')}</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link
                to="/doctors"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : t('doctorForm.addTitle')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
