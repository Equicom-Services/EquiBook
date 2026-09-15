"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, X } from "lucide-react";

import {
  EmailReport,
  describeRecipients,
  subscribeToEmailToasts,
  watchFetchForEmails,
} from "@/lib/emailToasts";

/* How long a toast stays before it fades itself out. */
const VISIBLE_MS = 6000;

interface Toast {
  id: number;
  report: EmailReport;
}

let nextToastId = 0;

/*
 * Toast stack for the emails the API has just sent.
 *
 * Mounted once in the root layout. One request gets one toast,
 * however many emails it sent, so approving a booking that also
 * auto-rejects three overlapping ones does not bury the screen.
 *
 * What the toast can say is decided by the backend: admins see
 * which emails went where, and the employee booking pages are
 * told only that an email was sent.
 */
export default function EmailToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  useEffect(() => {
    watchFetchForEmails();

    const unsubscribe = subscribeToEmailToasts((report) => {
      const id = nextToastId++;

      setToasts((current) => [...current, { id, report }]);

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), VISIBLE_MS)
      );
    });

    const pending = timers.current;

    return () => {
      unsubscribe();
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [dismiss]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      /*
       * Above MessageDialog and the confirmation modals, which sit
       * at z-50, so a toast is not hidden behind the dialog that
       * the same action opened.
       *
       * Kept clear of the booking assistant, whose launcher owns
       * the bottom-right corner: opposite corner on a wide screen,
       * and above the launcher on a narrow one.
       */
      className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:items-start"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <EmailToast
          key={toast.id}
          report={toast.report}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

function EmailToast({
  report,
  onDismiss,
}: {
  report: EmailReport;
  onDismiss: () => void;
}) {
  const { detailed, emails } = report;

  const total = emails.reduce(
    (sum, email) => sum + email.count,
    0
  );

  /*
   * "Email sent" on its own where the detail is withheld. The
   * count is part of what is withheld, so a booking that also
   * notified the site's admins still reads as one email.
   */
  const title =
    !detailed || total === 1
      ? "Email sent"
      : `${total} emails sent`;

  return (
    <div className="equibook-toast pointer-events-auto w-full max-w-sm overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0fdf4] text-[#166534]">
          <Mail className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {title}
          </p>

          {!detailed && (
            <p className="mt-0.5 text-xs text-slate-500">
              A notification has been emailed.
            </p>
          )}

          {emails.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {emails.map((email, index) => (
                <li
                  key={`${email.event}-${index}`}
                  className="truncate text-xs text-slate-600"
                  title={`${email.event}: ${describeRecipients(email)}`}
                >
                  {email.event}
                  <span className="text-slate-400">
                    {" — "}
                    {describeRecipients(email)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1 shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
