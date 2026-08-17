"use client";

import Calendar from "@/components/shared/Calendar";

export interface RideBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  pickup_location: string;
  dropoff_destination: string;
  employee: string;
  purpose: string;
  passengers_count: number;
  roundtrip: boolean;
  status: "approved" | "pending";
}

interface RideCalendarProps {
  bookings: RideBooking[];
  onDateChange: (date: string) => void;
  onBookingClick?: (bookingId: string) => void;
}

export default function RideCalendar({
  bookings,
  onDateChange,
  onBookingClick,
}: RideCalendarProps) {
  const events = bookings.map((booking) => ({
    id: booking.id,
    title: booking.dropoff_destination,
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