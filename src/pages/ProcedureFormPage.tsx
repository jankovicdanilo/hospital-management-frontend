import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProcedure, getProcedureById, updateProcedure } from '../api/procedure';
import { ApiError } from '../api/apiErrors';

interface FormState {
  name: string;
  price: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = { name: '', price: '' };

export default function ProcedureFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

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

    getProcedureById(Number(id), user!.token)
      .then((procedure) => {
        if (cancelled) {
          return;
        }
        setForm({
          name: procedure.name,
          price: String(procedure.price),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
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
    if (!form.name.trim()) {
      errors.name = 'Name is required.';
    }

    const price = Number(form.price);
    if (!form.price.trim() || Number.isNaN(price)) {
      errors.price = 'Price is required.';
    } else if (price <= 0) {
      errors.price = 'Price must be greater than 0.';
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
        name: form.name.trim(),
        price: Number(form.price),
      };

      if (isEdit) {
        await updateProcedure(Number(id), payload, user!.token);
      } else {
        await createProcedure(payload, user!.token);
      }

      navigate('/procedures', { replace: true });
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
        setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEdit ? 'Edit Procedure' : 'Add Procedure'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? 'Update the procedure details below.' : 'Enter the new procedure’s details.'}
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-md p-8">
        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading procedure…</div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
                Price
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.price ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
            </div>

            <div className="flex justify-end gap-3">
              <Link
                to="/procedures"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Procedure'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
