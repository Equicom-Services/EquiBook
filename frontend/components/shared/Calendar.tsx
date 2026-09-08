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

  // Event colour in chip mode. Dot mode ignores it: every dot
  // uses the single booking colour.
  color?: string;
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
// Most dots drawn in a day cell, no matter how many bookings
// it holds.
const MAX_DOTS = 3;

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
   * One synthetic all day event per *day* that has bookings,
   * carrying that day's booking count.
   *
   * Aggregating here — rather than one event per booking —
   * is what lets a busy day cap its dots at three while the
   * hover tooltip still reports the real total. They are all
   * day events on purpose: that keeps the day number where it
   * is and drops the time text.
   */
  const dotEvents = useMemo(() => {
    if (!showEventsAsDots) {
      return [];
    }

    const countsByDay = new Map<string, number>();

    events.forEach((event) => {
      const day = event.start.split("T")[0];

      countsByDay.set(
        day,
        (countsByDay.get(day) ?? 0) + 1
      );
    });

    return Array.from(countsByDay, ([day, count]) => ({
      id: `dot-${day}`,
      title: "",
      start: day,
      allDay: true,
      extendedProps: { count },
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
            ? (arg) => {
                const count =
                  (arg.event.extendedProps.count as number) ??
                  0;

                // Never more than three dots, however busy the
                // day is — the count carries the rest.
                const dots = Math.min(count, MAX_DOTS);

                return (
                  <span
                    className="calendar-booking-dots"
                    data-count={`${count} ${
                      count === 1 ? "booking" : "bookings"
                    }`}
                  >
                    {Array.from({ length: dots }, (_, i) => (
                      <span
                        key={i}
                        className="calendar-booking-dot"
                      />
                    ))}
                  </span>
                );
              }
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