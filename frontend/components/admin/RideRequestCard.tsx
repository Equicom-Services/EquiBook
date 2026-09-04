"use client";

import { capitalizeFirst } from "@/lib/text";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  MapPinned,
  MessageSquare,
  Navigation,
  User,
  Users,
  XCircle,
  Trash2,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { getThrownMessage } from "@/lib/api";
import MessageDialog, {
  DialogMessage,
  MessageVariant,
} from "@/components/shared/MessageDialog";

interface RideBooking {
  id: string;
  title: string;
  request_date_time: string;
  travel_date: string;
  departure_time: string;
  pickup_location: string;
  pickup_maps_link: string | null;
  dropoff_destination: string;
  drop_off_maps_link: string | null;
  employee: string;
  employee_email: string;
  site: string;
  purpose: string;
  passengers_count: number;
  roundtrip: boolean;
  return_pickup: string | null;
  return_drop_off_location: string | null;
  return_drop_off_maps_link: string | null;
  vehicle_type: string | null;
  status: "approved" | "pending" | "rejected" | "cancelled";
  admin_remarks: string | null;
  approved_rejected_by: number | null;
approved_rejected_by_name: string | null;
  approved_rejected_date_time: string | null;
  created_at: string;
  updated_at: string;
}

interface RideRequestCardProps {
  booking: RideBooking;
  onStatusUpdate: (
    id: string,
    newStatus: "approved" | "rejected",
    remarks: string,
    vehicleType: string | null
  ) => Promise<void>;
  onCancel: (
    id: string,
    adminRemarks: string
  ) => Promise<void>;

  /*
   * List view shows the card collapsed until it is expanded.
   */
  collapsible?: boolean;
}

