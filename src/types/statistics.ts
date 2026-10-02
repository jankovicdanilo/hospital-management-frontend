export interface DoctorLoadDto {
  doctorId: number;
  doctorName: string;
  appointmentCount: number;
}

export interface DoctorRevenueDto {
  doctorId: number;
  doctorName: string;
  revenue: number;
  completedCount: number;
}

export interface ProcedureProfitabilityDto {
  procedureId: number;
  procedureName: string;
  timesPerformed: number;
  revenue: number;
}

export interface VisitsOverTimeDto {
  period: string;
  visits: number;
}

export interface TopPatientDto {
  patientId: number;
  patientName: string;
  visits: number;
  revenue: number;
}

export interface PatientStatisticsDto {
  totalPatients: number;
  totalVisits: number;
  totalRevenue: number;
  averageRevenuePerPatient: number;
  visitsOverTime: VisitsOverTimeDto[];
  topPatients: TopPatientDto[];
}

export interface DoctorLoadTimelineDto {
  doctorId: number;
  doctorName: string;
  totalAppointments: number;
  points: VisitsOverTimeDto[];
}

export interface DoctorStatisticsDto {
  doctorId: number;
  doctorName: string;
  appointmentCount: number;
  pendingCount: number;
  completedCount: number;
  missedCount: number;
  cancelledCount: number;
  revenue: number;
  uniquePatients: number;
  visitsOverTime: VisitsOverTimeDto[];
  topProcedures: ProcedureProfitabilityDto[];
  topPatients: TopPatientDto[];
}
