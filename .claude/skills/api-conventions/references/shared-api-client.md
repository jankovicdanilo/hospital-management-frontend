# Shared API client code

ApiError, throwApiError, and authHeaders belong in src/api/apiErrors.ts.

If this file already exists, import from it — do not redefine these
per-feature.

If it does not exist yet, create it with this shape:

export interface ApiErrorResponse {
message: string;
errorCode: string;
errors?: Record<string, string[]>;
}

export class ApiError extends Error {
readonly errorCode: string;
readonly errors?: Record<string, string[]>;

constructor(message: string, errorCode: string, errors?: Record<string, string[]>) {
super(message);
this.name = 'ApiError';
this.errorCode = errorCode;
this.errors = errors;
}
}

export async function throwApiError(response: Response): Promise<never> {
const body: ApiErrorResponse = await response.json();
throw new ApiError(body.message, body.errorCode, body.errors);
}

export function authHeaders(token: string): HeadersInit {
return { Authorization: `Bearer ${token}` };
}