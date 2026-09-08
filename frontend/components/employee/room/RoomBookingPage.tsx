"use client";

import { useCallback, useState, useEffect } from "react";

import Calendar from "@/components/shared/Calendar";
import RoomBookingDetails from "./RoomBookingDetails";
import RoomRequestForm from "./RoomRequestForm";

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

interface SiteResponse {
  site_id: number;
  site_name: string;
}

interface RoomResponse {
  room_id: number;
  room_name: string;
}

export default function RoomBookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [bookings, setBookings] = useState<RoomBooking[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [sites, setSites] = useState<SiteResponse[]>([]);

  const [selectedBranch, setSelectedBranch] =
    useState<string>("all");

  // Every room of the selected branch, booked or not.
  // Tagged with the branch it was fetched for so a stale
  // list is never shown against a newly picked branch.
  const [roomState, setRoomState] = useState<{
    branch: string;
    rooms: string[];
  }>({ branch: "all", rooms: [] });

  const branchRooms =
    roomState.branch === selectedBranch
      ? roomState.rooms
      : [];

  const branches = sites.map((site) => site.site_name);

  // ==========================================================
  // FETCH BRANCHES
  // ==========================================================

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/sites`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch branches: ${response.status}`
          );
        }

        const data: SiteResponse[] = await response.json();

        setSites(data);
      } catch (error) {
        console.error("Error fetching branches:", error);
        setSites([]);
      }
    }

    fetchBranches();
  }, []);

  // ==========================================================
  // FETCH ROOMS OF THE SELECTED BRANCH
  //
  // Only a specific branch has a room list to filter by,
  // so "All Branches" clears it.
  // ==========================================================

  useEffect(() => {
    const site = sites.find(
      (item) => item.site_name === selectedBranch
    );

    if (!site) {
      return;
    }

    let cancelled = false;

    async function fetchBranchRooms(
      branch: string,
      siteId: number
    ) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/available?site_id=${siteId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch rooms: ${response.status}`
          );
        }

        const data: RoomResponse[] = await response.json();

        if (cancelled) {
          return;
        }

        setRoomState({
          branch,
          rooms: data.map((room) => room.room_name),
        });
      } catch (error) {
        console.error("Error fetching rooms:", error);

        if (!cancelled) {
          setRoomState({ branch, rooms: [] });
        }
      }
    }

    fetchBranchRooms(site.site_name, site.site_id);

    return () => {
      cancelled = true;
    };
  }, [selectedBranch, sites]);

  // ==========================================================
  // FETCH BOOKINGS
  // ==========================================================

  const fetchBookings = useCallback(async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/room-requests/active`,
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

        console.log(
          "Approved room bookings from API:",
          data
        );

        const actualBookings: RoomBooking[] = data
          .filter((request) => {
            const status = request.status.toLowerCase();

            return (
              status === "approved" ||
              status === "pending"
            );
          })
          .map((request) => ({
            id: String(request.room_reservation_id),

            title: request.room,

            start: `${request.reservation_date}T${request.start_time}`,

            end: `${request.reservation_date}T${request.end_time}`,

            room: request.room,

            site: request.site,

            employee: request.employee_name,

            purpose: request.purpose,

            status:
              request.status.toLowerCase() as
                | "approved"
                | "pending",
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
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ==========================================================
  // FILTER BOOKINGS BY BRANCH
  // ==========================================================

  const branchBookings = bookings.filter((booking) => {
    if (selectedBranch === "all") {
      return true;
    }

    return booking.site === selectedBranch;
  });

  // ==========================================================
  // FILTER BOOKINGS BY SELECTED DATE
  // ==========================================================

  const selectedBookings = branchBookings.filter(
    (booking) =>
      booking.start.split("T")[0] === selectedDate
  );

  // ==========================================================
  // BRANCH COLORS
  //
  // First branch  = Blue
  // Second branch = Yellow
  // Third branch  = Green
  // Fourth branch = Red
  //
  // If there are more than 4 branches, colors repeat.
  // ==========================================================

  const branchColorPalette = [
    {
      backgroundColor: "#3b82f6",
      borderColor: "#2563eb",
      textColor: "#ffffff",
    },
    {
      backgroundColor: "#eab308",
      borderColor: "#ca8a04",
      textColor: "#ffffff",
    },
    {
      backgroundColor: "#22c55e",
      borderColor: "#16a34a",
      textColor: "#ffffff",
    },
    {
      backgroundColor: "#ef4444",
      borderColor: "#dc2626",
      textColor: "#ffffff",
    },
  ];

  // ==========================================================
  // ASSIGN COLOR TO EACH BRANCH
  // ==========================================================

  const branchColors = Object.fromEntries(
    branches.map((branch, index) => [
      branch,
      branchColorPalette[
        index % branchColorPalette.length
      ],
    ])
  );

  // ==========================================================
  // BRANCH DOT COLORS
  //
  // The calendar shows a plain dot per booked date, so the
  // branch colour is carried by the booking details instead.
  // ==========================================================

  const branchDotColors = Object.fromEntries(
    Object.entries(branchColors).map(
      ([branch, color]) => [
        branch,
        color.backgroundColor,
      ]
    )
  );

  // ==========================================================
  // CALENDAR EVENTS
  // ==========================================================

  const calendarEvents = branchBookings.map((booking) => ({
    id: booking.id,

    title: booking.room,

    start: booking.start,

    end: booking.end,

    color: branchDotColors[booking.site],
  }));

  // ==========================================================
  // RENDER
  // ==========================================================

return (
  <div className="h-full overflow-hidden bg-slate-50 p-6">
    <div className="mx-auto flex h-full max-w-[1800px] flex-col">

      {/* Page Header */}
      <div className="mb-6 shrink-0 px-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Room Reservation
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View room bookings and submit a new reservation request.
        </p>
      </div>

      {/* Loading
      {isLoading && (
        <div className="mb-6 rounded-md bg-white p-4 text-sm text-slate-500">
          Loading room bookings...
        </div>
      )} */}

      {/* Calendar + Bookings + Form */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto xl:grid-cols-[1.4fr_1fr_1.2fr] xl:overflow-hidden">

        {/* Calendar */}
        <div className="rounded-md bg-white p-6 xl:min-h-0 xl:overflow-y-auto">
          <div className="mb-5 flex items-start justify-between">

            {/* Left: Booking Overview + Branch Legend */}
            <div>
              <h2 className="mb-1 text-lg font-semibold">
                Bookings Overview
              </h2>

              <p className="text-sm text-slate-500">
                Select a date to view room bookings.
              </p>
            </div>

            {/* Right: Branch Dropdown */}
            <div>
              <label
                htmlFor="branch"
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                Branch
              </label>

              <select
                id="branch"
                value={selectedBranch}
                onChange={(e) =>
                  setSelectedBranch(e.target.value)
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">
                  All Branches
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch}
                    value={branch}
                  >
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calendar */}
          <Calendar
            events={calendarEvents}
            showEventsAsDots
            selectedDate={selectedDate}
            onDateClick={(date) => {
              setSelectedDate(date);
            }}
          />
        </div>

        {/* Current Bookings */}
        <div className="flex min-h-0 flex-col rounded-md bg-white p-6 xl:h-full xl:overflow-hidden">
          <RoomBookingDetails
            selectedDate={selectedDate}
            bookings={selectedBookings}
            rooms={
              selectedBranch === "all" ? null : branchRooms
            }
            branchColors={branchDotColors}
            showBranch={selectedBranch === "all"}
          />
        </div>

        {/* Request Form */}
        <div className="rounded-md bg-white p-6 xl:min-h-0 xl:overflow-y-auto">
          <h2 className="text-lg font-semibold">
            New Room Request
          </h2>

          <p className="mt-1 mb-6 text-sm text-slate-500">
            Fill in the details below to request a room.
          </p>

          <RoomRequestForm
            selectedDate={selectedDate}
            onSuccess={fetchBookings}
          />
        </div>

      </div>
    </div>
  </div>
);
}