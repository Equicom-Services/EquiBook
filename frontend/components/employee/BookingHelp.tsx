"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";

/*
 * "How do I use this page?" for employees.
 *
 * One guide for the whole employee page: how to get around it,
 * and how to fill in each of the two request forms. It is opened
 * from both the room and the ride panel, and lands on whichever
 * of them the reader was looking at.
 *
 * Every step below matches a field that is actually on screen,
 * and the answers explain the rules the forms enforce quietly -
 * the room window and its blocked slots, the ride round trip,
 * and what happens to a request once it is submitted.
 */

type Topic = "getting-around" | "room" | "ride";

const TABS: { id: Topic; label: string }[] = [
  { id: "getting-around", label: "Getting around" },
  { id: "room", label: "Room bookings" },
  { id: "ride", label: "Ride bookings" },
];

interface BookingHelpProps {
  /*
   * The panel the button was pressed in, so the guide opens on
   * the form the reader is filling in.
   */
  topic: "room" | "ride";
}

export default function BookingHelp({
  topic,
}: BookingHelpProps) {
  const [open, setOpen] = useState(false);

  const [tab, setTab] = useState<Topic>(topic);

  const closeButton = useRef<HTMLButtonElement>(null);

  const body = useRef<HTMLDivElement>(null);

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

  function show() {
    // Always open on this panel's own section, however the
    // guide was left last time.
    setTab(topic);
    setOpen(true);
  }

  function chooseTab(next: Topic) {
    setTab(next);

    // A tab switched halfway down a long section would
    // otherwise start the new one mid-way.
    body.current?.scrollTo({ top: 0 });
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="How to use this page"
        aria-haspopup="dialog"
        title="How to use this page"
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
            aria-labelledby="booking-help-title"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-md bg-white shadow-2xl"
          >
            {/* HEADER */}

            <div className="shrink-0 bg-[#03045e] text-white">
              <div className="flex items-start justify-between gap-4 px-6 pt-4 pb-3">
                <div>
                  <h2
                    id="booking-help-title"
                    className="text-base font-semibold"
                  >
                    How to use Equibook
                  </h2>

                  <p className="mt-0.5 text-xs text-white/70">
                    Finding your way around this page, and
                    booking a room or a ride.
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

              {/* TABS */}

              <div
                role="tablist"
                aria-label="Guide sections"
                className="flex gap-1 px-4"
              >
                {TABS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === entry.id}
                    onClick={() => chooseTab(entry.id)}
                    className={`rounded-t-md px-3 py-2 text-xs font-semibold transition ${
                      tab === entry.id
                        ? "bg-white text-[#03045e]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BODY */}

            <div
              ref={body}
              role="tabpanel"
              className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
            >
              {tab === "getting-around" && <GettingAround />}
              {tab === "room" && <RoomGuide />}
              {tab === "ride" && <RideGuide />}
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

// ==============================================================
// GETTING AROUND
// ==============================================================

function GettingAround() {
  return (
    <>
      <Section title="What is on this page">
        <ol className="space-y-3">
          <Step number={1} title="Rooms or Ride">
            The two buttons at the top of the page switch between
            booking a meeting room and booking a company ride.
            Everything below them changes with the choice.
          </Step>

          <Step number={2} title="Three panels">
            <Ui>Bookings Overview</Ui> on the left is the
            calendar, the middle lists what is already booked on
            the date you picked, and the request form is on the
            right. On a narrow screen they sit one under the
            other, so scroll down to reach the form.
          </Step>

          <Step number={3} title="Branch">
            The dropdown above the calendar filters what you are
            looking at by office. <Ui>All Branches</Ui> shows them
            all at once, each with its own colour.
          </Step>

          <Step number={4} title="Pick a date">
            Clicking a date in the calendar fills the middle
            panel with that day&apos;s bookings, and sets the
            first date on the form beside it. Check the middle
            panel before filling anything in - it shows what is
            already taken.
          </Step>

          <Step number={5} title="Send the request">
            Fill in the form, submit, and check the summary that
            appears before anything is sent. A confirmation email
            follows with your <Ui>Booking ID</Ui>.
          </Step>
        </ol>
      </Section>

      <Section title="Questions">
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          <Faq question="Do I need an account?">
            No. Anyone can submit a request - only admins log in,
            to review them.
          </Faq>

          <Faq question="How do I cancel or change a booking?">
            Use the blue chat button in the bottom-right corner
            of this page and choose <Ui>Cancel a booking</Ui> or{" "}
            <Ui>Edit a booking</Ui>. You will need the Booking ID
            from your confirmation email and a 6-digit code that
            is emailed to you when you start. An edited booking
            goes back to pending, so it needs to be approved
            again.
          </Faq>

          <Faq question="Where do I find my Booking ID?">
            In the confirmation email you are sent as soon as the
            request goes in, and in every email about it
            afterwards. It is the number that identifies your
            booking when you cancel or change it.
          </Faq>

          <Faq question="My name is not in the suggestions.">
            Type your name and company email in yourself. The
            suggestions come from the employee directory and are
            only a shortcut - a request typed in manually is
            exactly as valid.
          </Faq>

          <Faq question="What emails will I get?">
            One when the request is received, and one when it is
            approved or rejected. A small note appears in the
            corner of the screen whenever the system has sent an
            email, so you know to check your inbox.
          </Faq>

          <Faq question="It is still pending. What now?">
            Approvals are done by hand by the site admin, so a
            request waits until someone reviews it. You are
            emailed the moment it is decided - there is no need
            to submit it again.
          </Faq>
        </div>
      </Section>
    </>
  );
}

// ==============================================================
// ROOMS
// ==============================================================

function RoomGuide() {
  return (
    <>
      <Section title="Filling in the room form">
        <ol className="space-y-3">
          <Step number={1} title="Pick the date">
            Click a date in <Ui>Bookings Overview</Ui> on the
            left. The bookings already made for that date are
            listed in the middle, and the date is carried into
            the first reservation on the form.
          </Step>

          <Step number={2} title="Name and company email">
            Start typing your name and choose yourself from the
            suggestions - your company email is filled in for
            you. If you are not in the list, type both in
            yourself.
          </Step>

          <Step number={3} title="Site, then room">
            Choose the site first; the rooms for that site load
            into the <Ui>Room</Ui> list. Picking a different room
            clears the times you have chosen, because every room
            has its own free slots.
          </Step>

          <Step number={4} title="Date, start and end time">
            Rooms can be booked from <Ui>6:00 AM</Ui> to{" "}
            <Ui>10:00 PM</Ui>, in half-hour steps. The end time
            has to be later than the start time, and only slots
            that are still free are offered.
          </Step>

          <Step number={5} title="Need more than one day?">
            <Ui>+ Add Another Date</Ui> adds another reservation
            to the same form. Each date is sent as its own
            request and is approved or rejected on its own.{" "}
            <Ui>Remove</Ui> takes one back off.
          </Step>

          <Step number={6} title="Purpose">
            Say what the room is for. The admin reviewing the
            request sees this, so a short line such as
            &quot;Client meeting&quot; or &quot;Team
            training&quot; is enough.
          </Step>

          <Step number={7} title="Submit">
            <Ui>Submit Room Request</Ui> opens a summary to check
            before anything is sent. Confirm it and a
            confirmation email follows with your{" "}
            <Ui>Booking ID</Ui>.
          </Step>
        </ol>
      </Section>

      <Section title="After you submit">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Your request starts as <Ui>Pending</Ui>. An admin for
            that site reviews it, and you are emailed once it is
            approved or rejected.
          </li>

          <li>
            A pending request does not hold the room. If someone
            else&apos;s request for the same room and time is
            approved first, yours is rejected automatically and
            you are emailed about it.
          </li>

          <li>
            To cancel or change it later, use the chat button in
            the bottom-right corner with the Booking ID from your
            confirmation email.
          </li>
        </ul>
      </Section>

      <Section title="Questions">
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          <Faq question="Why is a time greyed out or missing?">
            Greyed-out times are already taken by an approved
            booking for that room. For today, times that have
            already passed drop off the list, and an end time
            cannot run past the next booking that is already
            approved.
          </Faq>

          <Faq question="Why can I not choose a room?">
            The room list only loads once a site is selected. If
            it says <Ui>No rooms available</Ui>, that site has no
            rooms set up yet - ask your site admin.
          </Faq>

          <Faq question="Can I book the same room for several days?">
            Yes. Use <Ui>+ Add Another Date</Ui> for each date
            you need. They are submitted together but reviewed
            separately, so one can be approved while another is
            not.
          </Faq>

          <Faq question="Can I book for later today?">
            Yes, as long as the start time has not passed. The
            time lists refresh as the day goes on.
          </Faq>
        </div>
      </Section>
    </>
  );
}

// ==============================================================
// RIDES
// ==============================================================

function RideGuide() {
  return (
    <>
      <Section title="Filling in the ride form">
        <ol className="space-y-3">
          <Step number={1} title="Pick the date">
            Click a date in <Ui>Bookings Overview</Ui> on the
            left. The rides already booked for that date are
            listed in the middle, and the date is carried into
            the first trip on the form.
          </Step>

          <Step number={2} title="Name and company email">
            Start typing your name and choose yourself from the
            suggestions - your company email is filled in for
            you. If you are not in the list, type both in
            yourself.
          </Step>

          <Step number={3} title="Site and passengers">
            The site is the office the ride belongs to, and its
            admins are the ones who review it.{" "}
            <Ui>Passenger Count</Ui> is everyone travelling,
            yourself included, so it is at least 1.
          </Step>

          <Step number={4} title="Travel date and departure time">
            Departure times are in half-hour steps and cover the
            whole day, so an early start or a late trip is fine.
            For today, times that have already passed are not
            offered.
          </Step>

          <Step number={5} title="Round trip">
            Tick <Ui>Round Trip</Ui> if you need the ride back as
            well, and fill in <Ui>Return Pickup</Ui> - a date and
            time, so a return the next day is fine - together
            with the <Ui>Return Drop-off Location</Ui>. It is set
            per travel date, so one date can be a round trip
            while another is one way.
          </Step>

          <Step number={6} title="Need more than one trip?">
            <Ui>+ Add Another Date</Ui> adds another trip to the
            same form, each sent as its own reservation. The same
            date and departure time cannot be listed twice.
          </Step>

          <Step number={7} title="Pickup and drop-off">
            Write out where the driver should collect you and
            where you are going. The{" "}
            <Ui>Google Maps Link</Ui> beside each is optional,
            but worth adding for an address the driver may not
            know.
          </Step>

          <Step number={8} title="Purpose, then submit">
            Say what the trip is for, then{" "}
            <Ui>Submit Ride Request</Ui> and check the summary
            before confirming. A confirmation email follows with
            your <Ui>Booking ID</Ui>.
          </Step>
        </ol>
      </Section>

      <Section title="After you submit">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Your request starts as <Ui>Pending</Ui>. An admin for
            that site reviews it, and you are emailed once it is
            approved or rejected.
          </li>

          <li>
            Ride requests are not checked against each other, so
            the times offered are never blocked by someone
            else&apos;s trip. The admin is the one who decides
            what the vehicles can cover, which is why a request
            can be turned down even when nothing looks taken.
          </li>

          <li>
            To cancel or change it later, use the chat button in
            the bottom-right corner with the Booking ID from your
            confirmation email.
          </li>
        </ul>
      </Section>

      <Section title="Questions">
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          <Faq question="Do I have to add a Google Maps link?">
            No, all three are optional. They only help the driver
            find a pickup or destination that is not an office
            everybody knows.
          </Faq>

          <Faq question="What exactly is Return Pickup?">
            The date and time the driver should collect you for
            the trip back. It is a full date and time rather than
            just a time, so an overnight or next-day return is
            fine.
          </Faq>

          <Faq question="Can one trip be a round trip and another one way?">
            Yes. <Ui>Round Trip</Ui> belongs to each travel date,
            so tick it only on the dates that need it.
          </Faq>

          <Faq question='It says a reservation "appears more than once".'>
            Two of the trips on the form have the same travel
            date and departure time. Change one of them or remove
            it, then submit again.
          </Faq>

          <Faq question="Why is my departure time missing?">
            For today, times that have already passed drop off
            the list. Pick a later time, or a later date.
          </Faq>
        </div>
      </Section>
    </>
  );
}

// ==============================================================
// SHARED PIECES
// ==============================================================

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
 * the forms rather than describing them.
 */
function Ui({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-slate-800">
      {children}
    </span>
  );
}
