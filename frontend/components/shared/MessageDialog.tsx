"use client";

export type MessageVariant =
  | "success"
  | "error"
  | "info";

export interface DialogMessage {
  variant: MessageVariant;
  title: string;
  message: string;
}

interface MessageDialogProps {
  isOpen: boolean;
  variant?: MessageVariant;
  title: string;
  message: string;
  closeLabel?: string;
  onClose: () => void;

  /*
   * Passing onConfirm turns the dialog into a confirmation:
   * the close button becomes Cancel and a confirm button is
   * added beside it.
   */
  onConfirm?: () => void;
  confirmLabel?: string;
}

/*
 * Shared success / error dialog.
 *
 * Replaces window.alert so messages are shown inside the app
 * using the same modal styling as the confirmation modals.
 */
export default function MessageDialog({
  isOpen,
  variant = "info",
  title,
  message,
  closeLabel,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
}: MessageDialogProps) {
  if (!isOpen) {
    return null;
  }

  const isConfirmation = onConfirm !== undefined;

  const dismissLabel =
    closeLabel ??
    (isConfirmation ? "Cancel" : "Close");

  const accent =
    variant === "success"
      ? {
          background: "#f0fdf4",
          color: "#166534",
        }
      : variant === "error"
      ? {
          background: "#fef2f2",
          color: "#991b1b",
        }
      : {
          background: "#eff6ff",
          color: "#1e3a8a",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-2xl"
      >
        {/* HEADER */}

        <div
          className="px-6 py-4"
          style={{
            background: accent.background,
          }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: accent.color }}
          >
            {title}
          </h2>
        </div>

        {/* BODY */}

        <div className="px-6 py-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {message}
          </p>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus={!isConfirmation}
            onClick={onClose}
            className={
              isConfirmation
                ? "rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                : "rounded-md bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            }
          >
            {dismissLabel}
          </button>

          {isConfirmation && (
            <button
              type="button"
              autoFocus
              onClick={onConfirm}
              className="rounded-md bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
