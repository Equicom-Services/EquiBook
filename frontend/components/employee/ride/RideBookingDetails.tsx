"use client";

import { useState } from "react";

interface RideReservation {
  ride_reservation_id: number;
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
}

interface RideBookingDetailsProps {
  selectedDate: string;
  bookings: RideReservation[];
}

export default function RideBookingDetails({
  selectedDate,
  bookings,
}: RideBookingDetailsProps) {
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
      (booking.vehicle_type ?? "")
        .toLowerCase()
        .includes(query) ||
      booking.pickup_location
        .toLowerCase()
        .includes(query) ||
      booking.dropoff_destination
        .toLowerCase()
        .includes(query) ||
      booking.employee_name
        .toLowerCase()
        .includes(query) ||
      booking.employee_email
        .toLowerCase()
        .includes(query) ||
      (booking.site ?? "")
        .toLowerCase()
        .includes(query) ||
      booking.purpose
        .toLowerCase()
        .includes(query) ||
      booking.status
        .toLowerCase()
        .includes(query) ||
      (booking.roundtrip ? "roundtrip" : "one way").includes(
        query
      )
    );
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Rides for {formattedDate}
      </h2>

      {/* Search Bar */}
      <div className="mt-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vehicle, route, employee, site, or purpose..."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />
      </div>

      {bookings.length === 0 ? (
        <div className="mt-5 flex min-h-[250px] items-center justify-center rounded-md bg-slate-50">
          <p className="text-sm text-slate-500">
            No ride bookings for this date.
          </p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-5 flex min-h-[200px] items-center justify-center rounded-md bg-slate-50">
          <p className="text-sm text-slate-500">
            No ride bookings match your search.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {filteredBookings.map((booking) => {
            const departureTime = new Date(
              `${booking.travel_date}T${booking.departure_time}`
            ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={booking.ride_reservation_id}
                className="rounded-md border border-slate-200 p-4"
              >
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {/* Booking / Transportation Type */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Booking
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {booking.vehicle_type ?? "Not specified"}
                    </h3>
                  </div>

                  {/* Route */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Route
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {booking.pickup_location} →{" "}
                      {booking.dropoff_destination}
                    </p>

                    {booking.roundtrip && (
                      <span className="mt-1 inline-block text-xs font-semibold text-[#03045e]">
                        Roundtrip
                      </span>
                    )}
                  </div>

                  {/* Departure */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Departure
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {departureTime}
                    </p>
                  </div>

                  {/* Requested By */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Requested by
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.employee_name}
                    </p>
                  </div>

                  {/* Passengers */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Passengers
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.passenger_count}{" "}
                      {booking.passenger_count === 1
                        ? "passenger"
                        : "passengers"}
                    </p>
                  </div>

                  {/* Site */}
                  <div>
                    <p className="text-xs text-slate-400">
                      Site
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.site ??
                        `Site #${booking.site_id}`}
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
                  <div className="col-span-2 flex items-end justify-end">
                    <span
                      className={
                        booking.status === "APPROVED"
                          ? "rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                          : booking.status === "PENDING"
                            ? "rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
                            : "rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                      }
                    >
                      {booking.status}
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