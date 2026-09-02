"use client";

import { useCallback, useEffect, useState } from "react";

import { Grid2X2, List } from "lucide-react";

import RideRequestCard from "./RideRequestCard";
import { capitalizeFirst } from "@/lib/text";

interface RideReservationResponse {
  ride_reservation_id: number;
  request_date_time: string;
  employee_name: string;
  employee_email: string;
  site_id: number;
  site: string;
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
  approved_rejected_by_name: string | null;
  approved_rejected_date_time: string | null; 

  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

interface RideBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  employee: string;
  employee_email: string;
  site: string;
  site_id: number;
  travel_date: string;
  departure_time: string;
  pickup_location: string;
  pickup_maps_link: string | null;
  dropoff_destination: string;
  drop_off_maps_link: string | null;
  return_pickup: string | null;
  return_drop_off_location: string | null;
  return_drop_off_maps_link: string | null;
  purpose: string;
  passengers_count: number;
  roundtrip: boolean;
  vehicle_type: string | null;
  request_date_time: string;
  status: "approved" | "pending" | "rejected" | "cancelled";
  admin_remarks: string | null;
  approved_rejected_by: number | null;
  approved_rejected_by_name: string | null;
  approved_rejected_date_time: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

interface RideRequestsProps {
  status:
    | "all"
    | "approved"
    | "pending"
    | "rejected"
    | "cancelled";
  searchQuery: string;

  /*
   * `YYYY-MM-DD`, or an empty string for any date.
   */
  reservationDate: string;

  /*
   * Bumped by the dashboard when a reservation is created
   * elsewhere on the page, so this list reloads.
   */
  refreshTrigger?: number;

  /*
   * Called after an action succeeds, so the dashboard can
   * refresh its statistics and calendar.
   */
  onActionComplete?: () => void;
}

export default function RideRequests({
  status,
  searchQuery,
  reservationDate,
  refreshTrigger = 0,
  onActionComplete,
}: RideRequestsProps) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ==========================================================
  // FETCH RIDE RESERVATIONS
  // ==========================================================

