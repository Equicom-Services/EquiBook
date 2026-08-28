"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Plus,
  Search,
  X,
} from "lucide-react";

import ReservationToggle from "./ReservationToggle";
import DashboardStats from "./DashboardStats";
import GenerateReport from "./GenerateReport";
import ReservationStatusFilter from "./ReservationStatusFilter";
import RoomRequests from "./RoomRequests";
import RideRequests from "./RideRequests";
import Calendar from "@/components/shared/Calendar";
import { apiFetch } from "@/lib/api";
import AdminRoomBookingForm from "./AdminRoomBookingForm";
import AdminRideBookingForm from "./AdminRideBookingForm";

type ReservationType = "room" | "ride";

type ReservationStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

interface ApprovedRoomBooking {
  room_reservation_id: number;
  room_id: number;
  room: string;
  site: string;
  site_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  employee_name: string;
  status: string;
}

interface ApprovedRideBooking {
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
}

interface Admin {
  admin_id: number;
  name: string;
  email: string;
  site_id: number;
}

interface Room {
  room_id: number;
  room_code: string;
  room_name: string;
  capacity: number;
  location: string | null;
  is_active: boolean;
  site_id: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  status?: "approved" | "pending";
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const [showAdminRoomBooking, setShowAdminRoomBooking] =
    useState(false);

  const [activeType, setActiveType] =
    useState<ReservationType>("room");

  const [activeStatus, setActiveStatus] =
    useState<ReservationStatus>("all");

  const [showCalendar, setShowCalendar] =
    useState(false);

  const [admin, setAdmin] =
    useState<Admin | null>(null);
    
 
  // ==========================================================
  // ADMIN MANUAL BOOKING
  // ==========================================================
const [showAdminRideBooking, setShowAdminRideBooking] = useState(false);
  
  // ==========================================================
  // ROOM FILTER
  // ==========================================================

  const [rooms, setRooms] = useState<Room[]>([]);

  const [selectedRoom, setSelectedRoom] =
    useState<string>("all");

  // ==========================================================
  // CALENDAR
  // ==========================================================

  const [approvedRoomBookings, setApprovedRoomBookings] =
    useState<ApprovedRoomBooking[]>([]);

  const [approvedRideBookings, setApprovedRideBookings] =
    useState<ApprovedRideBooking[]>([]);

  const [calendarLoading, setCalendarLoading] =
    useState(false);

  const [calendarError, setCalendarError] =
    useState("");

  // ==========================================================
  // RESTORE RESERVATION TYPE
  // ==========================================================

