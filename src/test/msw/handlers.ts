import { http, HttpResponse } from 'msw';

/**
 * MSW handlers for unit/integration tests. Add per-feature handlers here.
 */
export const handlers = [http.get('*/api/health', () => HttpResponse.json({ ok: true }))];
