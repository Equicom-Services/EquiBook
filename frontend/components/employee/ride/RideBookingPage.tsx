"use client";

import { useEffect, useState } from "react";

import Calendar from "@/components/shared/Calendar";

import RideBookingDetails from "./RideBookingDetails";

import RideRequestForm from "./RideRequestForm";

interface RideReservation {
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

interface SiteResponse {
  site_id: number;
  site_name: string;
}

export default function RideBookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [bookings, setBookings] = useState<RideReservation[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [branches, setBranches] = useState<string[]>([]);

  const [selectedBranch, setSelectedBranch] =
    useState<string>("all");

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

        const activeBranches = data.map(
          (site) => site.site_name
        );

        setBranches(activeBranches);
      } catch (error) {
        console.error("Error fetching branches:", error);
        setBranches([]);
      }
    }

    fetchBranches();
  }, []);

  // ==========================================================
  // FETCH RIDE BOOKINGS
  // ==========================================================

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ride-reservations/active`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch ride reservations: ${response.status}`
          );
        }

        const data: RideReservation[] =
          await response.json();

        setBookings(data);
      } catch (error) {
        console.error(
          "Error fetching ride reservations:",
          error
        );

        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // ==========================================================
  // GET BRANCH COLOR
  // ==========================================================

  const branchColors = [
    "#3B82F6", // Blue
    "#EAB308", // Yellow
    "#22C55E", // Green
    "#EF4444", // Red
  ];

  const getBranchColor = (branch: string | undefined) => {
    if (!branch) {
      return "#64748B";
    }

    const branchIndex = branches.findIndex(
      (name) => name === branch
    );

    if (branchIndex === -1) {
      return "#64748B";
    }

    return branchColors[
      branchIndex % branchColors.length
    ];
  };

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
      booking.travel_date === selectedDate
  );

  // ==========================================================
  // CALENDAR EVENTS
  // ==========================================================

  const calendarEvents = branchBookings.map((booking) => {
    const start = `${booking.travel_date}T${booking.departure_time}`;

    return {
      id: String(booking.ride_reservation_id),

      title: booking.dropoff_destination,

      start,

      end: start,

      backgroundColor: getBranchColor(booking.site),

      borderColor: getBranchColor(booking.site),

      textColor: "#ffffff",
    };
  });

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1800px]">

        {/* Page Header */}
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

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="mb-1 text-lg font-semibold">
                  Bookings Overview
                </h2>

                <p className="text-sm text-slate-500">
                  Select a date to view ride bookings.
                </p>
              </div>

              {/* Branch Dropdown */}
              <div>
                <label
                  htmlFor="ride-branch"
                  className="mb-1 block text-xs font-medium text-slate-500"
                >
                  Branch
                </label>

                <select
                  id="ride-branch"
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

            {/* Branch Legend */}
            <div className="mb-5 flex flex-wrap items-center gap-4">
              {branches.map((branch) => (
                <div
                  key={branch}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        getBranchColor(branch),
                    }}
                  />

                  <span>{branch}</span>
                </div>
              ))}
            </div>

            {/* Calendar */}
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm text-slate-500">
                  Loading bookings...
                </p>
              </div>
            ) : (
              <Calendar
                events={calendarEvents}
                onDateClick={(date) => {
                  setSelectedDate(date);
                }}
              />
            )}

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

            <RideRequestForm
              selectedDate={selectedDate}
            />

          </div>

        </div>
      </div>
    </div>
  );
}