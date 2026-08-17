"use client";

import Calendar from "@/components/shared/Calendar";

export interface RoomBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  room: string;
  employee: string;
  purpose: string;
  status: "approved" | "pending";
}

interface RoomCalendarProps {
  bookings: RoomBooking[];
  onDateChange: (date: string) => void;
  onBookingClick?: (bookingId: string) => void;
}

export default function RoomCalendar({
  bookings,
  onDateChange,
  onBookingClick,
}: RoomCalendarProps) {
  const events = bookings.map((booking) => ({
    id: booking.id,
    title: booking.room,
    start: booking.start,
    end: booking.end,
  }));

  return (
    <Calendar
      events={events}
      onDateClick={onDateChange}
      onEventClick={onBookingClick}
    />
  );
}