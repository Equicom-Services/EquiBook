"use client";

import { useState } from "react";

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

interface RoomBookingDetailsProps {
  selectedDate: string;
  bookings: RoomBooking[];
}

export default function RoomBookingDetails({
  selectedDate,
  bookings,
}: RoomBookingDetailsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const formattedDate = new Date(
    `${selectedDate}T00:00:00`
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const filteredBookings = bookings.filter((booking) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      booking.room.toLowerCase().includes(query) ||
      booking.title.toLowerCase().includes(query) ||
      booking.employee.toLowerCase().includes(query) ||
      booking.purpose.toLowerCase().includes(query) ||
      booking.status.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Bookings for {formattedDate}
      </h2>

      {/* Search Bar */}
      <div className="mt-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search room, booking, employee, or purpose..."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />
      </div>

      {bookings.length === 0 ? (
        <div className="mt-5 flex min-h-[250px] items-center justify-center rounded-md bg-slate-50">
          <p className="text-sm text-slate-500">
            No room bookings for this date.
          </p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-5 flex min-h-[200px] items-center justify-center rounded-md bg-slate-50">
          <p className="text-sm text-slate-500">
            No bookings match your search.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {filteredBookings.map((booking) => {
            const startTime = new Date(
              booking.start
            ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            const endTime = new Date(
              booking.end
            ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={booking.id}
                className="rounded-md border border-slate-200 p-4"
              >
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {/* Room */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Room
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {booking.room}
                    </h3>
                  </div>

                  {/* Booking */}
                  {/* <div>
                    <p className="text-xs text-slate-400">
                      Booking
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {booking.title}
                    </p>
                  </div> */}

                  {/* Time */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Time
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {startTime} – {endTime}
                    </p>
                  </div>

                  {/* Requested By */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Requested by
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.employee}
                    </p>
                  </div>

                  {/* Purpose */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Purpose
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.purpose}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-end justify-end">
                    <span
                      className={
                        booking.status === "approved"
                          ? "rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                          : "rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
                      }
                    >
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}