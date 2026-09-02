"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import MessageDialog, {
  DialogMessage,
  MessageVariant,
} from "@/components/shared/MessageDialog";
import {
  Check,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  DoorOpen,
  MapPin,
  CalendarDays,
  Clock3,
  CalendarCheck,
  FileText,
  MessageSquare,
  Mail,
  ShieldCheck,
  ShieldX,
  Grid2X2,
  List,
  ChevronDown,
} from "lucide-react";
import AdminRoomBookingForm from "@/components/admin/AdminRoomBookingForm";
type ReservationStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

interface RoomRequest {
  room_reservation_id: number;
  request_date_time: string;

  room_id: number;
  room: string;

  employee_name: string;
  employee_email: string;

  reservation_date: string;

  start_time: string;
  end_time: string;
  approved_rejected_by: number | null;
  approved_rejected_by_name: string | null;
  approved_rejected_by_email: string | null;
  approved_rejected_date_time: string | null;
  duration_minutes: number;

  purpose: string;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled";

  admin_remarks: string | null;


  site: string;
}

interface RoomRequestsProps {
  status: ReservationStatus;
  searchQuery: string;
  roomId: string;

  /*
   * `YYYY-MM-DD`, or an empty string for any date.
   */
  reservationDate: string;

  /*
   * Bumped by the dashboard when a booking is created
   * elsewhere on the page, so this list reloads.
   */
  refreshTrigger?: number;

  /*
   * Called after an action succeeds, so the dashboard can
   * refresh its statistics and calendar.
   */
  onActionComplete?: () => void;
}

export default function RoomRequests({
  status,
  searchQuery,
  roomId,
  reservationDate,
  refreshTrigger = 0,
  onActionComplete,
}: RoomRequestsProps) {
  const [requests, setRequests] =
    useState<RoomRequest[]>([]);

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    /*
     * In list view a card shows only the key details until it
     * is expanded.
     */
    const [expandedId, setExpandedId] =
      useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<RoomRequest | null>(null);

  const [requestedPage, setRequestedPage] = useState(1);

const ITEMS_PER_PAGE = 10;

  const [actionType, setActionType] =
    useState<
      "approved" | "rejected" | null
    >(null);

  const [adminRemarks, setAdminRemarks] =
    useState("");

  const [updating, setUpdating] =
    useState(false);
const [openMenuId, setOpenMenuId] = useState<number | null>(null);

/*
 * Booking currently open in the edit form.
 */
const [editingRequest, setEditingRequest] =
  useState<RoomRequest | null>(null);

  // ==========================================================
  // FETCH REQUESTS
  // ==========================================================

const fetchRequests = async (showLoading = false) => {
  try {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

      const response = await apiFetch(
        "/api/room-requests",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        window.location.href =
          "/admin/login";

        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to view these room requests."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch room requests: ${response.status}`
        );
      }

      const data = await response.json();

      const normalizedData: RoomRequest[] =
        data.map((request: any) => ({
          ...request,
          status:
            request.status.toLowerCase(),
        }));

      setRequests(normalizedData);

    } catch (error) {
      console.error(
        "Error fetching room requests:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load room requests."
      );

    } finally {
  if (showLoading) {
    setLoading(false);
  }
}
  };


  // ==========================================================
  // INITIAL FETCH + AUTO REFRESH
  // ==========================================================

useEffect(() => {
  // Show loading only on the initial fetch
  fetchRequests(true);

  // Background refresh every 5 seconds
  const interval = setInterval(() => {
    fetchRequests(false);
  }, 5000);

  return () => clearInterval(interval);
}, []);

/*
 * The actions menu closes on a click anywhere else on the page
 * or on Escape.
 *
 * The menu marks itself with `data-actions-menu` and clicks
 * inside it are ignored here. React delegates its own events to
 * `document` as well, so stopping propagation in a handler would
 * not keep the click from reaching this listener.
 */
useEffect(() => {
  if (openMenuId === null) {
    return;
  }

  const closeOnOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;

    if (target?.closest("[data-actions-menu]")) {
      return;
    }

    setOpenMenuId(null);
  };

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpenMenuId(null);
    }
  };

  document.addEventListener("mousedown", closeOnOutsideClick);
  document.addEventListener("keydown", closeOnEscape);

  return () => {
    document.removeEventListener("mousedown", closeOnOutsideClick);
    document.removeEventListener("keydown", closeOnEscape);
  };
}, [openMenuId]);

/*
 * Reload silently when the dashboard signals a change made
 * elsewhere on the page. A visible loading state here would
 * blank the list and collapse any expanded card.
 */
