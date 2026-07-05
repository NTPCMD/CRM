/** Standard API envelope (Volume 4 §3). */
export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return Response.json({ success: true, data, meta });
}

export function fail(code: string, message: string, status = 400) {
  return Response.json({ success: false, error: { code, message } }, { status });
}

export const UNAUTHORIZED = () => fail("unauthorized", "Authentication required.", 401);
export const NO_WORKSPACE = () => fail("no_workspace", "No active workspace.", 400);
