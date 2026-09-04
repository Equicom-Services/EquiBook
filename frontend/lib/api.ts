const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not configured"
  );
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const headers = new Headers(options.headers);

  headers.set(
    "Content-Type",
    "application/json"
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );
}

/*
 * Turn a failed response into a message that is safe to show.
 *
 * The backend writes its HTTPException details for the person
 * using the app, so a string detail is passed straight through.
 * Anything else is a bug, a status code, or a raw framework
 * message, so it is logged and replaced with the fallback.
 */
export async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    // A non JSON body carries nothing worth showing.
  }

  return pickErrorMessage(
    response,
    payload,
    fallback
  );
}

/*
 * The same decision for a body that was already read.
 *
 * A response can only be parsed once, so callers that need the
 * payload on success parse it up front and pass it back here.
 */
export function pickErrorMessage(
  response: Response,
  payload: unknown,
  fallback: string
): string {
  console.error(
    `Request failed: ${response.status} ${response.url}`,
    payload
  );

  if (response.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  const detail = (
    payload as { detail?: unknown } | null
  )?.detail;

  if (
    typeof detail === "string" &&
    detail.trim() !== ""
  ) {
    return detail;
  }

  return fallback;
}

/*
 * Same idea for a thrown value.
 *
 * Errors raised by getErrorMessage above already carry a safe
 * message. A TypeError from fetch means the network or the API
 * is unreachable, and anything else is a UI bug, so neither is
 * shown as is.
 */
export function getThrownMessage(
  error: unknown,
  fallback: string
): string {
  console.error(error);

  if (
    error instanceof TypeError ||
    !(error instanceof Error)
  ) {
    return (
      "We could not reach the server. " +
      "Please check your connection and try again."
    );
  }

  return error.message || fallback;
}
