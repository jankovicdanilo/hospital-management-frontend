import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import AuthLayout from './components/AuthLayout';
import DoctorsPage from './pages/DoctorsPage';
import DoctorFormPage from './pages/DoctorFormPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import ProceduresPage from './pages/ProceduresPage';
import ProcedureFormPage from './pages/ProcedureFormPage';

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
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/new" element={<DoctorFormPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            <Route path="/doctors/:id/edit" element={<DoctorFormPage />} />
            <Route path="/procedures" element={<ProceduresPage />} />
            <Route path="/procedures/new" element={<ProcedureFormPage />} />
            <Route path="/procedures/:id/edit" element={<ProcedureFormPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
