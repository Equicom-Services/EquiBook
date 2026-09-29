"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Car,
  DoorOpen,
  Loader2,
  MessageCircle,
  Pencil,
  RotateCcw,
  Send,
  X,
  XCircle,
} from "lucide-react";

import BookingSummaryCard from "./BookingSummaryCard";
import EditBookingModal from "./EditBookingModal";
import {
  BookingAction,
  BookingPayload,
  BookingRecord,
  BookingType,
  EXPIRED_MESSAGE,
  cancelBooking,
  parseBookingId,
  requestAccessCode,
  toBookingError,
  updateBooking,
  verifyAccessCode,
} from "@/lib/bookingAccess";

type Step =
  | "action"
  | "type"
  | "bookingId"
  | "code"
  | "verified"
  | "done";

interface ChatMessage {
  id: number;
  from: "bot" | "user";
  text?: string;
  tone?: "error" | "success";
  card?: {
    bookingType: BookingType;
    booking: BookingRecord;
  };
}

interface BookingAssistantProps {
  /* The tab showing on the page, suggested when asking room or ride. */
  activeBooking?: BookingType;

  /* Called after a booking is cancelled or edited, so the page can refresh. */
  onBookingChanged?: () => void;
}

const GREETING: ChatMessage = {
  id: 0,
  from: "bot",
  text: "Hi! What would you like to do?",
};

/*
 * Errors after which this booking cannot be changed any more
 * in this conversation: the token expired (401), belongs to a
 * different booking (403), or the booking is no longer
 * cancellable or editable (409).
 */
const FINAL_STATUSES = [401, 403, 409];

const quickReplyClass =
  "flex items-center justify-center gap-1.5 rounded-md border border-[#03045e] px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const inputClass =
  "w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-100";

const primaryButtonClass =
  "flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#03045e] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

/*
 * Floating chat that lets an employee cancel or edit one of
 * their bookings after proving ownership with an emailed code.
 *
 * Everything, including the access token, lives in React state
 * only, so closing the panel or reloading the page forgets it.
 */
