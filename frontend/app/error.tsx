"use client";

import { useEffect } from "react";

/*
 * Route level error boundary.
 *
 * Catches render time crashes inside a route so a bug shows a
 * branded panel instead of a stack trace. The technical detail
 * goes to the console only.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-2xl">
        {/* HEADER */}

        <div className="bg-[#fef2f2] px-6 py-4">
          <h2 className="text-base font-semibold text-[#991b1b]">
            Something went wrong
          </h2>
        </div>

        {/* BODY */}

        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-slate-700">
            We hit an unexpected problem while loading this
            page. Please try again, and let IT know if it keeps
            happening.
          </p>

          {/*
           * The digest is the only detail shown, because it is
           * the reference that matches the server side log.
           */}
          {error.digest && (
            <p className="mt-3 text-xs text-slate-400">
              Reference: {error.digest}
            </p>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-md bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
