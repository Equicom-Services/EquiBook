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
import {
  apiFetch,
  getErrorMessage,
  getThrownMessage,
} from "@/lib/api";
import { capitalizeFirst, titleCase } from "@/lib/text";
import AdminRoomBookingForm from "./AdminRoomBookingForm";
import AdminRideBookingForm from "./AdminRideBookingForm";
import ChangePasswordModal from "./ChangePasswordModal";

type ReservationType = "room" | "ride";

type ReservationStatus =
  | "all"
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled";

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
  must_change_password?: boolean;
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

/*
 * One row in the calendar modal's day list.
 *
 * Room and ride bookings carry very different fields, so both are
 * flattened into this shape and the type-specific parts end up as
 * label/value pairs in `details`.
 */
interface CalendarDayBooking {
  id: string;
  title: string;
  time: string;
  employee: string;
  details: { label: string; value: string }[];
}

/* "2026-12-30" + "13:45:00" -> "1:45 PM" */
function formatTime(
  date: string,
  time: string
): string {
  const parsed = new Date(`${date}T${time}`);

  if (Number.isNaN(parsed.getTime())) {
    return time;
  }

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* "2026-12-30" -> "December 30, 2026" */
function formatDayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  // Day whose bookings the calendar modal is listing, and the
  // booking expanded inside that list. Clicking a cell sets the
  // first; clicking a row in the list sets the second.
  const [calendarDay, setCalendarDay] =
    useState<string | null>(null);

  const [expandedBookingId, setExpandedBookingId] =
    useState<string | null>(null);

  const [admin, setAdmin] =
    useState<Admin | null>(null);

  // Forces the password-change modal when the account is on its
  // first login or its password has passed the 30-day expiry.
  const [mustChangePassword, setMustChangePassword] =
    useState(false);
    
 
  // ==========================================================
  // ADMIN MANUAL BOOKING
  // ==========================================================
const [showAdminRideBooking, setShowAdminRideBooking] = useState(false);
  
  // ==========================================================
  // DATE FILTER
  //
  // Empty string means "any date".
  // ==========================================================

  const [selectedDate, setSelectedDate] =
    useState<string>("");

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
        setMustChangePassword(
          Boolean(data.must_change_password)
        );
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

  const fetchApprovedRoomBookings = async (
    showLoading = true
  ) => {
    try {
      if (showLoading) {
        setCalendarLoading(true);
      }

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
          await getErrorMessage(
            response,
            "Unable to load room calendar bookings."
          )
        );
      }

      const data: ApprovedRoomBooking[] =
        await response.json();

      setApprovedRoomBookings(data);
    } catch (error) {
      setCalendarError(
        getThrownMessage(
          error,
          "Unable to load room calendar bookings."
        )
      );
    } finally {
      setCalendarLoading(false);
    }
  };

  // ==========================================================
  // FETCH APPROVED RIDE BOOKINGS
  // ==========================================================

  const fetchApprovedRideBookings = async (
    showLoading = true
  ) => {
    try {
      if (showLoading) {
        setCalendarLoading(true);
      }

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
          await getErrorMessage(
            response,
            "Unable to load ride calendar bookings."
          )
        );
      }

      const data: ApprovedRideBooking[] =
        await response.json();

      setApprovedRideBookings(data);
    } catch (error) {
      setCalendarError(
        getThrownMessage(
          error,
          "Unable to load ride calendar bookings."
        )
      );
    } finally {
      setCalendarLoading(false);
    }
  };

  // ==========================================================
  // FETCH CALENDAR DATA
  // ==========================================================

  const fetchCalendarBookings = async (
    showLoading = true
  ) => {
    if (activeType === "room") {
      await fetchApprovedRoomBookings(showLoading);
    } else {
      await fetchApprovedRideBookings(showLoading);
    }
  };

  // ==========================================================
  // REFRESH AFTER AN ACTION
  //
  // Bumping this reloads the statistics and the request list,
  // and the calendar is refetched, so the whole dashboard
  // reflects the action without a manual browser refresh.
  // ==========================================================

  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionComplete = () => {
    setRefreshKey((key) => key + 1);

    // Silent: a visible loading state here would blank the
    // calendar the admin is looking at.
    fetchCalendarBookings(false);
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

            title: `${capitalizeFirst(
              booking.pickup_location
            )} → ${capitalizeFirst(
              booking.dropoff_destination
            )}`,

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
  // BOOKINGS ON THE SELECTED DAY
  //
  // The calendar cell only has room for a few chips, so the day
  // list below it is what actually shows everything booked that
  // day — and, expanded, the details of each one.
  // ==========================================================

  const calendarDayBookings: CalendarDayBooking[] =
    useMemo(() => {
      if (!calendarDay) {
        return [];
      }

      if (activeType === "room") {
        return filteredRoomCalendarBookings
          .filter(
            (booking) =>
              booking.reservation_date === calendarDay
          )
          .map((booking) => ({
            id: String(booking.room_reservation_id),

            title: booking.room,

            time: `${formatTime(
              booking.reservation_date,
              booking.start_time
            )} – ${formatTime(
              booking.reservation_date,
              booking.end_time
            )}`,

            employee: booking.employee_name,

            details: [
              { label: "Room", value: booking.room },
              { label: "Site", value: booking.site },
              {
                label: "Requested by",
                value: booking.employee_name,
              },
              {
                label: "Status",
                value: capitalizeFirst(booking.status),
              },
            ],
          }))
          .sort((a, b) =>
            a.time.localeCompare(b.time)
          );
      }

      return filteredRideCalendarBookings
        .filter(
          (booking) =>
            booking.travel_date === calendarDay
        )
        .map((booking) => ({
          id: String(booking.ride_reservation_id),

          title: `${capitalizeFirst(
            booking.pickup_location
          )} → ${capitalizeFirst(
            booking.dropoff_destination
          )}`,

          time: formatTime(
            booking.travel_date,
            booking.departure_time
          ),

          employee: booking.employee_name,

          details: [
            {
              label: "Purpose",
              value: titleCase(booking.purpose),
            },
            {
              label: "Pickup",
              value: capitalizeFirst(
                booking.pickup_location
              ),
            },
            {
              label: "Drop-off",
              value: capitalizeFirst(
                booking.dropoff_destination
              ),
            },
            {
              label: "Trip Type",
              value: booking.roundtrip
                ? "Round Trip"
                : "One Way",
            },
            {
              label: "Passengers",
              value: String(booking.passenger_count),
            },
            {
              label: "Vehicle",
              value:
                capitalizeFirst(
                  booking.vehicle_type
                ) || "Not assigned",
            },
            {
              label: "Requested by",
              value: booking.employee_name,
            },
            {
              label: "Email",
              value: booking.employee_email,
            },
            {
              label: "Site",
              value: booking.site || "—",
            },
          ],
        }));
    }, [
      calendarDay,
      activeType,
      filteredRoomCalendarBookings,
      filteredRideCalendarBookings,
    ]);

  // ==========================================================
  // CALENDAR SELECTION
  // ==========================================================

  const handleCalendarDayClick = (date: string) => {
    setCalendarDay(date);

    setExpandedBookingId(null);
  };

  /*
   * A chip inside a cell is a click on that day too — it just
   * also opens the booking it was drawn for.
   */
  const handleCalendarEventClick = (eventId: string) => {
    const event = calendarEvents.find(
      (candidate) => candidate.id === eventId
    );

    if (!event) {
      return;
    }

    setCalendarDay(event.start.split("T")[0]);

    setExpandedBookingId(eventId);
  };

  // ==========================================================
  // OPEN CALENDAR
  // ==========================================================

  const openCalendar = async () => {
    setShowCalendar(true);

    setCalendarDay(null);

    setExpandedBookingId(null);

    await fetchCalendarBookings();
  };

  // ==========================================================
  // AUTO REFRESH THE CALENDAR
  //
  // While the calendar is open its bookings are reloaded in the
  // background, so it always shows the latest data without the
  // admin having to refresh it.
  // ==========================================================

  useEffect(() => {
    if (!showCalendar) {
      return;
    }

    fetchCalendarBookings(false);

    const interval = setInterval(() => {
      fetchCalendarBookings(false);
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalendar, activeType, refreshKey]);

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

  // The calendar's day list belongs to the old type's bookings.
  setCalendarDay(null);

  setExpandedBookingId(null);

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
      {mustChangePassword && (
        <ChangePasswordModal
          title="Password update required"
          subtitle="Your password needs to be updated before you can continue."
          onSuccess={() => setMustChangePassword(false)}
        />
      )}
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
          setRefreshKey((key) => key + 1);
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
          setRefreshKey((key) => key + 1);
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
            refreshTrigger={refreshKey}
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
                  DATE FILTER
              ================================================== */}

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(e.target.value)
                  }
                  aria-label={
                    activeType === "room"
                      ? "Filter by reservation date"
                      : "Filter by travel date"
                  }
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                />

                {selectedDate && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDate("")
                    }
                    title="Clear date"
                    className="absolute -right-2 -top-2 rounded-full border border-slate-300 bg-white p-0.5 text-slate-400 shadow-sm transition hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

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
                reservationDate={selectedDate}
                refreshTrigger={refreshKey}
                onActionComplete={
                  handleActionComplete
                }
              />
            ) : (
              <RideRequests
                status={activeStatus}
                searchQuery={searchQuery}
                reservationDate={selectedDate}
                refreshTrigger={refreshKey}
                onActionComplete={
                  handleActionComplete
                }
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

          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-md bg-white shadow-2xl">

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

              {activeType === "room" && (
                <div className="mb-5">

                  <p className="text-sm font-medium text-slate-700">

                    {selectedRoom === "all"
                      ? "All Rooms"
                      : rooms.find(
                          (room) =>
                            String(room.room_id) ===
                            selectedRoom
                        )?.room_name ||
                        "Selected Room"}

                  </p>

                </div>
              )}

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
                    onClick={() =>
                      fetchCalendarBookings()
                    }
                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Try Again
                  </button>

                </div>
              ) : (

                /* Calendar */

                <>
                  <Calendar
                    events={calendarEvents}
                    onDateClick={handleCalendarDayClick}
                    onEventClick={handleCalendarEventClick}
                    selectedDate={
                      calendarDay ?? undefined
                    }
                  />

                  {/* ==================================
                      SELECTED DAY BOOKINGS
                  ================================== */}

                  <div className="mt-5 border-t border-slate-200 pt-5">

                    {!calendarDay ? (

                      <p className="text-sm text-slate-500">
                        Select a date to see everything
                        booked that day.
                      </p>

                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4">

                          <div>

                            <h3 className="text-sm font-semibold text-slate-900">
                              {formatDayLabel(calendarDay)}
                            </h3>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {calendarDayBookings.length}{" "}
                              {calendarDayBookings.length === 1
                                ? "booking"
                                : "bookings"}
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setCalendarDay(null);
                              setExpandedBookingId(null);
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            Clear
                          </button>

                        </div>

                        {calendarDayBookings.length === 0 ? (

                          <p className="mt-3 text-sm text-slate-500">
                            No approved{" "}
                            {activeType === "room"
                              ? "room"
                              : "ride"}{" "}
                            bookings on this date.
                          </p>

                        ) : (

                          <ul className="mt-3 space-y-2">

                            {calendarDayBookings.map(
                              (booking) => {
                                const isExpanded =
                                  expandedBookingId ===
                                  booking.id;

                                return (
                                  <li
                                    key={booking.id}
                                    className="overflow-hidden rounded-lg border border-slate-200"
                                  >

                                    <button
                                      type="button"
                                      aria-expanded={isExpanded}
                                      onClick={() =>
                                        setExpandedBookingId(
                                          isExpanded
                                            ? null
                                            : booking.id
                                        )
                                      }
                                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50"
                                    >

                                      <div className="min-w-0">

                                        <p className="truncate text-sm font-medium text-slate-900">
                                          {booking.title}
                                        </p>

                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                          {booking.time} ·{" "}
                                          {booking.employee}
                                        </p>

                                      </div>

                                      <span className="shrink-0 text-xs font-medium text-[#03045e]">
                                        {isExpanded
                                          ? "Hide"
                                          : "View details"}
                                      </span>

                                    </button>

                                    {isExpanded && (

                                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">

                                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                                          <div className="min-w-0">

                                            <dt className="text-[11px] text-slate-400">
                                              Time
                                            </dt>

                                            <dd className="mt-0.5 text-sm text-slate-700">
                                              {booking.time}
                                            </dd>

                                          </div>

                                          {booking.details.map(
                                            (detail) => (
                                              <div
                                                key={detail.label}
                                                className="min-w-0"
                                              >

                                                <dt className="text-[11px] text-slate-400">
                                                  {detail.label}
                                                </dt>

                                                <dd
                                                  className="mt-0.5 truncate text-sm text-slate-700"
                                                  title={detail.value}
                                                >
                                                  {detail.value}
                                                </dd>

                                              </div>
                                            )
                                          )}

                                        </dl>

                                      </div>
                                    )}

                                  </li>
                                );
                              }
                            )}

                          </ul>
                        )}
                      </>
                    )}

                  </div>
                </>

              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}