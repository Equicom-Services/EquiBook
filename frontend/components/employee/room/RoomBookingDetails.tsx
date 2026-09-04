"use client";

import { useMemo, useState } from "react";

interface RoomBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  room: string;
  site: string;
  employee: string;
  purpose: string;
  status: "approved" | "pending";
}

interface RoomBookingDetailsProps {
  selectedDate: string;
  bookings: RoomBooking[];

  // Every room of the selected branch, booked or not.
  // `null` means no single branch is selected, so there is
  // no room list to filter by and the dropdown is hidden.
  rooms: string[] | null;

  // Branch name to its colour. Each booking is tagged with its
  // branch here, because the calendar no longer distinguishes
  // them and a mixed list is otherwise ambiguous.
  branchColors?: Record<string, string>;

  // Only worth labelling when the list can hold more than one
  // branch, so this is off while a single branch is selected.
  showBranch?: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function RoomBookingDetails({
  selectedDate,
  bookings,
  rooms,
  branchColors = {},
  showBranch = false,
}: RoomBookingDetailsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("all");

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

  const roomOptions = useMemo(() => {
    return [...(rooms ?? [])].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rooms]);

  // Switching branches (or back to "All Branches") can drop
  // the room that was chosen, so fall back to showing all
  const activeRoom =
    selectedRoom !== "all" &&
    !roomOptions.includes(selectedRoom)
      ? "all"
      : selectedRoom;

  const filteredBookings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return bookings.filter((booking) => {
      const matchesRoom =
        activeRoom === "all" ||
        booking.room === activeRoom;

      if (!matchesRoom) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        booking.room.toLowerCase().includes(query) ||
        booking.title.toLowerCase().includes(query) ||
        booking.site.toLowerCase().includes(query) ||
        booking.employee.toLowerCase().includes(query) ||
        booking.purpose.toLowerCase().includes(query) ||
        booking.status.toLowerCase().includes(query)
      );
    });
  }, [bookings, searchQuery, activeRoom]);

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
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Bookings for {formattedDate}
      </h2>

      {/* Branch Color Legend

          Sits here rather than over the calendar, because this
          is where the colours are actually used. */}
      {showBranch &&
        Object.keys(branchColors).length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
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

      {/* Search Bar + Room Filter */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            goToPage(1);
          }}
          placeholder="Search room, booking, employee, or purpose..."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />

        {rooms !== null && (
          <select
            value={activeRoom}
            onChange={(e) => {
              setSelectedRoom(e.target.value);
              goToPage(1);
            }}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 sm:w-56"
          >
            <option value="all">All rooms</option>

            {roomOptions.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        )}
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
        <>
          <div className="mt-5 space-y-4">
            {paginatedBookings.map((booking) => {
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
                  {/* Branch */}
                  {showBranch && (
                    <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            branchColors[booking.site] ??
                            "#64748b",
                        }}
                      />

                      <span className="text-xs font-medium text-slate-600">
                        {booking.site}
                      </span>
                    </div>
                  )}

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
                    <div className="col-span-2 flex items-end justify-end">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
                {" bookings"}
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