  const fetchRideReservations = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("You are not authenticated.");
        }

        const response = await fetch(
          `${apiUrl}/api/ride-reservations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          throw new Error(
            `Failed to fetch ride reservations: ${response.status}`
          );
        }

        const data: RideReservationResponse[] =
          await response.json();

        const mappedBookings: RideBooking[] = data.map(
          (reservation) => {
            const start = `${reservation.travel_date}T${reservation.departure_time}`;

            return {
              id: String(reservation.ride_reservation_id),
              title: capitalizeFirst(reservation.purpose),
              start,
              end: start,

              
              employee: reservation.employee_name,
              employee_email: reservation.employee_email,

              site: reservation.site,
              site_id: reservation.site_id,

              travel_date: reservation.travel_date,
              departure_time: reservation.departure_time,

              pickup_location: reservation.pickup_location,
              pickup_maps_link: reservation.pickup_maps_link,

              dropoff_destination:
                reservation.dropoff_destination,
              drop_off_maps_link:
                reservation.drop_off_maps_link,

              return_pickup: reservation.return_pickup,

              return_drop_off_location:
                reservation.return_drop_off_location,

              return_drop_off_maps_link:
                reservation.return_drop_off_maps_link,

              purpose: reservation.purpose,

              passengers_count:
                reservation.passenger_count,

              roundtrip: reservation.roundtrip,

              vehicle_type:
                reservation.vehicle_type,

              request_date_time:
                reservation.request_date_time,

              status:
                reservation.status.toLowerCase() as
                  | "approved"
                  | "pending"
                  | "rejected"
                  | "cancelled",

              admin_remarks:
                reservation.admin_remarks,

              approved_rejected_by:
                reservation.approved_rejected_by,

              approved_rejected_by_name:
                reservation.approved_rejected_by_name,

              approved_rejected_date_time:
                reservation.approved_rejected_date_time,
              calendar_event_id:
                reservation.calendar_event_id,

              created_at:
                reservation.created_at,

              updated_at:
                reservation.updated_at,
            };
          }
        );

        setBookings(mappedBookings);
      } catch (err) {
        console.error(
          "Failed to fetch ride reservations:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load ride requests."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRideReservations();
  }, [fetchRideReservations]);

  /*
   * Reload silently when the dashboard signals a change made
   * elsewhere on the page. A visible loading state here would
   * blank the list and collapse any expanded card.
   */
  useEffect(() => {
    if (refreshTrigger === 0) {
      return;
    }

    fetchRideReservations(false);
  }, [refreshTrigger, fetchRideReservations]);

  // ==========================================================
  // FILTER RIDE REQUESTS
  // ==========================================================

  const normalizedSearch = searchQuery
    .trim()
    .toLowerCase();

  const filteredBookings = bookings.filter(
    (booking) => {
      // ------------------------------------------------------
      // STATUS FILTER
      // ------------------------------------------------------

      const matchesStatus =
        status === "all" ||
        booking.status === status;

      if (!matchesStatus) {
        return false;
      }

      // ------------------------------------------------------
      // DATE FILTER
      // ------------------------------------------------------

      const matchesDate =
        !reservationDate ||
        booking.travel_date === reservationDate;

      if (!matchesDate) {
        return false;
      }

      // ------------------------------------------------------
      // SEARCH FILTER
      // ------------------------------------------------------

      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [
        booking.employee,
        booking.employee_email,
        booking.site,
        booking.pickup_location,
        booking.dropoff_destination,
        booking.purpose,
        booking.vehicle_type ?? "",
        booking.travel_date,
        booking.departure_time,
        booking.return_pickup ?? "",
        booking.return_drop_off_location ?? "",
      ];

      return searchableFields.some((field) =>
        field
          .toLowerCase()
          .includes(normalizedSearch)
      );
    }
  );

  // ==========================================================
  // UPDATE RIDE RESERVATION STATUS
  // ==========================================================

  const updateRideReservationStatus = async (
    id: string,
    newStatus: "approved" | "rejected",
    remarks: string,
    vehicleType: string | null
  ) => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL;

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      throw new Error(
        "You are not authenticated."
      );
    }

const response = await fetch(
  `${apiUrl}/api/ride-reservations/${id}/status`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status: newStatus.toUpperCase(),
      admin_remarks: remarks,
      vehicle_type: vehicleType,
    }),
  }
);

const data = await response.json();

if (!response.ok) {
  throw new Error(
    data?.detail ||
      `Failed to update reservation: ${response.status}`
  );
}

const updatedReservation: RideReservationResponse = data;

    // Update local state immediately
setBookings((current) =>
  current.map((booking) =>
    booking.id === id
      ? {
          ...booking,
          status: newStatus,
          admin_remarks: remarks,
          vehicle_type: vehicleType,
          approved_rejected_by:
            updatedReservation.approved_rejected_by,
          approved_rejected_by_name:
            updatedReservation.approved_rejected_by_name,
          approved_rejected_date_time:
            updatedReservation.approved_rejected_date_time,
          updated_at:
            updatedReservation.updated_at,
        }
      : booking
  )
);

  onActionComplete?.();
  };

  // ==========================================================
// DELETE RIDE RESERVATION
// ==========================================================

const cancelRideReservation = async (
  id: string,
  adminRemarks: string
) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${apiUrl}/api/ride-reservations/${id}/cancel`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        admin_remarks: adminRemarks.trim(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Failed to cancel reservation: ${response.status}`
    );
  }

  const updatedReservation: RideReservationResponse = data;

  setBookings((current) =>
    current.map((booking) =>
      booking.id === id
        ? {
            ...booking,
            status: "cancelled",
            admin_remarks: updatedReservation.admin_remarks,
            approved_rejected_by:
              updatedReservation.approved_rejected_by,
            approved_rejected_by_name:
              updatedReservation.approved_rejected_by_name,
            approved_rejected_date_time:
              updatedReservation.approved_rejected_date_time,
            updated_at: updatedReservation.updated_at,
          }
        : booking
    )
  );

  onActionComplete?.();
};

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          Loading ride requests...
        </p>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-red-200 bg-white">
        <p className="text-sm text-red-500">
          {error}
        </p>
      </div>
    );
  }

  // ==========================================================
  // NO RESULTS
  // ==========================================================

  if (filteredBookings.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          No ride requests found.
        </p>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ==================================================
          VIEW TOGGLE
      ================================================== */}

      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            title="Grid view"
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              viewMode === "grid"
                ? "bg-[#03045e] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Grid2X2 size={16} />
            Grid
          </button>

          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            title="List view"
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              viewMode === "list"
                ? "bg-[#03045e] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>

      {/* ==================================================
          RIDE REQUESTS
      ================================================== */}

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
            : "flex flex-col gap-3"
        }
      >
        {filteredBookings.map((booking) => (
<RideRequestCard
  key={booking.id}
  booking={booking}
  onStatusUpdate={updateRideReservationStatus}
  onCancel={cancelRideReservation}
  collapsible={viewMode === "list"}
/>
        ))}
      </div>
    </>
  );
}