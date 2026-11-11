import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import AuthLayout from './components/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DoctorsPage from './pages/DoctorsPage';
import DoctorFormPage from './pages/DoctorFormPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import PatientDetailPage from './pages/PatientDetailPage';
import ProceduresPage from './pages/ProceduresPage';
import ProcedureFormPage from './pages/ProcedureFormPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentFormPage from './pages/AppointmentFormPage';
import AppointmentDetailPage from './pages/AppointmentDetailPage';
import StatisticsPage from './pages/StatisticsPage';
import DoctorStatisticsDetailPage from './pages/DoctorStatisticsDetailPage';
import UsersPage from './pages/UsersPage';
import UserFormPage from './pages/UserFormPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/new" element={<PatientFormPage />} />
            <Route path="/patients/:id/edit" element={<PatientFormPage />} />
            <Route
              path="/patients/:id/history"
              element={
                <ProtectedRoute allow={['Admin', 'Doctor']} requireDoctorLink>
                  <PatientDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route
              path="/doctors/new"
              element={
                <ProtectedRoute allow={['Admin', 'Manager']}>
                  <DoctorFormPage />
                </ProtectedRoute>
              }
            />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            <Route
              path="/doctors/:id/edit"
              element={
                <ProtectedRoute allow={['Admin', 'Manager']}>
                  <DoctorFormPage />
                </ProtectedRoute>
              }
            />
            <Route path="/procedures" element={<ProceduresPage />} />
            <Route
              path="/procedures/new"
              element={
                <ProtectedRoute allow={['Admin', 'Manager']}>
                  <ProcedureFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/procedures/:id/edit"
              element={
                <ProtectedRoute allow={['Admin', 'Manager']}>
                  <ProcedureFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute allow={['Admin', 'Doctor']} requireDoctorLink>
                  <AppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/new"
              element={
                <ProtectedRoute allow={['Admin', 'Doctor']} requireDoctorLink>
                  <AppointmentFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/:id"
              element={
                <ProtectedRoute allow={['Admin', 'Doctor']} requireDoctorLink>
                  <AppointmentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/:id/edit"
              element={
                <ProtectedRoute allow={['Admin', 'Doctor']} requireDoctorLink>
                  <AppointmentFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute allow={['Admin', 'Manager']}>
                  <StatisticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics/doctors/:doctorId"
              element={
                <ProtectedRoute allow={['Admin', 'Manager']}>
                  <DoctorStatisticsDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allow={['Admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <ProtectedRoute allow={['Admin']}>
                  <UserFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <ProtectedRoute allow={['Admin']}>
                  <UserFormPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
