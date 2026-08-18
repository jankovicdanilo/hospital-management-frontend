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

/** Turns a caught error into a message safe to show a user, in place of raw browser/JS text. */
export function getErrorMessage(err: unknown): string {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
        return 'Unable to reach the server. Check your connection and try again.';
    }
    if (err instanceof Error) {
        return err.message;
    }
    return 'An unexpected error occurred.';
}