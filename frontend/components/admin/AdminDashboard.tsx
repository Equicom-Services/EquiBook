"use client";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import ReservationToggle from "./ReservationToggle";
import DashboardStats from "./DashboardStats";
import GenerateReport from "./GenerateReport";
import ReservationStatusFilter from "./ReservationStatusFilter";
import RoomRequests from "./RoomRequests";
import RideRequests from "./RideRequests";
import Calendar from "@/components/shared/Calendar";
import { apiFetch } from "@/lib/api";
import { Plus } from "lucide-react";
import AdminRoomBookingForm from "./AdminRoomBookingForm";

type ReservationType = "room" | "ride";

type ReservationStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

interface ApprovedBooking {
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

  // const [selectedRoom, setSelectedRoom] = useState<string>("all");

const [searchQuery, setSearchQuery] = useState("");

const [showAdminRoomBooking, setShowAdminRoomBooking] =
  useState(false);

  const [activeType, setActiveType] =
    useState<ReservationType>("room");

  const [activeStatus, setActiveStatus] =
    useState<ReservationStatus>("all");

  const [showCalendar, setShowCalendar] =
    useState(false);

  const [approvedBookings, setApprovedBookings] =
    useState<ApprovedBooking[]>([]);

  const [admin, setAdmin] =
    useState<Admin | null>(null);
  
const [rooms, setRooms] =
  useState<Room[]>([]);

const [selectedRoom, setSelectedRoom] =
  useState<string>("all");
  const [calendarLoading, setCalendarLoading] =
    useState(false);

  const [calendarError, setCalendarError] =
    useState("");

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

      const data = await response.json();

console.log(
  "ADMIN DATA:",
  JSON.stringify(data, null, 2)
);

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

useEffect(() => {
  if (!admin) return;

  const fetchRooms = async () => {
    try {
      console.log(
        "Fetching rooms for site:",
        admin.site_id
      );

      const response = await apiFetch(
        `/api/rooms?site_id=${admin.site_id}&active_only=true`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Rooms API error:",
          response.status,
          errorText
        );

        throw new Error(
          `Failed to fetch rooms: ${response.status}`
        );
      }

      const data: Room[] =
        await response.json();

      console.log("Rooms:", data);

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
  // FETCH APPROVED BOOKINGS
  // ==========================================================

  const fetchApprovedBookings = async () => {
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
          `Failed to fetch approved bookings: ${response.status}`
        );
      }

      const data: ApprovedBooking[] =
        await response.json();

      setApprovedBookings(data);
    } catch (error) {
      console.error(
        "Error fetching approved bookings:",
        error
      );

      setCalendarError(
        error instanceof Error
          ? error.message
          : "Unable to load calendar bookings."
      );
    } finally {
      setCalendarLoading(false);
    }
  };



const filteredCalendarBookings = useMemo(() => {
  if (!admin) return [];

  return approvedBookings.filter((booking) => {
    const matchesSite =
      booking.site_id === admin.site_id;

    const matchesRoom =
      selectedRoom === "all" ||
      String(booking.room_id) === selectedRoom;

    return (
      matchesSite &&
      matchesRoom &&
      booking.status.toLowerCase() === "approved"
    );
  });
}, [
  approvedBookings,
  admin,
  selectedRoom,
]);

const calendarEvents = filteredCalendarBookings.map(
  (booking) => ({
    id: String(booking.room_reservation_id),

    title: `${booking.room} - ${booking.employee_name}`,

    start: `${booking.reservation_date}T${booking.start_time}`,

    end: `${booking.reservation_date}T${booking.end_time}`,

    status: "approved" as const,
  })
);
  // ==========================================================
  // OPEN CALENDAR
  // ==========================================================

  const openCalendar = async () => {
    setShowCalendar(true);

    await fetchApprovedBookings();
  };

  // ==========================================================
  // FILTER BOOKINGS BY ADMIN SITE
  // ==========================================================


  // ==========================================================
  // CALENDAR EVENTS
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

{/* Dashboard Header */}
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

    {/* Search Input */}
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
        placeholder="Search bookings..."
        className="ml-2 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />

      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="shrink-0 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      )}
    </div>
      {/* Admin Book Room */}
  <button
    type="button"
    onClick={() => setShowAdminRoomBooking(true)}
    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
  >
    <Plus size={18} />
    Book Room
  </button>
  {showAdminRoomBooking && (
  <AdminRoomBookingForm
    onClose={() => setShowAdminRoomBooking(false)}
    onSuccess={() => {
      // refresh bookings
    }}
  />
)}

    {/* Generate Report */}
    <GenerateReport
      reservationType={activeType}
    />

  </div>
</div>
        {/* Room / Ride Toggle */}
        <div className="mt-6">
          <ReservationToggle
            activeType={activeType}
            onChange={(type) => {
              setActiveType(type);
              setActiveStatus("all");
            }}
          />
        </div>

        {/* Dashboard Statistics */}
        <div className="mt-6">
          <DashboardStats
            reservationType={activeType}
          />
        </div>

        {/* Requests Section */}
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

    {/* Room Filter */}
    {activeType === "room" && (
      <select
        value={selectedRoom}
        onChange={(e) =>
          setSelectedRoom(e.target.value)
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
      >
        <option value="all">
          All Rooms
        </option>

{rooms.map((room) => (
  <option
    key={room.room_id}
    value={String(room.room_id)}
  >
    {room.room_name}
  </option>
))}
      </select>
    )}

    {/* Status Filter */}
    <ReservationStatusFilter
      activeStatus={activeStatus}
      onChange={setActiveStatus}
    />

  </div>
</div>

{/* Request List */}
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
  <CalendarDays size={30} strokeWidth={2} />
</button>
      </div>

      {/* ==================================================
          CALENDAR MODAL
      ================================================== */}

      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Reservation Calendar
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Approved room reservations
                  {admin?.site_id
                    ? ` for your site`
                    : ""}
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

              {calendarLoading ? (
                <div className="rounded-lg border border-slate-200 p-10 text-center">
                  <p className="text-sm text-slate-500">
                    Loading calendar...
                  </p>
                </div>
              ) : calendarError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <p className="text-sm text-red-600">
                    {calendarError}
                  </p>

                  <button
                    type="button"
                    onClick={fetchApprovedBookings}
                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
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