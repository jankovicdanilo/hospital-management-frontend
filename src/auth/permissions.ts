import type { Role } from '../types/auth';

/** Central mirror of the permission table in roles-and-permissions.md. */
export const permissions = {
  canManageCatalog: (role: Role) => role === 'Admin' || role === 'Manager', // doctors, procedures, schedules
  canUseAppointments: (role: Role) => role === 'Admin' || role === 'Doctor',
  canViewStatistics: (role: Role) => role === 'Admin' || role === 'Manager',
  canViewInvoices: (role: Role) => role === 'Admin' || role === 'Manager',
  canViewPatientHistory: (role: Role) => role === 'Admin' || role === 'Doctor',
  canManageUsers: (role: Role) => role === 'Admin',
};
