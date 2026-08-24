"use client";

import { useState } from "react";
import Calendar from "@/components/shared/Calendar";
import RideBookingDetails from "./RideBookingDetails";
import RideRequestForm from "./RideRequestForm";

interface RideBooking {
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

const mockBookings: RideBooking[] = [
  {
    id: "1",
    title: "Company Ride",
    start: "2026-08-17T09:00:00",
    end: "2026-08-17T10:30:00",
    pickup_location: "Main Office",
    dropoff_destination: "Makati City",
    employee: "Sarah Lim",
    purpose: "Client meeting",
    passengers_count: 3,
    roundtrip: true,
    status: "approved",
  },
  {
    id: "2",
    title: "Business Trip",
    start: "2026-08-17T13:00:00",
    end: "2026-08-17T15:00:00",
    pickup_location: "Branch Office",
    dropoff_destination: "BGC",
    employee: "John Cruz",
    purpose: "Client discussion",
    passengers_count: 2,
    roundtrip: false,
    status: "approved",
  },
  {
    id: "3",
    title: "Site Visit",
    start: "2026-08-20T10:00:00",
    end: "2026-08-20T11:30:00",
    pickup_location: "Main Office",
    dropoff_destination: "Quezon City",
    employee: "Michael Tan",
    purpose: "Project site visit",
    passengers_count: 4,
    roundtrip: true,
    status: "approved",
  },
];

export default function RideBookingPage() {
  const [selectedDate, setSelectedDate] = useState("2026-08-17");

  const selectedBookings = mockBookings.filter((booking) =>
    booking.start.startsWith(selectedDate)
  );

  const calendarEvents = mockBookings.map((booking) => ({
    id: booking.id,
    title: booking.dropoff_destination,
    start: booking.start,
    end: booking.end,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1800px]">
        {/* Page Header - Added px-6 to match card inner padding */}
        <div className="mb-6 px-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Ride Reservation
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View ride bookings and submit a new reservation request.
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
              Select a date to view ride bookings.
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
            <RideBookingDetails
              selectedDate={selectedDate}
              bookings={selectedBookings}
            />
          </div>

          {/* Request Form */}
          <div className="rounded-md bg-white p-6">
            <h2 className="text-lg font-semibold">
              New Ride Request
            </h2>

            <p className="mt-1 mb-6 text-sm text-slate-500">
              Fill in the details below to request a company ride.
            </p>

            <RideRequestForm selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}