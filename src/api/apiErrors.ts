// src/api/apiErrors.ts

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