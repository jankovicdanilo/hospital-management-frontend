import type {
  DoctorLoadDto,
  DoctorLoadTimelineDto,
  DoctorRevenueDto,
  DoctorStatisticsDto,
  PatientStatisticsDto,
  ProcedureProfitabilityDto,
} from '../types/statistics';
import { throwApiError, authHeaders } from './apiErrors';

const STATISTICS_BASE_URL = import.meta.env.VITE_STATISTICS_SERVICE_URL as string;

export async function getDoctorsLoad(from: string, to: string, token: string): Promise<DoctorLoadDto[]> {
  const response = await fetch(`${STATISTICS_BASE_URL}/api/statistics/doctors/load?from=${from}&to=${to}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorLoadDto[]>;
}

export async function getDoctorsRevenue(from: string, to: string, token: string): Promise<DoctorRevenueDto[]> {
  const response = await fetch(`${STATISTICS_BASE_URL}/api/statistics/doctors/revenue?from=${from}&to=${to}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorRevenueDto[]>;
}

export async function getProceduresProfitability(
  from: string,
  to: string,
  token: string,
): Promise<ProcedureProfitabilityDto[]> {
  const response = await fetch(
    `${STATISTICS_BASE_URL}/api/statistics/procedures/profitability?from=${from}&to=${to}`,
    { headers: authHeaders(token) },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<ProcedureProfitabilityDto[]>;
}

export async function getPatientStatistics(
  from: string,
  to: string,
  token: string,
): Promise<PatientStatisticsDto> {
  const response = await fetch(`${STATISTICS_BASE_URL}/api/statistics/patients?from=${from}&to=${to}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<PatientStatisticsDto>;
}

export async function getDoctorsLoadTimeline(
  from: string,
  to: string,
  token: string,
): Promise<DoctorLoadTimelineDto[]> {
  const response = await fetch(
    `${STATISTICS_BASE_URL}/api/statistics/doctors/load/timeline?from=${from}&to=${to}`,
    { headers: authHeaders(token) },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorLoadTimelineDto[]>;
}

export async function getDoctorStatistics(
  doctorId: number,
  from: string,
  to: string,
  token: string,
): Promise<DoctorStatisticsDto> {
  const response = await fetch(
    `${STATISTICS_BASE_URL}/api/statistics/doctors/${doctorId}?from=${from}&to=${to}`,
    { headers: authHeaders(token) },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorStatisticsDto>;
}
