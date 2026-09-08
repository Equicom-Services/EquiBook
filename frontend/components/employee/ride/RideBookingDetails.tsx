"use client";

import { useMemo, useState } from "react";

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

  // Branch name to its colour. Each booking is tagged with its
  // branch here, mirroring the room booking details panel.
  branchColors?: Record<string, string>;

  // Only worth labelling when the list can hold more than one
  // branch, so this is off while a single branch is selected.
  showBranch?: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function RideBookingDetails({
  selectedDate,
  bookings,
  branchColors = {},
  showBranch = false,
}: RideBookingDetailsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // The page is tied to the date it was chosen on, so moving to another
  // date starts back at page 1 without needing to correct state later.
  const [pageState, setPageState] = useState({
    date: selectedDate,
    page: 1,
  });

  const formattedDate = new Date(
    `${selectedDate}T00:00:00`
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const filteredBookings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return bookings;
    }

    return bookings.filter((booking) =>
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
  }, [bookings, searchQuery]);

  const totalPages = Math.ceil(
    filteredBookings.length / ITEMS_PER_PAGE
  );

  // Clamped so a shrinking result set can't strand us past the last page
  const currentPage = Math.min(
    pageState.date === selectedDate ? pageState.page : 1,
    Math.max(totalPages, 1)
  );

  const goToPage = (page: number) => {
    setPageState({ date: selectedDate, page });
  };

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredBookings.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredBookings, currentPage]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="shrink-0 text-lg font-semibold text-slate-900">
        Rides for {formattedDate}
      </h2>

      {/* Branch Color Legend

          Sits here rather than over the calendar, because this
          is where the colours are actually used. */}
      {showBranch &&
        Object.keys(branchColors).length > 0 && (
          <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
            {Object.entries(branchColors).map(
              ([branch, color]) => (
                <div
                  key={branch}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />

                  <span className="text-xs text-slate-600">
                    {branch}
                  </span>
                </div>
              )
            )}
          </div>
        )}

      {/* Search Bar */}
      <div className="mt-4 shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            goToPage(1);
          }}
          placeholder="Search vehicle, route, employee, site, or purpose..."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />
      </div>

      {bookings.length === 0 ? (
        <div className="mt-5 flex min-h-[250px] flex-1 items-center justify-center rounded-md bg-slate-50">
          <p className="text-sm text-slate-500">
            No ride bookings for this date.
          </p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-5 flex min-h-[200px] flex-1 items-center justify-center rounded-md bg-slate-50">
          <p className="text-sm text-slate-500">
            No ride bookings match your search.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {paginatedBookings.map((booking) => {
              const departureTime = new Date(
                `${booking.travel_date}T${booking.departure_time}`
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <div
                  key={booking.ride_reservation_id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  {/* Branch */}
                  {showBranch && (
                    <div className="mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            branchColors[
                              booking.site ?? ""
                            ] ?? "#64748b",
                        }}
                      />

                      <span className="text-xs font-medium text-slate-600">
                        {booking.site ??
                          `Site #${booking.site_id}`}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {/* Booking / Transportation Type */}
                    <div>
                      <p className="text-xs text-slate-400">
                        Booking
                      </p>
                      <h3 className="mt-0.5 font-semibold text-slate-900">
                        {booking.vehicle_type ?? "Not specified"}
                      </h3>
                    </div>

                    {/* Route */}
                    <div>
                      <p className="text-xs text-slate-400">
                        Route
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {booking.pickup_location} →{" "}
                        {booking.dropoff_destination}
                      </p>

                      {booking.roundtrip && (
                        <span className="mt-0.5 inline-block text-xs font-semibold text-[#03045e]">
                          Roundtrip
                        </span>
                      )}
                    </div>

                    {/* Departure */}
                    <div>
                      <p className="text-xs text-slate-400">
                        Departure
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {departureTime}
                      </p>
                    </div>

                    {/* Requested By */}
                    <div>
                      <p className="text-xs text-slate-400">
                        Requested by
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {booking.employee_name}
                      </p>
                    </div>

                    {/* Passengers */}
                    <div>
                      <p className="text-xs text-slate-400">
                        Passengers
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {booking.passenger_count}{" "}
                        {booking.passenger_count === 1
                          ? "passenger"
                          : "passengers"}
                      </p>
                    </div>

                    {/* Purpose */}
                    <div>
                      <p className="text-xs text-slate-400">
                        Purpose
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex shrink-0 flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {" - "}
                <span className="font-medium text-slate-700">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredBookings.length
                  )}
                </span>
                {" of "}
                <span className="font-medium text-slate-700">
                  {filteredBookings.length}
                </span>
                {" rides"}
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    goToPage(Math.max(currentPage - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`min-w-[34px] rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                        currentPage === page
                          ? "bg-[#03045e] text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      Math.min(currentPage + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}