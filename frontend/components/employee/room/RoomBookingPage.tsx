"use client";

import { useState, useEffect } from "react";
import Calendar from "@/components/shared/Calendar";
import RoomBookingDetails from "./RoomBookingDetails";
import RoomRequestForm from "./RoomRequestForm";

interface RoomBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  room: string;
  employee: string;
  purpose: string;
  status: "approved";
}

interface RoomRequestResponse {
  room_reservation_id: number;
  request_date_time: string;

  room_id: number;

  employee_name: string;
  employee_email: string;

  reservation_date: string;
  start_time: string;
  end_time: string;

  duration_minutes: number;
  purpose: string;

  status: string;
  admin_remarks: string | null;

  approved_rejected_by: string | null;
  approved_rejected_date_time: string | null;

  calendar_event_id: string | null;

  created_at: string;
  updated_at: string;

  room: string;
  site: string;
}

export default function RoomBookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

useEffect(() => {
  async function fetchBookings() {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/room-requests/approved`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch room bookings: ${response.status}`
        );
      }

      const data: RoomRequestResponse[] =
        await response.json();

      console.log("Approved room bookings from API:", data);

      const actualBookings: RoomBooking[] = data
        .filter(
          (request) =>
            request.status.toLowerCase() === "approved"
        )
        .map((request) => ({
          id: String(request.room_reservation_id),

          title: request.room,

          start: `${request.reservation_date}T${request.start_time}`,

          end: `${request.reservation_date}T${request.end_time}`,

          room: request.room,

          employee: request.employee_name,

          purpose: request.purpose,

          status: "approved",
        }));

      setBookings(actualBookings);
    } catch (error) {
      console.error(
        "Error fetching room bookings:",
        error
      );

      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }

  fetchBookings();
}, []);
  /*
   * Get bookings for the selected date.
   */
  const selectedBookings = bookings.filter(
    (booking) =>
      booking.start.split("T")[0] === selectedDate
  );

  /*
   * Convert database bookings into Calendar events.
   */
  const calendarEvents = bookings.map((booking) => ({
    id: booking.id,
    title: booking.room,
    start: booking.start,
    end: booking.end,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1800px]">

        {/* Page Header */}
        <div className="mb-6 px-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Room Reservation
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View room bookings and submit a new reservation request.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mb-6 rounded-md bg-white p-4 text-sm text-slate-500">
            Loading room bookings...
          </div>
        )}

        {/* Calendar + Bookings + Form */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr_1.2fr]">

          {/* Calendar */}
          <div className="rounded-md bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold">
              Bookings Overview
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              Select a date to view room bookings.
            </p>

            <Calendar
              events={calendarEvents}
              onDateClick={(date) => {
                setSelectedDate(date);
              }}
            />
          </div>

          {/* Current Bookings */}
          <div className="rounded-md bg-white p-6">
            <RoomBookingDetails
              selectedDate={selectedDate}
              bookings={selectedBookings}
            />
          </div>

          {/* Request Form */}
          <div className="rounded-md bg-white p-6">
            <h2 className="text-lg font-semibold">
              New Room Request
            </h2>

            <p className="mt-1 mb-6 text-sm text-slate-500">
              Fill in the details below to request a room.
            </p>

            <RoomRequestForm selectedDate={selectedDate} />
          </div>

        </div>
      </div>
    </div>
  );
}