  useEffect(() => {
    const savedType = localStorage.getItem(
      "admin_reservation_type"
    );

    if (savedType === "room" || savedType === "ride") {
      setActiveType(savedType);
    }
  }, []);
  // ==========================================================
  // FETCH ADMIN
  // ==========================================================

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await apiFetch(
          "/api/admin/me",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch admin information."
          );
        }

        const data: Admin = await response.json();

        setAdmin(data);
      } catch (error) {
        console.error(
          "Error fetching admin:",
          error
        );
      }
    };

    fetchAdmin();
  }, []);

  // ==========================================================
  // FETCH ROOMS
  // ==========================================================

  useEffect(() => {
    if (!admin) return;

    const fetchRooms = async () => {
      try {
        const response = await apiFetch(
          `/api/rooms?site_id=${admin.site_id}&active_only=true`,
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

        const data: Room[] =
          await response.json();

        setRooms(data);
      } catch (error) {
        console.error(
          "Error fetching rooms:",
          error
        );

        setRooms([]);
      }
    };

    fetchRooms();
  }, [admin]);

  // ==========================================================
  // FETCH APPROVED ROOM BOOKINGS
  // ==========================================================

  const fetchApprovedRoomBookings = async () => {
    try {
      setCalendarLoading(true);
      setCalendarError("");

      const response = await apiFetch(
        "/api/room-requests/approved",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch approved room bookings: ${response.status}`
        );
      }

      const data: ApprovedRoomBooking[] =
        await response.json();

      setApprovedRoomBookings(data);
    } catch (error) {
      console.error(
        "Error fetching approved room bookings:",
        error
      );

      setCalendarError(
        error instanceof Error
          ? error.message
          : "Unable to load room calendar bookings."
      );
    } finally {
      setCalendarLoading(false);
    }
  };

  // ==========================================================
  // FETCH APPROVED RIDE BOOKINGS
  // ==========================================================

  const fetchApprovedRideBookings = async () => {
    try {
      setCalendarLoading(true);
      setCalendarError("");

      const response = await apiFetch(
        "/api/ride-reservations/approved",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch approved ride bookings: ${response.status}`
        );
      }

      const data: ApprovedRideBooking[] =
        await response.json();

      setApprovedRideBookings(data);
    } catch (error) {
      console.error(
        "Error fetching approved ride bookings:",
        error
      );

      setCalendarError(
        error instanceof Error
          ? error.message
          : "Unable to load ride calendar bookings."
      );
    } finally {
      setCalendarLoading(false);
    }
  };

  // ==========================================================
  // FETCH CALENDAR DATA
  // ==========================================================

  const fetchCalendarBookings = async () => {
    if (activeType === "room") {
      await fetchApprovedRoomBookings();
    } else {
      await fetchApprovedRideBookings();
    }
  };

  // ==========================================================
  // FILTER ROOM CALENDAR BOOKINGS
  // ==========================================================

  const filteredRoomCalendarBookings =
    useMemo(() => {
      if (!admin) return [];

      return approvedRoomBookings.filter(
        (booking) => {
          const matchesSite =
            booking.site_id === admin.site_id;

          const matchesRoom =
            selectedRoom === "all" ||
            String(booking.room_id) ===
              selectedRoom;

          const matchesStatus =
            booking.status.toLowerCase() ===
            "approved";

          return (
            matchesSite &&
            matchesRoom &&
            matchesStatus
          );
        }
      );
    }, [
      approvedRoomBookings,
      admin,
      selectedRoom,
    ]);

  // ==========================================================
  // FILTER APPROVED RIDE CALENDAR BOOKINGS
  // ==========================================================

  const filteredRideCalendarBookings =
    useMemo(() => {
      if (!admin) return [];

      return approvedRideBookings.filter(
        (booking) => {
          const matchesSite =
            booking.site_id === admin.site_id;

          const matchesStatus =
            booking.status.toLowerCase() ===
            "approved";

          return (
            matchesSite &&
            matchesStatus
          );
        }
      );
    }, [
      approvedRideBookings,
      admin,
    ]);

  // ==========================================================
  // CALENDAR EVENTS
  // ==========================================================

  const calendarEvents: CalendarEvent[] =
    useMemo(() => {
      if (activeType === "room") {
        return filteredRoomCalendarBookings.map(
          (booking) => ({
            id: String(
              booking.room_reservation_id
            ),

            title: `${booking.room} - ${booking.employee_name}`,

            start: `${booking.reservation_date}T${booking.start_time}`,

            end: `${booking.reservation_date}T${booking.end_time}`,

            status: "approved",
          })
        );
      }

      return filteredRideCalendarBookings.map(
        (booking) => {
          const start =
            `${booking.travel_date}T${booking.departure_time}`;

          return {
            id: String(
              booking.ride_reservation_id
            ),

            title:
              `${booking.pickup_location} → ${booking.dropoff_destination}`,

            start,

            end: start,

            status: "approved",
          };
        }
      );
    }, [
      activeType,
      filteredRoomCalendarBookings,
      filteredRideCalendarBookings,
    ]);

  // ==========================================================
  // OPEN CALENDAR
  // ==========================================================

  const openCalendar = async () => {
    setShowCalendar(true);

    await fetchCalendarBookings();
  };

  // ==========================================================
  // RESERVATION TYPE CHANGE
  // ==========================================================

const handleReservationTypeChange = (
  type: ReservationType
) => {
  setActiveType(type);

  localStorage.setItem(
    "admin_reservation_type",
    type
  );

  // Reset status when switching
  // between Room and Ride.
  setActiveStatus("all");

  // Reset search when switching
  // between reservation types.
  setSearchQuery("");

  // Room-specific filter.
  if (type === "room") {
    setSelectedRoom("all");
  }
};

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ==================================================
            DASHBOARD HEADER
        ================================================== */}

        <div className="flex items-start justify-between gap-4">

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage employee reservation requests.
            </p>
          </div>

          {/* Header Actions */}

          <div className="flex items-center gap-3">

            {/* Search */}

            <div className="flex w-72 items-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 shadow-sm">

              <Search
                size={18}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder={
                  activeType === "room"
                    ? "Search room bookings..."
                    : "Search ride bookings..."
                }
                className="ml-2 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery("")
                  }
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

{/* ==================================================
    BOOK RESERVATION
================================================== */}

