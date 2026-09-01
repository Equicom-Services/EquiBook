"use client";

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
}

export default function Calendar({
  events,
  onDateClick,
  onEventClick,
}: CalendarProps) {
  return (
    <div className="reservation-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={events}

        // Maximum number of events shown inside each day
        dayMaxEvents={3}

        // Clicking "+X more" opens the event popover
        moreLinkClick="popover"

        dateClick={(info) => {
          onDateClick?.(info.dateStr);
        }}

        eventClick={(info) => {
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