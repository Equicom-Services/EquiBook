"use client";

import RideRequestCard from "./RideRequestCard";

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

interface RideRequestsProps {
  status: "all" | "pending" | "approved" | "rejected";
}

export default function RideRequests({
  status,
}: RideRequestsProps) {
  // Temporary data
  // This will eventually come from your FastAPI backend.
  const bookings: RideBooking[] = [
    {
      id: "1",
      title: "Client Meeting",
      start: "2026-08-18T08:00:00",
      end: "2026-08-18T10:00:00",
      pickup_location: "Main Office",
      dropoff_destination: "Makati Office",
      employee: "Juan Dela Cruz",
      purpose: "Client meeting",
      passengers_count: 3,
      roundtrip: true,
      status: "pending",
    },
    {
      id: "2",
      title: "Site Visit",
      start: "2026-08-18T13:00:00",
      end: "2026-08-18T16:00:00",
      pickup_location: "Main Office",
      dropoff_destination: "Laguna Site",
      employee: "Maria Santos",
      purpose: "Project site inspection",
      passengers_count: 5,
      roundtrip: true,
      status: "approved",
    },
  ];

  const filteredBookings =
    status === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === status);

  if (filteredBookings.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          No ride requests found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredBookings.map((booking) => (
        <RideRequestCard
          key={booking.id}
          booking={booking}
        />
      ))}
    </div>
  );
}