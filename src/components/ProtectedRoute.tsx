import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth';
import NoPermissionPage from '../pages/NoPermissionPage';
import DoctorNotLinkedPage from '../pages/DoctorNotLinkedPage';

interface ProtectedRouteProps {
  allow: Role[];
  /** Set on routes a Doctor can only use once his account is linked to a doctor record. */
  requireDoctorLink?: boolean;
  children: ReactNode;
}

export default function ProtectedRoute({ allow, requireDoctorLink, children }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return <NoPermissionPage />;
  }

  if (requireDoctorLink && user.role === 'Doctor' && user.doctorId == null) {
    return <DoctorNotLinkedPage />;
  }

  return <>{children}</>;
}