useEffect(() => {
  if (refreshTrigger === 0) {
    return;
  }

  fetchRequests(false);
}, [refreshTrigger]);


  // ==========================================================
  // FILTER BY STATUS
  // ==========================================================

const filteredRequests = useMemo(() => {
  const query = searchQuery.trim().toLowerCase();

  return requests.filter((request) => {
    const matchesStatus =
      status === "all" ||
      request.status === status;

    const matchesRoom =
      roomId === "all" ||
      String(request.room_id) === roomId;

    const matchesDate =
      !reservationDate ||
      request.reservation_date === reservationDate;

    const matchesSearch =
      !query ||
      request.employee_name
        .toLowerCase()
        .includes(query) ||
      request.employee_email
        .toLowerCase()
        .includes(query) ||
      request.room
        .toLowerCase()
        .includes(query) ||
      request.site
        .toLowerCase()
        .includes(query) ||
      request.purpose
        .toLowerCase()
        .includes(query) ||
      request.reservation_date
        .toLowerCase()
        .includes(query) ||
      request.start_time
        .toLowerCase()
        .includes(query) ||
      request.end_time
        .toLowerCase()
        .includes(query);

    return (
      matchesStatus &&
      matchesRoom &&
      matchesDate &&
      matchesSearch
    );
  });
}, [
  requests,
  status,
  searchQuery,
  roomId,
  reservationDate,
]);


const totalPages = Math.ceil(
  filteredRequests.length / ITEMS_PER_PAGE
);

// Clamped so a narrowing filter can't strand us past the last page
const currentPage = Math.min(
  requestedPage,
  Math.max(totalPages, 1)
);

const paginatedRequests = useMemo(() => {
  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  return filteredRequests.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
}, [filteredRequests, currentPage]);


const [cancelRequest, setCancelRequest] =
  useState<RoomRequest | null>(null);

const [cancelling, setCancelling] =
  useState(false);

/*
 * Reason the admin gives when cancelling a booking, shown to
 * the requester in the cancellation email.
 */
const [cancelRemarks, setCancelRemarks] =
  useState("");

/*
 * Error messages shown in a dialog.
 */
const [dialog, setDialog] =
  useState<DialogMessage | null>(null);

