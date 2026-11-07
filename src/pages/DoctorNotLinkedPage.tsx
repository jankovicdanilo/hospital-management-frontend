import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function DoctorNotLinkedPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <div className="rounded-2xl bg-white shadow-md p-10">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">{t('doctorNotLinked.title')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('doctorNotLinked.message')}</p>
        <Link
          to="/dashboard"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {t('noPermission.backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
