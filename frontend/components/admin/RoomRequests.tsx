"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type ReservationStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

interface RoomRequest {
  room_reservation_id: number;

  request_date_time: string;

  room_id: number;
  room_name: string;

  employee_name: string;
  employee_email: string;

  reservation_date: string;

  start_time: string;
  end_time: string;

  duration_minute: number;

  purpose: string;

  status: "pending" | "approved" | "rejected";

  admin_remarks: string | null;

  approved_rejected_date_time: string | null;

  site: string;
}

interface RoomRequestsProps {
  status: ReservationStatus;
}

export default function RoomRequests({
  status,
}: RoomRequestsProps) {
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [selectedRequest, setSelectedRequest] =
  useState<RoomRequest | null>(null);

const [actionType, setActionType] =
  useState<"approved" | "rejected" | null>(null);

const [adminRemarks, setAdminRemarks] =
  useState("");

const [updating, setUpdating] =
  useState(false);


  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/room-requests`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  }
);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch room requests: ${response.status}`
        );
      }

      const data = await response.json();
      const normalizedata: RoomRequest[] = data.map((request: any) => ({
        ...request,
        status: request.status.toLowerCase(),
      }));
      setRequests(normalizedata);
    } catch (error) {
      console.error("Error fetching room requests:", error);

      setError(
        "Unable to load room requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  fetchRequests();

  const interval = setInterval(() => {
    fetchRequests();
  }, 5000);

  return () => clearInterval(interval);
}, []);
  

  const filteredRequests = useMemo(() => {
    if (status === "all") {
      return requests;
    }

    return requests.filter(
      (request) => request.status === status
    );
  }, [requests, status]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Loading room requests...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={fetchRequests}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="text-sm font-semibold text-slate-900">
          No room requests
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          There are no {status === "all" ? "" : status} room
          requests at the moment.
        </p>
      </div>
    );
  }

  const updateStatus = async (
  requestId: number,
  status: "approved" | "rejected",
  adminRemarks?: string
) => {
  try {
    const params = new URLSearchParams();

    params.append("status", status);

    if (adminRemarks) {
      params.append("admin_remarks", adminRemarks);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/room-requests/${requestId}/status?${params.toString()}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();

      throw new Error(
        error.detail || "Failed to update request."
      );
    }

    await fetchRequests();
  } catch (error) {
    console.error("Error updating request:", error);
  }
};



  return (
    <div className="space-y-3">
      {filteredRequests.map((request) => (
        <div
          key={request.room_reservation_id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-6">

            {/* Left */}
            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900">
                  {request.employee_name}
                </h3>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    request.status.toLowerCase() === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : request.status.toLowerCase() === "approved"
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
                    {request.room_name}
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
                    {request.start_time} - {request.end_time}
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

            {/* Actions */}
            {request.status.toLowerCase() === "pending" && (
              <div className="flex shrink-0 gap-2">
<button
  onClick={() => {
    setSelectedRequest(request);
    setActionType("rejected");
    setAdminRemarks("");
  }}
  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
>
  Reject
</button>

<button
  onClick={() => {
    setSelectedRequest(request);
    setActionType("approved");
    setAdminRemarks("");
  }}
  className="rounded-lg bg-[#03045e] px-3 py-2 text-sm font-medium text-white hover:bg-[#02033f]"
>
  Approve
</button>
{selectedRequest && actionType && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

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
            <span className="text-red-500"> *</span>
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
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]"
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
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          disabled={
            updating ||
            (actionType === "rejected" &&
              !adminRemarks.trim())
          }
          onClick={async () => {
            try {
              setUpdating(true);

              await updateStatus(
                selectedRequest.room_reservation_id,
                actionType,
                adminRemarks.trim() || undefined
              );

              setSelectedRequest(null);
              setActionType(null);
              setAdminRemarks("");
            } finally {
              setUpdating(false);
            }
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
            actionType === "approved"
              ? "bg-[#03045e] hover:bg-[#02033f]"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {updating
            ? "Processing..."
            : actionType === "approved"
            ? "Approve"
            : "Reject"}
        </button>

      </div>
    </div>
  </div>
)}

              </div>
            )}


          </div>
        </div>
      ))}
    </div>
  );
}