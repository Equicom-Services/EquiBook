"use client";

import { useState } from "react";
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
  status: "approved" | "pending";
}

const mockBookings: RoomBooking[] = [
  {
    id: "1",
    title: "Team Meeting",
    start: "2026-08-17T09:00:00",
    end: "2026-08-17T10:30:00",
    room: "Conference Room A",
    employee: "Sarah Lim",
    purpose: "Weekly team meeting",
    status: "approved",
  },
  {
    id: "2",
    title: "Client Discussion",
    start: "2026-08-17T13:00:00",
    end: "2026-08-17T15:00:00",
    room: "Conference Room B",
    employee: "John Cruz",
    purpose: "Client discussion",
    status: "approved",
  },
  {
    id: "3",
    title: "Project Meeting",
    start: "2026-08-20T10:00:00",
    end: "2026-08-20T11:30:00",
    room: "Conference Room A",
    employee: "Michael Tan",
    purpose: "Project planning",
    status: "approved",
  },
];

export default function RoomBookingPage() {
  const [selectedDate, setSelectedDate] = useState("2026-08-17");

  const selectedBookings = mockBookings.filter((booking) =>
    booking.start.startsWith(selectedDate)
  );

  const calendarEvents = mockBookings.map((booking) => ({
    id: booking.id,
    title: booking.room,
    start: booking.start,
    end: booking.end,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1800px]">

        {/* Page Header - Added px-6 to match card padding */}
        <div className="mb-6 px-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Room Reservation
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View room bookings and submit a new reservation request.
          </p>
        </div>

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