export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface DoctorScheduleResponseDto {
  id: number;
  doctorId: number;
  dayOfWeek: DayOfWeek;
  startHour: number;
  endHour: number;
}

export interface DoctorScheduleCreateRequestDto {
  doctorId: number;
  dayOfWeek: DayOfWeek;
  startHour: number;
  endHour: number;
}

export type DoctorScheduleCreateResponseDto = DoctorScheduleResponseDto;

export interface DoctorScheduleUpdateRequestDto {
  id: number;
  dayOfWeek: DayOfWeek;
  startHour: number;
  endHour: number;
}

export type DoctorScheduleUpdateResponseDto = DoctorScheduleResponseDto;
