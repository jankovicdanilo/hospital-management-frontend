import type { DoctorResponseDto } from './doctor';

export type AppointmentStatus = 'Pending' | 'Missed' | 'Completed' | 'Cancelled';

export interface PatientResponseDto {
  id: number;
  name: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string;
}

export interface AppointmentProcedureResponseDto {
  appointmentId: number;
  procedureId: number;
  procedureName: string;
  procedurePrice: number;
}

export interface TreatmentResponseDto {
  id: number;
  appointmentId: number;
  description: string;
  medication: string | null;
  createdAt: string;
}

export interface AppointmentListResponseDto {
  id: number;
  doctorId: number;
  doctorName: string | null;
  patientId: number;
  patientName: string | null;
  dateTime: string;
  duration: string;
  status: AppointmentStatus;
  notes: string | null;
  procedures: AppointmentProcedureResponseDto[];
  treatment: TreatmentResponseDto | null;
  totalCost: number;
  discount: number;
}

export interface AppointmentResponseDto {
  id: number;
  dateTime: string;
  duration: string;
  status: AppointmentStatus;
  notes: string | null;
  doctor: DoctorResponseDto | null;
  patient: PatientResponseDto | null;
  procedures: AppointmentProcedureResponseDto[];
  treatment: TreatmentResponseDto | null;
  totalCost: number;
  discount: number;
}

export interface AppointmentCreateRequestDto {
  patientId: number;
  doctorId: number;
  dateTime: string;
  duration: string;
  notes?: string;
}

export interface AppointmentCreateResponseDto {
  id: number;
  dateTime: string;
  duration: string;
  status: string;
  notes: string | null;
  doctor: DoctorResponseDto | null;
  patient: PatientResponseDto | null;
}

export interface AppointmentUpdateRequestDto {
  id: number;
  patientId: number;
  doctorId: number;
  dateTime: string;
  duration: string;
  notes?: string;
}

export interface AppointmentUpdateResponseDto {
  id: number;
  dateTime: string;
  duration: string;
  status: string;
  notes: string | null;
  doctor: DoctorResponseDto | null;
  patient: PatientResponseDto | null;
  procedures: AppointmentProcedureResponseDto[];
}

export interface AppointmentStatusUpdateDto {
  id: number;
  status: 'Completed' | 'Cancelled';
}

export interface TimeSlotDto {
  start: string;
  end: string;
}