export default function RideRequestCard({
  booking,
  onStatusUpdate,
  onCancel,
  collapsible = false,
}: RideRequestCardProps) {
  const [updating, setUpdating] = useState(false);

  const [remarks, setRemarks] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  /*
   * In list view the card starts collapsed and shows only the
   * key details until it is expanded.
   */
  const [expanded, setExpanded] = useState(false);

  const isCollapsed = collapsible && !expanded;

  /*
   * Cancelling asks for a reason first, the same way rejecting
   * a request does.
   */
  const [showCancel, setShowCancel] = useState(false);
  const [cancelRemarks, setCancelRemarks] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!cancelRemarks.trim()) {
      showDialog(
        "error",
        "Reason Required",
        "Please enter a reason before cancelling this reservation."
      );
      return;
    }

    try {
      setCancelling(true);

      await onCancel(
        booking.id,
        cancelRemarks.trim()
      );

      setShowCancel(false);
      setCancelRemarks("");
    } catch (error) {
      showDialog(
        "error",
        "Cancellation Failed",
        getThrownMessage(
          error,
          "We could not cancel this reservation. Please try again."
        )
      );
    } finally {
      setCancelling(false);
    }
  };

  /*
   * Validation messages shown in a dialog.
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

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTime = (time: string) => {
    if (!time) return "-";

    const [hours, minutes] = time.split(":");

    const hour = Number(hours);
    const minute = Number(minutes);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return time;
    }

    const date = new Date();

    date.setHours(hour, minute, 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleStatusUpdate = async (
    status: "approved" | "rejected"
  ) => {
    const trimmedRemarks = remarks.trim();

    if (!trimmedRemarks) {
      showDialog(
        "error",
        "Remarks Required",
        "Please enter remarks before updating the reservation."
      );
      return;
    }

    if (status === "approved" && !vehicleType) {
      showDialog(
        "error",
        "Transportation Required",
        "Please select a transportation type before approving."
      );
      return;
    }

    try {
      setUpdating(true);

      await onStatusUpdate(
        booking.id,
        status,
        trimmedRemarks,
        status === "approved" ? vehicleType : null
      );

      setRemarks("");
      setVehicleType("");
    } catch (error) {
      console.error(
        "Failed to update ride reservation:",
        error
      );
    } finally {
      setUpdating(false);
    }
  };



return (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">

    {/* HEADER */}
    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
      {/* Left: Icon + Request Info */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Car className="h-4 w-4" />
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Ride Request
          </p>

          <h3
            className="mt-0.5 truncate text-sm font-semibold text-slate-900"
            title={booking.title}
          >
            {booking.title}
          </h3>

          <p className="mt-0.5 text-[10px] text-slate-400">
            Request #{booking.id}
          </p>
        </div>
      </div>

      {/* Right: Status + More Menu */}
      <div className="flex items-start gap-2">
        {/* Expand / Collapse */}
        {collapsible && (
          <button
            type="button"
            onClick={() =>
              setExpanded((current) => !current)
            }
            aria-expanded={expanded}
            aria-label={
              expanded
                ? "Hide details"
                : "Show details"
            }
            title={
              expanded
                ? "Hide details"
                : "Show details"
            }
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {/* Status */}
        <div>
          {booking.status === "approved" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-[10px] font-medium text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              APPROVED
            </span>
          )}

          {booking.status === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-1 text-[10px] font-medium text-yellow-700">
              <Clock className="h-3 w-3" />
              PENDING
            </span>
          )}

          {booking.status === "rejected" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700">
              <XCircle className="h-3 w-3" />
              REJECTED
            </span>
          )}

          {booking.status === "cancelled" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-700">
              <XCircle className="h-3 w-3" />
              CANCELLED
            </span>
          )}
        </div>

        {/* More Menu */}
        {booking.status === "approved" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((current) => !current)}
              aria-label="Booking actions"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setCancelRemarks("");
                    setShowCancel(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* COLLAPSED SUMMARY */}
    {isCollapsed && (
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <span
          className="flex min-w-0 items-center gap-1.5"
          title={booking.employee}
        >
          <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <span className="truncate">
            {booking.employee}
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          {formatDate(booking.travel_date)}
        </span>

        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {formatTime(booking.departure_time)}
        </span>

        <span
          className="flex min-w-0 items-center gap-1.5"
          title={capitalizeFirst(booking.dropoff_destination)}
        >
          <MapPinned className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <span className="truncate">
            {capitalizeFirst(booking.dropoff_destination)}
          </span>
        </span>
      </div>
    )}

    {!isCollapsed && (
      <>
    {/* REQUESTER INFORMATION */}
    <div className="mt-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Requester Information
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">

        {/* Requested By */}
        <div className="flex min-w-0 items-start gap-2">
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Requested by
            </p>

            <p
              className="mt-0.5 truncate text-xs font-medium text-slate-900"
              title={booking.employee}
            >
              {booking.employee}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex min-w-0 items-start gap-2">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Email
            </p>

            <p
              className="mt-0.5 truncate text-xs text-slate-600"
              title={booking.employee_email}
            >
              {booking.employee_email}
            </p>
          </div>
        </div>

        {/* Site */}
        <div className="flex min-w-0 items-start gap-2">
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Site
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-600">
              {booking.site}
            </p>
          </div>
        </div>

        {/* Passengers */}
        <div className="flex min-w-0 items-start gap-2">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Passengers
            </p>

            <p className="mt-0.5 text-xs text-slate-600">
              {booking.passengers_count}
            </p>
          </div>
        </div>

      </div>
    </div>

    {/* TRIP INFORMATION */}
    <div className="mt-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Trip Information
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">

        {/* Travel Date */}
        <div className="flex min-w-0 items-start gap-2">
          <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Travel Date
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-600">
              {formatDate(booking.travel_date)}
            </p>
          </div>
        </div>

        {/* Departure */}
        <div className="flex min-w-0 items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Departure
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-600">
              {formatTime(booking.departure_time)}
            </p>
          </div>
        </div>

        {/* Trip Type */}
        <div className="flex min-w-0 items-start gap-2">
          <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Trip Type
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-600">
              {booking.roundtrip
                ? "Round Trip"
                : "One Way"}
            </p>
          </div>
        </div>

        {/* Vehicle */}
        <div className="flex min-w-0 items-start gap-2">
          <Car className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">
              Vehicle
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-600">
              {capitalizeFirst(booking.vehicle_type) ||
                "Not assigned"}
            </p>
          </div>
        </div>

      </div>
    </div>

    {/* ROUTE + PURPOSE */}
    <div className="mt-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Route
      </p>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">

        {/* Pickup */}
        <div className="min-w-0 rounded-md bg-slate-50 px-3 py-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />

            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">
                Pickup
              </p>

              <p
                className="mt-0.5 truncate text-xs font-medium text-slate-800"
                title={capitalizeFirst(booking.pickup_location)}
              >
                {capitalizeFirst(booking.pickup_location)}
              </p>

              {booking.pickup_maps_link && (
                <a
                  href={booking.pickup_maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                >
                  <MapPinned className="h-2.5 w-2.5" />
                  Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Drop-off */}
        <div className="min-w-0 rounded-md bg-slate-50 px-3 py-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />

            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">
                Drop-off
              </p>

              <p
                className="mt-0.5 truncate text-xs font-medium text-slate-800"
                title={capitalizeFirst(booking.dropoff_destination)}
              >
                {capitalizeFirst(booking.dropoff_destination)}
              </p>

              {booking.drop_off_maps_link && (
                <a
                  href={booking.drop_off_maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                >
                  <MapPinned className="h-2.5 w-2.5" />
                  Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="min-w-0 rounded-md bg-slate-50 px-3 py-2">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">
                Purpose
              </p>

              <p
                className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600"
                title={capitalizeFirst(booking.purpose)}
              >
                {capitalizeFirst(booking.purpose)}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* RETURN TRIP */}
    {booking.roundtrip && (
      <div className="mt-2 rounded-md bg-slate-50 px-3 py-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Return Trip
        </p>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">

          {/* Return Pickup */}
          <div className="flex min-w-0 items-start gap-2">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">
                Return Pickup
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-600">
                {booking.return_pickup
                  ? formatDateTime(booking.return_pickup)
                  : "Not specified"}
              </p>
            </div>
          </div>

          {/* Return Drop-off */}
          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">
                Return Drop-off
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-600">
                {capitalizeFirst(
                  booking.return_drop_off_location
                ) || "Not specified"}
              </p>

              {booking.return_drop_off_maps_link && (
                <a
                  href={booking.return_drop_off_maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                >
                  <MapPinned className="h-2.5 w-2.5" />
                  Maps
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    )}

    {/* ADMIN REMARKS */}
    {booking.admin_remarks && (
      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <p className="text-[10px] font-medium text-slate-400">
              Admin Remarks
            </p>

            <p
              className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600"
              title={
                capitalizeFirst(booking.admin_remarks) ||
                undefined
              }
            >
              {capitalizeFirst(booking.admin_remarks)}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* REQUEST / APPROVAL INFORMATION */}
    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-2 md:grid-cols-4">

      {/* Request Date */}
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400">
          Request Date
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-600">
          {formatDateTime(booking.request_date_time)}
        </p>
      </div>

      {/* Last Updated */}
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400">
          Last Updated
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-600">
          {formatDateTime(booking.updated_at)}
        </p>
      </div>

      {/* Status Updated */}
      {booking.approved_rejected_date_time && (
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400">
            Status Updated
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-600">
            {formatDateTime(
              booking.approved_rejected_date_time
            )}
          </p>
        </div>
      )}

      {/* Processed By */}
      {booking.approved_rejected_by_name && (
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400">
            Processed By
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-600">
            {booking.approved_rejected_by_name}
          </p>
        </div>
      )}

    </div>

    {/* ACTIONS */}
    {booking.status === "pending" && (
      <div className="mt-2.5 border-t border-slate-100 pt-2.5">

        {/* Transportation Type */}
        <div className="mb-2.5">
          <label className="mb-1 block text-[10px] font-medium text-slate-500">
            Transportation Type
          </label>

          <select
            value={vehicleType}
            onChange={(event) =>
              setVehicleType(event.target.value)
            }
            disabled={updating}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]"
          >
            <option value="">
              Select transportation type
            </option>

            <option value="Company Car">
              Company Car
            </option>

            <option value="TNVS">
              TNVS
            </option>
          </select>
        </div>

        {/* Remarks */}
        <div className="mb-2.5">
          <label className="mb-1 block text-[10px] font-medium text-slate-500">
            Admin Remarks
          </label>

          <textarea
            value={remarks}
            onChange={(event) =>
              setRemarks(event.target.value)
            }
            disabled={updating}
            rows={2}
            placeholder="Enter remarks..."
            className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={updating}
            onClick={() =>
              handleStatusUpdate("rejected")
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            {updating ? "Updating..." : "Reject"}
          </button>

          <button
            type="button"
            disabled={updating}
            onClick={() =>
              handleStatusUpdate("approved")
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-[#03045e] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {updating ? "Updating..." : "Approve"}
          </button>
        </div>

      </div>
    )}
      </>
    )}

    {/* Bottom spacing */}
    <div className="mt-2 flex justify-end border-t border-slate-100 pt-2" />

    {/* Cancel confirmation */}

    {showCancel && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

        <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">

          <h2 className="text-lg font-semibold text-slate-900">
            Cancel Ride Reservation
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Are you sure you want to cancel this ride
            reservation?
          </p>

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">

            <p className="text-sm font-semibold text-slate-800">
              {booking.employee}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {capitalizeFirst(booking.dropoff_destination)}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {formatDate(booking.travel_date)}
            </p>

            <p className="text-sm text-slate-500">
              {formatTime(booking.departure_time)}
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
                setShowCancel(false);
                setCancelRemarks("");
              }}
              disabled={cancelling}
              className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Keep Reservation
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={
                cancelling || !cancelRemarks.trim()
              }
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {cancelling
                ? "Cancelling..."
                : "Cancel Reservation"}
            </button>

          </div>

        </div>

      </div>
    )}

    <MessageDialog
      isOpen={dialog !== null}
      variant={dialog?.variant}
      title={dialog?.title ?? ""}
      message={dialog?.message ?? ""}
      onClose={() => setDialog(null)}
    />

  </div>
);
}