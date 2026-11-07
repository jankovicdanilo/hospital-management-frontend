// src/api/apiErrors.ts

import i18n from '../i18n';

export interface ApiErrorResponse {
    message: string;
    errorCode: string;
    errors?: Record<string, string[]>;
}

export class ApiError extends Error {
    readonly status: number;
    readonly errorCode: string;
    readonly errors?: Record<string, string[]>;

    constructor(message: string, errorCode: string, status: number, errors?: Record<string, string[]>) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errorCode = errorCode;
        this.errors = errors;
    }
}

// Set by AuthProvider so a 401 (expired/revoked token) logs the user out from
// wherever the failing request happened, without every page needing to check for it.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
    unauthorizedHandler = handler;
}

export async function throwApiError(response: Response): Promise<never> {
    const text = await response.text();

    if (response.status === 401) {
        unauthorizedHandler?.();
    }

    if (text) {
        try {
            const body: ApiErrorResponse = JSON.parse(text);
            if (typeof body.message === 'string' && body.message) {
                throw new ApiError(body.message, body.errorCode, response.status, body.errors);
            }
        } catch (err) {
            if (err instanceof ApiError) {
                throw err;
            }
            // Body was present but not valid JSON, or valid JSON that doesn't match
            // ApiErrorResponse (e.g. a raw framework error page) — fall through below.
        }
    }

    throw new ApiError(`Request failed with status ${response.status}.`, 'UNKNOWN_ERROR', response.status);
}

export function authHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}` };
}

/** Turns a caught error into a message safe to show a user, in place of raw browser/JS text. */
export function getErrorMessage(err: unknown): string {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
        return i18n.t('common.unableToReachServer');
    }
    if (err instanceof Error) {
        return err.message;
    }
    return i18n.t('common.unexpectedError');
}
