import { clearAuthSession, ensureValidAccessToken } from '../utils/authSession';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
    const token = await ensureValidAccessToken();

    const doFetch = (authToken: string | null) =>
        fetch(`${BASE_URL}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                ...options?.headers,
            },
            ...options,
        });

    let res = await doFetch(token);
    if (res.status === 401) {
        const refreshedToken = await ensureValidAccessToken();
        if (!refreshedToken) {
            clearAuthSession();
            throw new Error('Session expired. Please log in again.');
        }
        res = await doFetch(refreshedToken);
    }

    if (!res.ok) {
        const rawText = await res.text();
        let message = rawText || `Request failed with status ${res.status}`;

        try {
            const parsed = rawText ? JSON.parse(rawText) : null;
            const apiMessage = parsed?.message;
            if (Array.isArray(apiMessage)) {
                message = apiMessage.join(', ');
            } else if (typeof apiMessage === 'string' && apiMessage.trim()) {
                message = apiMessage;
            } else if (typeof parsed?.error === 'string' && parsed.error.trim()) {
                message = parsed.error;
            }
        } catch {
            // Keep the raw text message when response body is not JSON.
        }

        if (res.status === 401) {
            clearAuthSession();
            throw new Error('Session expired. Please log in again.');
        }
        throw new Error(message);
    }

    const statusNoContent = res.status === 204;
    if (statusNoContent) {
        return undefined as T;
    }

    return (await res.json()) as T;
}
