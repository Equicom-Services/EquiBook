"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";

/*
 * "How do I book a room?" for the employee page.
 *
 * The guide walks the room request form in the order it is
 * filled in, so every step below matches a field that is
 * actually on screen, and the answers explain the rules the
 * form enforces silently - the 6 AM to 10 PM window, the time
 * slots it greys out, and what happens to a request after it
 * is submitted.
 */
export default function RoomBookingHelp() {
  const [open, setOpen] = useState(false);

  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButton.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How to book a room"
        aria-haspopup="dialog"
        title="How to book a room"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-[#03045e] hover:bg-[#03045e] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#03045e]/30"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-help-title"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-md bg-white shadow-2xl"
          >
            {/* HEADER */}

            <div className="flex shrink-0 items-start justify-between gap-4 bg-[#03045e] px-6 py-4 text-white">
              <div>
                <h2
                  id="room-help-title"
                  className="text-base font-semibold"
                >
                  How to book a room
                </h2>

                <p className="mt-0.5 text-xs text-white/70">
                  A short guide to the form on this page.
                </p>
              </div>

              <button
                ref={closeButton}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-1 rounded p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <Section title="Filling in the form">
                <ol className="space-y-3">
                  <Step number={1} title="Pick the date">
                    Click a date in <Ui>Bookings Overview</Ui> on
                    the left. The bookings already made for that
                    date are listed in the middle, and the date is
                    carried into the first reservation on the form.
                  </Step>

                  <Step number={2} title="Name and company email">
                    Start typing your name and choose yourself from
                    the suggestions - your company email is filled
                    in for you. If you are not in the list, type
                    both in yourself.
                  </Step>

                  <Step number={3} title="Site, then room">
                    Choose the site first; the rooms for that site
                    load into the <Ui>Room</Ui> list. Picking a
                    different room clears the times you have chosen,
                    because every room has its own free slots.
                  </Step>

                  <Step number={4} title="Date, start and end time">
                    Rooms can be booked from <Ui>6:00 AM</Ui> to{" "}
                    <Ui>10:00 PM</Ui>, in half-hour steps. The end
                    time has to be later than the start time, and
                    only slots that are still free are offered.
                  </Step>

                  <Step number={5} title="Need more than one day?">
                    <Ui>+ Add Another Date</Ui> adds another
                    reservation to the same form. Each date is sent
                    as its own request and is approved or rejected
                    on its own. <Ui>Remove</Ui> takes one back off.
                  </Step>

                  <Step number={6} title="Purpose">
                    Say what the room is for. The admin reviewing
                    the request sees this, so a short line such as
                    &quot;Client meeting&quot; or &quot;Team
                    training&quot; is enough.
                  </Step>

                  <Step number={7} title="Submit">
                    <Ui>Submit Room Request</Ui> opens a summary to
                    check before anything is sent. Confirm it and a
                    confirmation email follows with your{" "}
                    <Ui>Booking ID</Ui>.
                  </Step>
                </ol>
              </Section>

              <Section title="After you submit">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Your request starts as <Ui>Pending</Ui>. An
                    admin for that site reviews it, and you are
                    emailed once it is approved or rejected.
                  </li>

                  <li>
                    A pending request does not hold the room. If
                    someone else&apos;s request for the same room
                    and time is approved first, yours is rejected
                    automatically and you are emailed about it.
                  </li>

                  <li>
                    Keep the confirmation email. The{" "}
                    <Ui>Booking ID</Ui> in it is what you need to
                    cancel or change the booking later.
                  </li>
                </ul>
              </Section>

              <Section title="Questions">
                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  <Faq question="Do I need an account?">
                    No. Anyone can submit a request - only admins
                    log in, to review them.
                  </Faq>

                  <Faq question="Why is a time greyed out or missing?">
                    Greyed-out times are already taken by an
                    approved booking for that room. For today,
                    times that have already passed drop off the
                    list, and an end time cannot run past the next
                    booking that is already approved.
                  </Faq>

                  <Faq question="Why can I not choose a room?">
                    The room list only loads once a site is
                    selected. If it says <Ui>No rooms available</Ui>
                    , that site has no rooms set up yet - ask your
                    site admin.
                  </Faq>

                  <Faq question="My name is not in the suggestions.">
                    Type your name and company email in yourself.
                    The suggestions come from the employee
                    directory and are only a shortcut - a request
                    typed in manually is exactly as valid.
                  </Faq>

                  <Faq question="Can I book the same room for several days?">
                    Yes. Use <Ui>+ Add Another Date</Ui> for each
                    date you need. They are submitted together but
                    reviewed separately, so one can be approved
                    while another is not.
                  </Faq>

                  <Faq question="Can I book for later today?">
                    Yes, as long as the start time has not passed.
                    The time lists refresh as the day goes on.
                  </Faq>

                  <Faq question="How do I cancel or change a booking?">
                    Use the blue chat button in the bottom-right
                    corner of this page and choose{" "}
                    <Ui>Cancel a booking</Ui> or{" "}
                    <Ui>Edit a booking</Ui>. You will need the
                    Booking ID from your confirmation email and a
                    6-digit code that is emailed to you. An edited
                    booking goes back to pending, so it needs to be
                    approved again.
                  </Faq>

                  <Faq question="It is still pending. What now?">
                    Approvals are done by hand by the site admin,
                    so a request waits until someone reviews it.
                    You are emailed the moment it is decided -
                    there is no need to submit it again.
                  </Faq>
                </div>
              </Section>
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <div className="text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#03045e]/10 text-xs font-semibold text-[#03045e]">
        {number}
      </span>

      <div>
        <p className="font-medium text-slate-800">{title}</p>

        <p className="mt-0.5">{children}</p>
      </div>
    </li>
  );
}

function Faq({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group py-3">
      <summary className="cursor-pointer list-none font-medium text-slate-800 marker:content-none">
        <span className="inline-flex w-full items-center justify-between gap-3">
          {question}

          <span className="shrink-0 text-slate-400 transition group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>

      <p className="mt-2 pr-6">{children}</p>
    </details>
  );
}

/*
 * A label the reader can find on screen, so the guide points at
 * the form rather than describing it.
 */
function Ui({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-slate-800">
      {children}
    </span>
  );
}
