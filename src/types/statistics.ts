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