{activeType === "room" ? (
  <>
    <button
      type="button"
      onClick={() =>
        setShowAdminRoomBooking(true)
      }
      className="flex items-center gap-2 rounded-lg bg-[#03045e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#02033f]"
    >
      <Plus size={18} />
      Book Room
    </button>

    {showAdminRoomBooking && (
      <AdminRoomBookingForm
        onClose={() =>
          setShowAdminRoomBooking(false)
        }
        onSuccess={() => {
          fetchApprovedRoomBookings();
        }}
      />
    )}
  </>
) : (
  <>
    <button
      type="button"
      onClick={() =>
        setShowAdminRideBooking(true)
      }
      className="flex items-center gap-2 rounded-lg bg-[#03045e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#02033f]"
    >
      <Plus size={18} />
      Book Ride
    </button>

    {showAdminRideBooking && (
      <AdminRideBookingForm
        onClose={() =>
          setShowAdminRideBooking(false)
        }
        onSuccess={() => {
          fetchApprovedRideBookings();
        }}
      />
    )}
  </>
)}
            {/* ==================================================
                GENERATE REPORT
            ================================================== */}

            <GenerateReport
              reservationType={activeType}
            />

          </div>
        </div>

        {/* ==================================================
            ROOM / RIDE TOGGLE
        ================================================== */}

        <div className="mt-6">
          <ReservationToggle
            activeType={activeType}
            onChange={handleReservationTypeChange}
          />
        </div>

        {/* ==================================================
            DASHBOARD STATISTICS
        ================================================== */}

        <div className="mt-6">
          <DashboardStats
            reservationType={activeType}
          />
        </div>

        {/* ==================================================
            REQUESTS SECTION
        ================================================== */}

        <section className="mt-8">

          {/* Requests Header */}

          <div className="flex items-center justify-between gap-4">

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {activeType === "room"
                  ? "Room Requests"
                  : "Ride Requests"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review employee requests and take appropriate action.
              </p>
            </div>

            {/* Filters */}

            <div className="flex items-center gap-3">

              {/* ==================================================
                  ROOM FILTER ONLY
              ================================================== */}

              {activeType === "room" && (
                <select
                  value={selectedRoom}
                  onChange={(e) =>
                    setSelectedRoom(
                      e.target.value
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                >
                  <option value="all">
                    All Rooms
                  </option>

                  {rooms.map((room) => (
                    <option
                      key={room.room_id}
                      value={String(
                        room.room_id
                      )}
                    >
                      {room.room_name}
                    </option>
                  ))}
                </select>
              )}

              {/* ==================================================
                  STATUS FILTER
              ================================================== */}

              <ReservationStatusFilter
                activeStatus={activeStatus}
                onChange={setActiveStatus}
              />

            </div>
          </div>

          {/* ==================================================
              REQUEST LIST
          ================================================== */}

          <div className="mt-5">

            {activeType === "room" ? (
              <RoomRequests
                status={activeStatus}
                searchQuery={searchQuery}
                roomId={selectedRoom}
              />
            ) : (
              <RideRequests
                status={activeStatus}
                searchQuery={searchQuery}
              />
            )}

          </div>

        </section>

        {/* ==================================================
            CALENDAR BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={openCalendar}
          aria-label="Open reservation calendar"
          title="Reservation Calendar"
          className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#03045e] text-white shadow-xl transition hover:scale-105 hover:bg-[#02033f]"
        >
          <CalendarDays
            size={30}
            strokeWidth={2}
          />
        </button>

      </div>

      {/* ==================================================
          CALENDAR MODAL
      ================================================== */}

      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            {/* Calendar Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-semibold text-slate-900">
                  Reservation Calendar
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {activeType === "room"
                    ? "Approved room reservations"
                    : "Approved ride reservations"}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCalendar(false)
                }
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>

            </div>

            {/* Calendar Content */}

            <div className="p-6">

              {/* Calendar Filter Information */}

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-700">

                    {activeType === "room"
                      ? selectedRoom === "all"
                        ? "All Rooms"
                        : rooms.find(
                            (room) =>
                              String(
                                room.room_id
                              ) ===
                              selectedRoom
                          )?.room_name ||
                          "Selected Room"
                      : "Your Site"}

                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    fetchCalendarBookings
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>

              </div>

              {/* Loading */}

              {calendarLoading ? (
                <div className="rounded-lg border border-slate-200 p-10 text-center">

                  <p className="text-sm text-slate-500">
                    Loading calendar...
                  </p>

                </div>
              ) : calendarError ? (

                /* Error */

                <div className="rounded-lg border border-red-200 bg-red-50 p-6">

                  <p className="text-sm text-red-600">
                    {calendarError}
                  </p>

                  <button
                    type="button"
                    onClick={
                      fetchCalendarBookings
                    }
                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Try Again
                  </button>

                </div>
              ) : (

                /* Calendar */

                <Calendar
                  events={calendarEvents}
                />

              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}