export default function BookingAssistant({
  activeBooking,
  onBookingChanged,
}: BookingAssistantProps) {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    GREETING,
  ]);

  const [step, setStep] = useState<Step>("action");
  const [action, setAction] =
    useState<BookingAction>("cancel");
  const [bookingType, setBookingType] =
    useState<BookingType>("room");
  const [bookingId, setBookingId] = useState<number | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const [booking, setBooking] =
    useState<BookingRecord | null>(null);

  const [busy, setBusy] = useState(false);
  const [idInput, setIdInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [reason, setReason] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const nextMessageId = useRef(1);

  /*
   * Bumped on every reset, so a reply that arrives for an
   * abandoned conversation is ignored.
   */
  const session = useRef(0);

  const listRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, busy, step, open]);

  // ==========================================================
  // CONVERSATION HELPERS
  // ==========================================================

  function post(message: Omit<ChatMessage, "id">) {
    const id = nextMessageId.current++;

    setMessages((prev) => [...prev, { ...message, id }]);
  }

  function botSay(text: string, tone?: ChatMessage["tone"]) {
    post({ from: "bot", text, tone });
  }

  function userSay(text: string) {
    post({ from: "user", text });
  }

  function reset() {
    session.current += 1;
    nextMessageId.current = 1;

    setMessages([GREETING]);
    setStep("action");
    setAction("cancel");
    setBookingType("room");
    setBookingId(null);
    setToken(null);
    setBooking(null);
    setBusy(false);
    setIdInput("");
    setCodeInput("");
    setReason("");
    setEditOpen(false);
  }

  function close() {
    reset();
    setOpen(false);
  }

  /* The booking is settled, so drop the token. */
  function finish() {
    setToken(null);
    setReason("");
    setStep("done");
  }

  /*
   * Runs one API call for the current conversation. Errors are
   * posted as bot messages using the API's detail text.
   */
  async function call<T>(
    task: () => Promise<T>,
    onDone: (result: T) => void,
    fallback: string,
    onError?: (status: number) => void
  ) {
    const current = session.current;

    setBusy(true);

    try {
      const result = await task();

      if (current === session.current) {
        onDone(result);
      }
    } catch (error) {
      if (current === session.current) {
        const failure = toBookingError(error, fallback);

        botSay(failure.message, "error");
        onError?.(failure.status);
      }
    } finally {
      if (current === session.current) {
        setBusy(false);
      }
    }
  }

  // ==========================================================
  // STEPS
  // ==========================================================

  function chooseAction(next: BookingAction) {
    userSay(
      next === "cancel"
        ? "Cancel a booking"
        : "Edit a booking"
    );
    setAction(next);
    botSay("Is it a room or a ride booking?");
    setStep("type");
  }

  function chooseType(next: BookingType) {
    userSay(next === "room" ? "Room" : "Ride");
    setBookingType(next);
    botSay(
      "Please enter your Booking ID (you can find it in your confirmation email)."
    );
    setStep("bookingId");
  }

  function sendCode(id: number, resend: boolean) {
    void call(
      () => requestAccessCode(bookingType, id, action),
      (result) => {
        botSay(
          resend
            ? `We sent a new code to ${result.email_hint}. Enter it below.`
            : `We sent a 6-digit code to ${result.email_hint}. Enter it below.`
        );
        setCodeInput("");
        setStep("code");
      },
      "We could not send a verification code. Please try again."
    );
  }

  function submitBookingId(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const raw = idInput.trim();

    if (!raw) {
      return;
    }

    userSay(raw);
    setIdInput("");

    const id = parseBookingId(raw);

    if (id === null) {
      botSay(
        "That doesn't look like a Booking ID. Please enter the number only, for example 123.",
        "error"
      );
      return;
    }

    setBookingId(id);
    sendCode(id, false);
  }

  function resendCode() {
    if (bookingId === null) {
      return;
    }

    userSay("Resend code");
    sendCode(bookingId, true);
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = codeInput.replace(/\s/g, "");

    if (bookingId === null || !code) {
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      botSay(
        "Please enter the 6-digit code from the email.",
        "error"
      );
      return;
    }

    userSay(code);
    setCodeInput("");

    void call(
      () => verifyAccessCode(bookingType, bookingId, code),
      (result) => {
        setToken(result.access_token);
        setBooking(result.booking);
        setBookingType(result.booking_type);

        botSay("Thanks, you're verified. Here is your booking:");
        post({
          from: "bot",
          card: {
            bookingType: result.booking_type,
            booking: result.booking,
          },
        });
        botSay(
          action === "cancel"
            ? "Tell us why you're cancelling, then confirm below."
            : "Open the booking form to make your changes. Saving sends the booking back for admin approval."
        );
        setStep("verified");
      },
      "We could not verify that code. Please try again."
    );
  }

  function confirmCancel(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmed = reason.trim();

    if (!token || !trimmed) {
      return;
    }

    userSay(`Cancel booking. Reason: ${trimmed}`);

    void call(
      () => cancelBooking(token, trimmed),
      () => {
        botSay(
          `Your booking #${bookingId} has been cancelled. A confirmation email is on its way.`,
          "success"
        );
        finish();
        onBookingChanged?.();
      },
      "We could not cancel your booking. Please try again.",
      (status) => {
        if (FINAL_STATUSES.includes(status)) {
          finish();
        }
      }
    );
  }

  function keepBooking() {
    userSay("Keep booking");
    botSay("No problem. Your booking has not been changed.");
    finish();
  }

  /*
   * Called by the booking form in edit mode. A thrown error is
   * shown by the form; errors that end the conversation are
   * also posted to the chat.
   */
  async function submitEdit(payload: BookingPayload) {
    const current = session.current;

    if (!token) {
      throw new Error(EXPIRED_MESSAGE);
    }

    try {
      await updateBooking(token, bookingType, payload);
    } catch (error) {
      const failure = toBookingError(
        error,
        "We could not save your changes. Please try again."
      );

      if (
        current === session.current &&
        FINAL_STATUSES.includes(failure.status)
      ) {
        botSay(failure.message, "error");
        finish();
      }

      throw failure;
    }

    if (current !== session.current) {
      return;
    }

    setEditOpen(false);
    botSay(
      `Your changes were saved. Booking #${bookingId} is now pending admin approval again.`,
      "success"
    );
    finish();
    onBookingChanged?.();
  }

  // ==========================================================
  // CONTROLS FOR THE CURRENT STEP
  // ==========================================================

  function renderControls() {
    switch (step) {
      case "action":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => chooseAction("cancel")}
              className={`${quickReplyClass} text-[#03045e] hover:bg-[#03045e] hover:text-white`}
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel a booking
            </button>

            <button
              type="button"
              onClick={() => chooseAction("edit")}
              className={`${quickReplyClass} text-[#03045e] hover:bg-[#03045e] hover:text-white`}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit a booking
            </button>
          </div>
        );

      case "type":
        return (
          <div className="grid grid-cols-2 gap-2">
            {(["room", "ride"] as const).map((type) => {
              const Icon = type === "room" ? DoorOpen : Car;

              const suggested = activeBooking === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => chooseType(type)}
                  className={`${quickReplyClass} ${
                    suggested
                      ? "bg-[#03045e] text-white hover:opacity-90"
                      : "text-[#03045e] hover:bg-[#03045e] hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {type === "room" ? "Room" : "Ride"}
                </button>
              );
            })}
          </div>
        );

      case "bookingId":
        return (
          <form
            onSubmit={submitBookingId}
            className="flex gap-2"
          >
            <input
              type="text"
              inputMode="numeric"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="Booking ID, e.g. 123"
              aria-label="Booking ID"
              disabled={busy}
              autoFocus
              className={inputClass}
            />

            <button
              type="submit"
              disabled={busy || !idInput.trim()}
              aria-label="Send booking ID"
              className={primaryButtonClass}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        );

      case "code":
        return (
          <div className="space-y-2">
            <form
              onSubmit={submitCode}
              className="flex gap-2"
            >
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codeInput}
                onChange={(e) =>
                  setCodeInput(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="6-digit code"
                aria-label="Verification code"
                disabled={busy}
                autoFocus
                className={`${inputClass} tracking-widest`}
              />

              <button
                type="submit"
                disabled={busy || codeInput.length !== 6}
                className={primaryButtonClass}
              >
                Verify
              </button>
            </form>

            <button
              type="button"
              onClick={resendCode}
              disabled={busy}
              className="text-xs font-medium text-[#03045e] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        );

      case "verified":
        if (action === "cancel") {
          return (
            <form
              onSubmit={confirmCancel}
              className="space-y-2"
            >
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
                placeholder="Reason for cancelling"
                aria-label="Reason for cancelling"
                disabled={busy}
                autoFocus
                className={`${inputClass} resize-none`}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={keepBooking}
                  disabled={busy}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Keep booking
                </button>

                <button
                  type="submit"
                  disabled={busy || !reason.trim()}
                  className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel booking
                </button>
              </div>
            </form>
          );
        }

        return (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className={`${primaryButtonClass} w-full`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Open booking form
          </button>
        );

      case "done":
        return (
          <button
            type="button"
            onClick={reset}
            className={`${primaryButtonClass} w-full`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Done
          </button>
        );
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Booking assistant"
          className="fixed bottom-20 right-4 z-40 flex h-[min(32rem,calc(100dvh_-_6.5rem))] w-[calc(100vw_-_2rem)] max-w-[22rem] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:bottom-24 sm:right-6"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 bg-[#03045e] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  EQUIBOOK
                </p>

                <p className="truncate text-[11px] text-white/70">
                  Cancel or edit a booking
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={reset}
                title="Start over"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start over
              </button>

              <button
                type="button"
                onClick={close}
                aria-label="Close booking assistant"
                className="rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            aria-live="polite"
            className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3"
          >
            {messages.map((message) => {
              if (message.card) {
                return (
                  <BookingSummaryCard
                    key={message.id}
                    bookingType={message.card.bookingType}
                    booking={message.card.booking}
                  />
                );
              }

              const isUser = message.from === "user";

              const bubbleClass = isUser
                ? "rounded-tr-sm bg-[#03045e] text-white"
                : message.tone === "error"
                ? "rounded-tl-sm border border-red-200 bg-red-50 text-red-700"
                : message.tone === "success"
                ? "rounded-tl-sm border border-green-200 bg-green-50 text-green-800"
                : "rounded-tl-sm border border-slate-200 bg-white text-slate-700";

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-xs leading-relaxed ${bubbleClass}`}
                  >
                    {message.text}
                  </p>
                </div>
              );
            })}

            {busy && (
              <div className="flex justify-start">
                <p className="flex items-center gap-1.5 rounded-lg rounded-tl-sm border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Please wait...
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-3">
            {renderControls()}
          </div>
        </div>
      )}

      {/* Chat bubble */}
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={
          open
            ? "Close booking assistant"
            : "Cancel or edit a booking"
        }
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#03045e] text-white shadow-lg transition hover:opacity-90 sm:bottom-6 sm:right-6"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {editOpen && booking && (
        <EditBookingModal
          bookingType={bookingType}
          booking={booking}
          onClose={() => setEditOpen(false)}
          onSubmitEdit={submitEdit}
        />
      )}
    </>
  );
}
