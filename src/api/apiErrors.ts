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
    const text = await response.text();

    if (text) {
        try {
            const body: ApiErrorResponse = JSON.parse(text);
            throw new ApiError(body.message, body.errorCode, body.errors);
        } catch (err) {
            if (err instanceof ApiError) {
                throw err;
            }
            // Body was present but not valid JSON — fall through to the generic error below.
        }
    }

    throw new ApiError(`Request failed with status ${response.status}.`, 'UNKNOWN_ERROR');
}

export function authHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}` };
}