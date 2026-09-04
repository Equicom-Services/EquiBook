"use client";

import { useEffect } from "react";

/*
 * Root error boundary.
 *
 * Only used when the root layout itself fails, so it replaces
 * the whole document and has to supply its own html and body.
 * Global styles are not loaded here, hence the inline styling.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#0f172a",
        }}
      >
        <title>Equibook</title>

        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            margin: "1.5rem",
            borderRadius: "6px",
            overflow: "hidden",
            background: "#ffffff",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              padding: "1rem 1.5rem",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "#991b1b",
              }}
            >
              Something went wrong
            </h2>
          </div>

          <div style={{ padding: "1.25rem 1.5rem" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "#334155",
              }}
            >
              Equibook could not start correctly. Please try
              again, and let IT know if it keeps happening.
            </p>

            {error.digest && (
              <p
                style={{
                  margin: "0.75rem 0 0",
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                }}
              >
                Reference: {error.digest}
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={{
                border: "none",
                borderRadius: "6px",
                background: "#03045e",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "0.625rem 1.25rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
