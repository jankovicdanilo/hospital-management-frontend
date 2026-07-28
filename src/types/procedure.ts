export interface ProcedureListDto {
  id: number;
  name: string;
  price: number;
}

export interface ProcedureResponseDto {
  id: number;
  name: string;
  price: number;
}

export interface ProcedureCreateRequestDto {
  name: string;
  price: number;
}

export interface ProcedureCreateResponseDto {
  id: number;
  name: string;
  price: number;
}

export interface ProcedureUpdateRequestDto {
  name: string;
  price: number;
}

export interface ProcedureUpdateResponseDto {
  id: number;
  name: string;
  price: number;
}