function showDialog(
  variant: MessageVariant,
  title: string,
  message: string
) {
  setDialog({ variant, title, message });
}
  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  const updateStatus = async (
    requestId: number,
    newStatus:
      | "approved"
      | "rejected",
    remarks?: string
  ) => {
    try {
      const response = await apiFetch(
        `/api/room-requests/${requestId}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            status: newStatus,
            admin_remarks:
              remarks || null,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        window.location.href =
          "/admin/login";

        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to modify this room request."
        );
      }

      if (!response.ok) {
        const error =
          await response.json();

        throw new Error(
          error.detail ||
            "Failed to update request."
        );
      }

      await fetchRequests(false);

      onActionComplete?.();

    } catch (error) {
      console.error(
        "Error updating request:",
        error
      );

      showDialog(
        "error",
        "Update Failed",
        error instanceof Error
          ? error.message
          : "We could not update this request. Please try again."
      );
    }
  };


const cancelBooking = async (requestId: number) => {
  try {
    setCancelling(true);

    const response = await apiFetch(
      `/api/room-requests/admin/room-bookings/${requestId}/cancel`,
      {
        method: "PATCH",
        body: JSON.stringify({
          admin_remarks: cancelRemarks.trim(),
        }),
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/admin/login";
      return;
    }

    if (response.status === 403) {
      throw new Error(
        "You are not authorized to cancel this booking."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      // Already cancelled by another action/tab/admin.
      // Close the modal and refresh the list.
      if (
        data.detail ===
        "This booking is already cancelled."
      ) {
        setCancelRequest(null);
        setCancelRemarks("");

        await fetchRequests(false);

        return;
      }

      throw new Error(
        data.detail ||
          "Failed to cancel room booking."
      );
    }

    // Successfully cancelled
    setCancelRequest(null);
    setCancelRemarks("");

    // Refresh list so status becomes CANCELLED
    await fetchRequests(false);

    onActionComplete?.();

  } catch (error) {
    console.error(
      "Error cancelling booking:",
      error
    );

    showDialog(
      "error",
      "Cancellation Failed",
      error instanceof Error
        ? error.message
        : "We could not cancel this booking. Please try again."
    );
  } finally {
    setCancelling(false);
  }
};


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Loading room requests...
        </p>
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">
          {error}
        </p>

<button
  onClick={() => fetchRequests(true)}
  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
>
  Try Again
</button>
      </div>
    );
  }


  // ==========================================================
  // EMPTY
  // ==========================================================

  if (
    filteredRequests.length === 0
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="text-sm font-semibold text-slate-900">
          No room requests
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          There are no{" "}
          {status === "all"
            ? ""
            : status}{" "}
          room requests at the moment.
        </p>
      </div>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

return (
  <>
  <div className="mb-4 flex justify-end">
  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
    <button
      type="button"
      onClick={() => setViewMode("grid")}
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
        REQUEST CARDS
    ================================================== */}

    <div
  className={
    viewMode === "grid"
      ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
      : "flex flex-col gap-3"
  }
>

      {paginatedRequests.map((request) => {

        const isCollapsed =
          viewMode === "list" &&
          expandedId !== request.room_reservation_id;

        return (
        <div
          key={request.room_reservation_id}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-start justify-between gap-4">

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-2">

                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {request.employee_name}
                </h3>

                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    request.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : request.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : request.status === "cancelled"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status}
                </span>

              </div>

              {!isCollapsed && (
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail size={12} />

                  <span className="truncate">
                    {request.employee_email}
                  </span>
                </div>
              )}

            </div>


            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="relative flex shrink-0 gap-1.5">

              {/* EXPAND / COLLAPSE */}
              {viewMode === "list" && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(
                      isCollapsed
                        ? request.room_reservation_id
                        : null
                    )
                  }
                  aria-expanded={!isCollapsed}
                  aria-label={
                    isCollapsed
                      ? "Show details"
                      : "Hide details"
                  }
                  title={
                    isCollapsed
                      ? "Show details"
                      : "Hide details"
                  }
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      isCollapsed ? "" : "rotate-180"
                    }`}
                  />
                </button>
              )}

              {/* PENDING */}
              {request.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType("rejected");
                      setAdminRemarks("");
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <X size={14} />
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType("approved");
                      setAdminRemarks("");
                    }}
                    className="flex items-center gap-1.5 rounded-md bg-[#03045e] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#02033f]"
                  >
                    <Check size={14} />
                    Approve
                  </button>

                  <div
                    className="relative"
                    data-actions-menu
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === request.room_reservation_id
                            ? null
                            : request.room_reservation_id
                        )
                      }
                      className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                      aria-label="Request actions"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === request.room_reservation_id && (
                      <div className="absolute right-0 top-full z-30 mt-2 w-32 rounded-md border border-slate-200 bg-white p-1 shadow-lg">

                        <button
                          type="button"
                          onClick={() => {
                            setEditingRequest(request);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                      </div>
                    )}

                  </div>
                </>
              )}


              {/* APPROVED */}
              {request.status === "approved" && (
                <div
                  className="relative"
                  data-actions-menu
                >

                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === request.room_reservation_id
                          ? null
                          : request.room_reservation_id
                      )
                    }
                    className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Booking actions"
                  >
                    <MoreVertical size={16} />
                  </button>


                  {openMenuId === request.room_reservation_id && (
                    <div className="absolute right-0 top-full z-30 mt-2 w-32 rounded-md border border-slate-200 bg-white p-1 shadow-lg">

                      <button
                        type="button"
                        onClick={() => {
                          setCancelRequest(request);
                          setCancelRemarks("");
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Cancel
                      </button>

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>


          {/* ==================================================
              COLLAPSED SUMMARY
          ================================================== */}

          {isCollapsed && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">

              <span
                className="flex min-w-0 items-center gap-1.5"
                title={request.room}
              >
                <DoorOpen size={13} className="shrink-0 text-slate-400" />

                <span className="truncate">
                  {request.room}
                </span>
              </span>

              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-slate-400" />
                {request.reservation_date}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock3 size={13} className="text-slate-400" />
                {request.start_time} - {request.end_time}
              </span>

            </div>
          )}


          {/* ==================================================
              BOOKING INFORMATION
          ================================================== */}

          {!isCollapsed && (
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 md:grid-cols-4">

            {/* ROOM */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <DoorOpen size={13} />
                <span>Room</span>
              </div>

              <p
                className="mt-0.5 truncate text-sm font-medium text-slate-700"
                title={request.room}
              >
                {request.room}
              </p>
            </div>


            {/* SITE */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={13} />
                <span>Site</span>
              </div>

              <p
                className="mt-0.5 truncate text-sm font-medium text-slate-700"
                title={request.site}
              >
                {request.site}
              </p>
            </div>


            {/* RESERVATION DATE */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDays size={13} />
                <span>Reservation Date</span>
              </div>

              <p className="mt-0.5 text-sm font-medium text-slate-700">
                {request.reservation_date}
              </p>
            </div>


            {/* TIME */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock3 size={13} />
                <span>Time</span>
              </div>

              <p className="mt-0.5 text-sm font-medium text-slate-700">
                {request.start_time} - {request.end_time}
              </p>
            </div>


            {/* DATE BOOKED */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarCheck size={13} />
                <span>Date Booked</span>
              </div>

              <p
                className="mt-0.5 truncate text-sm font-medium text-slate-700"
                title={
                  request.request_date_time
                    ? new Date(
                        request.request_date_time
                      ).toLocaleString()
                    : "N/A"
                }
              >
                {request.request_date_time
                  ? new Date(
                      request.request_date_time
                    ).toLocaleString()
                  : "N/A"}
              </p>
            </div>

          </div>
          )}


          {/* ==================================================
              PURPOSE
          ================================================== */}

          {!isCollapsed && (
          <div className="mt-3 border-t border-slate-100 pt-3">

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText size={13} />
              <span>Purpose</span>
            </div>

            <p
              className="mt-0.5 truncate text-sm text-slate-700"
              title={request.purpose}
            >
              {request.purpose}
            </p>

          </div>
          )}


          {/* ==================================================
              APPROVAL / REJECTION DETAILS
          ================================================== */}

          {!isCollapsed && request.status !== "pending" && (
            <div className="mt-3 border-t border-slate-100 pt-3">

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                {/* REMARKS */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MessageSquare size={13} />
                    <span>Remarks</span>
                  </div>

                  <p
                    className="mt-0.5 truncate text-sm text-slate-700"
                    title={
                      request.admin_remarks ||
                      "No remarks"
                    }
                  >
                    {request.admin_remarks || "No remarks"}
                  </p>
                </div>


                {/* APPROVED / REJECTED BY */}
                <div className="min-w-0">

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">

                    {request.status === "approved" ? (
                      <ShieldCheck size={13} />
                    ) : (
                      <ShieldX size={13} />
                    )}

                    <span>
                      {request.status === "approved"
                        ? "Approved By"
                        : request.status === "rejected"
                        ? "Rejected By"
                        : "Cancelled By"}
                    </span>

                  </div>

                  <p
                    className="mt-0.5 truncate text-sm font-medium text-slate-700"
                    title={
                      request.approved_rejected_by_name ||
                      "N/A"
                    }
                  >
                    {request.approved_rejected_by_name || "N/A"}
                  </p>

                  {request.approved_rejected_by_email && (
                    <p
                      className="mt-0.5 truncate text-xs text-slate-400"
                      title={
                        request.approved_rejected_by_email
                      }
                    >
                      {request.approved_rejected_by_email}
                    </p>
                  )}

                </div>


                {/* APPROVED / REJECTED DATE */}
                <div className="min-w-0">

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">

                    <CalendarCheck size={13} />

                    <span>
                      {request.status === "approved"
                        ? "Approved Date"
                        : request.status === "rejected"
                        ? "Rejected Date"
                        : "Cancelled Date"}
                    </span>

                  </div>

                  <p
                    className="mt-0.5 truncate text-sm text-slate-700"
                    title={
                      request.approved_rejected_date_time
                        ? new Date(
                            request.approved_rejected_date_time
                          ).toLocaleString()
                        : "N/A"
                    }
                  >
                    {request.approved_rejected_date_time
                      ? new Date(
                          request.approved_rejected_date_time
                        ).toLocaleString()
                      : "N/A"}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* ==================================================
              CONFIRMATION MODAL
          ================================================== */}

          {selectedRequest &&
            actionType &&
            selectedRequest.room_reservation_id ===
              request.room_reservation_id && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

                <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">

                  <h2 className="text-lg font-semibold text-slate-900">
                    {actionType === "approved"
                      ? "Approve Room Request"
                      : "Reject Room Request"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {actionType === "approved"
                      ? "Are you sure you want to approve this room reservation?"
                      : "Please provide a reason for rejecting this request."}
                  </p>

                  <div className="mt-5">

                    <label className="text-sm font-medium text-slate-700">
                      Remarks

                      {actionType === "rejected" && (
                        <span className="text-red-500">
                          {" "}*
                        </span>
                      )}
                    </label>

                    <textarea
                      value={adminRemarks}
                      onChange={(e) =>
                        setAdminRemarks(e.target.value)
                      }
                      placeholder={
                        actionType === "approved"
                          ? "Optional remarks..."
                          : "Reason for rejection..."
                      }
                      rows={4}
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]"
                    />

                  </div>

                  <div className="mt-6 flex justify-end gap-3">

                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setActionType(null);
                        setAdminRemarks("");
                      }}
                      disabled={updating}
                      className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    <button
                      disabled={
                        updating ||
                        (actionType === "rejected" &&
                          !adminRemarks.trim())
                      }
                      onClick={async () => {

                        if (
                          !selectedRequest ||
                          !actionType
                        ) {
                          return;
                        }

                        try {

                          setUpdating(true);

                          await updateStatus(
                            selectedRequest.room_reservation_id,
                            actionType,
                            adminRemarks.trim() ||
                              undefined
                          );

                          setSelectedRequest(null);
                          setActionType(null);
                          setAdminRemarks("");

                        } finally {
                          setUpdating(false);
                        }

                      }}
                      className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                        actionType === "approved"
                          ? "bg-[#03045e] hover:bg-[#02033f]"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >

                      {updating ? (
                        "Processing..."
                      ) : actionType === "approved" ? (
                        <>
                          <Check size={16} />
                          Approve
                        </>
                      ) : (
                        <>
                          <X size={16} />
                          Reject
                        </>
                      )}

                    </button>

                  </div>

                </div>

              </div>
            )}


          {/* ==================================================
              CANCEL BOOKING CONFIRMATION
          ================================================== */}

          {cancelRequest &&
            cancelRequest.room_reservation_id ===
              request.room_reservation_id && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

                <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">

                  <h2 className="text-lg font-semibold text-slate-900">
                    Cancel Room Booking
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Are you sure you want to cancel this room reservation?
                  </p>

                  <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">

                    <p className="text-sm font-semibold text-slate-800">
                      {cancelRequest.employee_name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {cancelRequest.room}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {cancelRequest.reservation_date}
                    </p>

                    <p className="text-sm text-slate-500">
                      {cancelRequest.start_time} -{" "}
                      {cancelRequest.end_time}
                    </p>

                  </div>

                  {/* Reason */}

                  <div className="mt-5">

                    <label className="text-sm font-medium text-slate-700">
                      Reason for Cancellation

                      <span className="text-red-500">
                        {" "}*
                      </span>
                    </label>

                    <textarea
                      value={cancelRemarks}
                      onChange={(e) =>
                        setCancelRemarks(e.target.value)
                      }
                      placeholder="Reason for cancellation..."
                      rows={4}
                      disabled={cancelling}
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e] disabled:bg-slate-50"
                    />

                  </div>

                  <div className="mt-6 flex justify-end gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setCancelRequest(null);
                        setCancelRemarks("");
                      }}
                      disabled={cancelling}
                      className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X size={16} />
                      Keep Booking
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        cancelBooking(
                          cancelRequest.room_reservation_id
                        )
                      }
                      disabled={
                        cancelling ||
                        !cancelRemarks.trim()
                      }
                      className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />

                      {cancelling
                        ? "Cancelling..."
                        : "Yes, Cancel Booking"}
                    </button>

                  </div>

                </div>

              </div>
            )}

        </div>
        );
      })}

    </div>


    {/* ==================================================
        PAGINATION
    ================================================== */}

    {totalPages > 1 && (
      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

        {/* RESULTS */}
        <p className="text-sm text-slate-500">

          Showing{" "}

          <span className="font-medium text-slate-700">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
          </span>

          {" - "}

          <span className="font-medium text-slate-700">
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              filteredRequests.length
            )}
          </span>

          {" of "}

          <span className="font-medium text-slate-700">
            {filteredRequests.length}
          </span>

          {" requests"}

        </p>


        {/* CONTROLS */}
        <div className="flex items-center gap-1">

          {/* PREVIOUS */}
          <button
            type="button"
            onClick={() =>
              setRequestedPage(
                Math.max(currentPage - 1, 1)
              )
            }
            disabled={currentPage === 1}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>


          {/* PAGE NUMBERS */}
          <div className="flex items-center gap-1">

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() =>
                  setRequestedPage(page)
                }
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


          {/* NEXT */}
          <button
            type="button"
            onClick={() =>
              setRequestedPage(
                Math.min(currentPage + 1, totalPages)
              )
            }
            disabled={
              currentPage === totalPages
            }
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>
    )}

    {/* ==================================================
        EDIT BOOKING
    ================================================== */}

    {editingRequest && (
      <AdminRoomBookingForm
        editingRequest={editingRequest}
        onClose={() => setEditingRequest(null)}
        onSuccess={() => {
          setEditingRequest(null);

          fetchRequests(false);

          onActionComplete?.();
        }}
      />
    )}

    <MessageDialog
      isOpen={dialog !== null}
      variant={dialog?.variant}
      title={dialog?.title ?? ""}
      message={dialog?.message ?? ""}
      onClose={() => setDialog(null)}
    />

  </>
);
}