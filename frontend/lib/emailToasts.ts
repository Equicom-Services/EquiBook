/*
 * Notice every email the API sends and hand it to the toaster.
 *
 * The backend dispatches notification emails as background tasks,
 * so it reports them in a response header rather than in a body it
 * has already built (see backend/app/core/email_notifications.py).
 * Reading that header here, in one place, means a toast appears for
 * every email regardless of which component made the call - there
 * are raw fetch calls all over the app, and public pages never go
 * through apiFetch at all.
 *
 * The header only describes the emails for a signed-in admin. On
 * the employee booking pages it is the bare marker below: an email
 * was sent, and nothing about who received it.
 */

export const EMAIL_HEADER = "X-Equibook-Emails";

const PUBLIC_VALUE = "sent";

export interface DispatchedEmail {
  /* Short phrase for the UI, e.g. "Approval sent to requester". */
  event: string;

  /* A sample of the addresses; trimmed when the fan-out is large. */
  recipients: string[];

  /* How many addresses the email actually went to. */
  count: number;
}

export interface EmailReport {
  /*
   * False on the employee side, where the toast says only that an
   * email was sent. The emails list is empty in that case - the
   * detail is withheld by the backend, not hidden by the UI.
   */
  detailed: boolean;

  emails: DispatchedEmail[];
}

type Listener = (report: EmailReport) => void;

const listeners = new Set<Listener>();

let patched = false;

/*
 * Pull the email report out of a response, or null if it sent none.
 *
 * Anything unexpected in the header is a backend change this build
 * does not know about. Rather than drop the toast entirely it falls
 * back to the plain "an email was sent" form, which is true of any
 * response carrying the header at all.
 */
export function readEmailReport(
  response: Response
): EmailReport | null {
  let raw: string | null = null;

  try {
    raw = response.headers.get(EMAIL_HEADER);
  } catch {
    // A response the browser will not let us read headers on.
    return null;
  }

  if (!raw) {
    return null;
  }

  if (raw === PUBLIC_VALUE) {
    return { detailed: false, emails: [] };
  }

  const withheld: EmailReport = { detailed: false, emails: [] };

  let parsed: unknown = null;

  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(
      `Could not read the ${EMAIL_HEADER} header`,
      raw
    );
    return withheld;
  }

  if (!Array.isArray(parsed)) {
    return withheld;
  }

  const emails = parsed.flatMap((entry) => {
    const record = entry as Partial<DispatchedEmail>;

    if (typeof record?.event !== "string") {
      return [];
    }

    const recipients = Array.isArray(record.recipients)
      ? record.recipients.filter(
          (address): address is string =>
            typeof address === "string"
        )
      : [];

    const count =
      typeof record.count === "number" && record.count > 0
        ? record.count
        : recipients.length;

    return [{ event: record.event, recipients, count }];
  });

  if (emails.length === 0) {
    return withheld;
  }

  return { detailed: true, emails };
}

/*
 * One line of detail for a single email.
 *
 * Names the recipient when there is one worth naming, and falls
 * back to the count when the email fanned out to a whole site's
 * admins or to every overlapping requester.
 */
export function describeRecipients(
  email: DispatchedEmail
): string {
  if (email.count === 1 && email.recipients[0]) {
    return email.recipients[0];
  }

  if (email.count === 0) {
    return "no recipients";
  }

  return `${email.count} recipients`;
}

export function subscribeToEmailToasts(
  listener: Listener
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function publishEmailReport(report: EmailReport) {
  listeners.forEach((listener) => listener(report));
}

/*
 * Watch every call the browser makes to the API.
 *
 * Wrapping window.fetch is what makes this automatic: the app
 * calls fetch directly in a couple of dozen places, and new ones
 * are added regularly, so opting each of them in by hand would
 * mean the toast quietly goes missing on whichever call site
 * forgets. The wrapper only reads a header - it never touches the
 * body, never delays the response, and hands back exactly what
 * fetch returned, so a failure in here cannot break a request.
 */
export function watchFetchForEmails() {
  if (patched || typeof window === "undefined") {
    return;
  }

  patched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
      const report = readEmailReport(response);

      if (report) {
        publishEmailReport(report);
      }
    } catch (error) {
      console.error(
        "Could not report dispatched emails",
        error
      );
    }

    return response;
  };
}
