import type { SearchableSelectOption } from '../components/SearchableSelect';
import type { DoctorResponseDto } from '../types/doctor';
import type { PatientListDto } from '../types/patient';

export function doctorToOption(d: DoctorResponseDto): SearchableSelectOption {
  return {
    id: d.id,
    label: `${d.firstName} ${d.lastName}${d.specialization ? ` — ${d.specialization}` : ''}`,
  };
}

export function patientToOption(p: PatientListDto): SearchableSelectOption {
  return { id: p.id, label: `${p.name} ${p.lastName}` };
}
