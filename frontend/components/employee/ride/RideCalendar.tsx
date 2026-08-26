"use client";

import Calendar from "@/components/shared/Calendar";

export interface RideBooking {
  ride_reservation_id: number;

  request_date_time: string;

  employee_name: string;
  employee_email: string;

  site_id: number;
  site?: string;

  travel_date: string;
  departure_time: string;

  roundtrip: boolean;
  return_pickup: string | null;

  pickup_location: string;
  pickup_maps_link: string | null;

  dropoff_destination: string;
  drop_off_maps_link: string | null;

  return_drop_off_location: string | null;
  return_drop_off_maps_link: string | null;

  purpose: string;
  passenger_count: number;

  vehicle_type: string | null;

  status: string;
  admin_remarks: string | null;

  approved_rejected_by: number | null;
  approved_rejected_date_time: string | null;

  calendar_event_id: string | null;

  created_at: string;
  updated_at: string;
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
  const events = bookings.map((booking) => {
    const start = `${booking.travel_date}T${booking.departure_time}`;

    return {
      id: String(booking.ride_reservation_id),

      title: booking.dropoff_destination,

      start,

      // Backend does not currently provide an end time.
      end: start,
    };
  });

  return (
    <Calendar
      events={events}
      onDateClick={onDateChange}
      onEventClick={onBookingClick}
    />
  );
}