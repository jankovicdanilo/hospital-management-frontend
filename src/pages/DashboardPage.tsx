import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getPatients } from '../api/patient';
import { getDoctors } from '../api/doctor';
import { getProcedures } from '../api/procedure';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [doctorCount, setDoctorCount] = useState<number | null>(null);
  const [procedureCount, setProcedureCount] = useState<number | null>(null);

  useEffect(() => {
    void getPatients(1, 1, user!.token).then((data) => setPatientCount(data.totalCount));
    void getDoctors(1, 1, user!.token).then((data) => setDoctorCount(data.totalCount));
    void getProcedures(1, 1, user!.token).then((data) => setProcedureCount(data.totalCount));
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-2xl bg-white shadow-md p-8 mb-6">
        <p className="text-sm text-gray-500 mb-1">{t('dashboard.welcomeBack')}</p>
        <p className="text-2xl font-semibold text-gray-800">{user!.username}</p>
        <div className="mt-4 flex gap-6 text-sm text-gray-600">
          <span>{t('dashboard.email')} <span className="font-medium text-gray-800">{user!.email}</span></span>
          <span>{t('dashboard.role')} <span className="font-medium text-gray-800 capitalize">{user!.role}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label={t('stats.totalPatients')} value={patientCount ?? '—'} />
        <StatCard label={t('stats.totalDoctors')} value={doctorCount ?? '—'} />
        <StatCard label={t('stats.totalProcedures')} value={procedureCount ?? '—'} />
      </div>
    </div>
  );
}
