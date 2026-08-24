"use client";

import { useEffect, useMemo, useState } from "react";
import AdminRoomBookingForm from "./AdminRoomBookingForm";
import { apiFetch } from "@/lib/api";
import {
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
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

  duration_minutes: number;

  purpose: string;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled";

  admin_remarks: string | null;

  approved_rejected_date_time: string | null;

  site: string;
}

interface RoomRequestsProps {
  status: ReservationStatus;
  searchQuery: string;
  roomId: string;
}

export default function RoomRequests({
  status,
  searchQuery,
  roomId
}: RoomRequestsProps) {
  const [requests, setRequests] =
    useState<RoomRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<RoomRequest | null>(null);

  const [actionType, setActionType] =
    useState<
      "approved" | "rejected" | null
    >(null);

  const [adminRemarks, setAdminRemarks] =
    useState("");

  const [updating, setUpdating] =
    useState(false);
const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
      matchesSearch
    );
  });
}, [
  requests,
  status,
  searchQuery,
  roomId,
]);

const [editingRequest, setEditingRequest] =
  useState<RoomRequest | null>(null);

const [cancelRequest, setCancelRequest] =
  useState<RoomRequest | null>(null);

const [cancelling, setCancelling] =
  useState(false);
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

    } catch (error) {
      console.error(
        "Error updating request:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update request."
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

    // Refresh list so status becomes CANCELLED
    await fetchRequests(false);

  } catch (error) {
    console.error(
      "Error cancelling booking:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to cancel room booking."
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
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

    {filteredRequests.map(
      (request) => (
        <div
          key={request.room_reservation_id}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >

          <div className="flex items-start justify-between gap-6">

            {/* LEFT */}
            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-3">

                <h3 className="font-semibold text-slate-900">
                  {request.employee_name}
                </h3>

                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    request.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : request.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                {request.employee_email}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Room
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {request.room}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Site
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {request.site}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {request.reservation_date}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Time
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {request.start_time}{" "}
                    -{" "}
                    {request.end_time}
                  </p>
                </div>

              </div>

              <div className="mt-4">

                <p className="text-xs text-slate-400">
                  Purpose
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {request.purpose}
                </p>

              </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="relative flex shrink-0 gap-2">

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
                    className="flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <X size={16} />
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType("approved");
                      setAdminRemarks("");
                    }}
                    className="flex items-center gap-2 rounded-md bg-[#03045e] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#02033f]"
                  >
                    <Check size={16} />
                    Approve
                  </button>
                </>
              )}


              {/* APPROVED */}
              {request.status === "approved" && (
                <div className="relative">

                  {/* THREE DOTS BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId ===
                          request.room_reservation_id
                          ? null
                          : request.room_reservation_id
                      )
                    }
                    className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Booking actions"
                  >
                    <MoreVertical size={18} />
                  </button>


                  {/* DROPDOWN MENU */}
                  {openMenuId ===
                    request.room_reservation_id && (
                    <div className="absolute right-0 top-full z-30 mt-2 w-32 rounded-md border border-slate-200 bg-white p-1 shadow-lg">

                      {/* EDIT */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRequest(request);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>


                      {/* CANCEL */}
                      <button
                        type="button"
                        onClick={() => {
                          setCancelRequest(request);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Cancel
                      </button>

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>


          {/* ==================================================
              CONFIRMATION MODAL
          ================================================== */}

          {selectedRequest &&
            actionType && (
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
                          {" "}
                          *
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

        </div>
      )
    )}


    {/* =========================================================
        CANCEL BOOKING CONFIRMATION
    ========================================================= */}

    {cancelRequest && (
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

          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              onClick={() => setCancelRequest(null)}
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
              disabled={cancelling}
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
}