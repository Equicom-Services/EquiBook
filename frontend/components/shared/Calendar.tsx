"use client";

import { useMemo } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import "./calendar.css";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  status?: "approved" | "pending";
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: string) => void;
  onEventClick?: (eventId: string) => void;

  /*
   * Collapse every booking on a day into a single dot instead
   * of listing them. A month with many bookings stays readable,
   * and the details panel beside it carries the specifics.
   */
  showEventsAsDots?: boolean;

  /*
   * Marks the day the details panel is showing. Without the
   * event chips there is nothing else to confirm which day was
   * clicked.
   */
  selectedDate?: string;
}

/*
 * Format a Date as YYYY-MM-DD in local time.
 *
 * toISOString would shift the day for anyone east of UTC.
 */
function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function Calendar({
  events,
  onDateClick,
  onEventClick,
  showEventsAsDots = false,
  selectedDate,
}: CalendarProps) {
  /*
   * One synthetic all day event per booking.
   *
   * Each becomes a dot, so a day shows as many dots as it has
   * bookings. They are all day events on purpose: that keeps
   * the day number where it is and drops the time text.
   */
  const dotEvents = useMemo(() => {
    if (!showEventsAsDots) {
      return [];
    }

    return events.map((event) => ({
      id: `dot-${event.id}`,
      title: "",
      start: event.start.split("T")[0],
      allDay: true,
    }));
  }, [events, showEventsAsDots]);

  return (
    <div
      className={
        showEventsAsDots
          ? "reservation-calendar is-dot-mode"
          : "reservation-calendar"
      }
    >
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={showEventsAsDots ? dotEvents : events}

        // Maximum number of events shown inside each day.
        // Dots are small enough to all fit, so they are never
        // collapsed behind a "+X more" link.
        dayMaxEvents={showEventsAsDots ? false : 3}

        // Clicking "+X more" opens the event popover
        moreLinkClick="popover"

        eventContent={
          showEventsAsDots
            ? () => (
                <span className="calendar-booking-dot" />
              )
            : undefined
        }

        dayCellClassNames={(arg) =>
          selectedDate &&
          toDateKey(arg.date) === selectedDate
            ? ["is-selected-day"]
            : []
        }

        dateClick={(info) => {
          onDateClick?.(info.dateStr);
        }}

        eventClick={(info) => {
          /*
           * A click landing on the dot rather than the cell
           * still selects the day, otherwise the dot would be
           * a dead spot in the middle of the date.
           */
          if (showEventsAsDots) {
            onDateClick?.(
              toDateKey(info.event.start ?? new Date())
            );
            return;
          }

          onEventClick?.(info.event.id);
        }}

        headerToolbar={{
          left: "prev",
          center: "title",
          right: "next",
        }}
      />
    </div>
  );
}