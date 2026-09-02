import { capitalizeFirst } from "@/lib/text";

interface RoomBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  room: string;
  employee: string;
  company_email: string;
  site: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
}

interface RoomRequestCardProps {
  booking: RoomBooking;
}

export default function RoomRequestCard({
  booking,
}: RoomRequestCardProps) {
  const startDate = new Date(booking.start);

  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const startTime = new Date(
    booking.start
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const endTime = new Date(
    booking.end
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">

      {/* Request Information */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">

        {/* Room */}
        <div>
          <p className="text-xs text-slate-400">
            Room
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {booking.room}
          </p>
        </div>

        {/* Booking */}
        <div>
          <p className="text-xs text-slate-400">
            Booking
          </p>

          <p className="mt-1 text-sm font-medium text-slate-900">
            {booking.title}
          </p>
        </div>

        {/* Employee */}
        <div>
          <p className="text-xs text-slate-400">
            Requested by
          </p>

          <p className="mt-1 text-sm font-medium text-slate-900">
            {booking.employee}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {booking.company_email}
          </p>
        </div>

        {/* Site */}
        <div>
          <p className="text-xs text-slate-400">
            Site
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {booking.site}
          </p>
        </div>

        {/* Date */}
        <div>
          <p className="text-xs text-slate-400">
            Date
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {formattedDate}
          </p>
        </div>

        {/* Time */}
        <div>
          <p className="text-xs text-slate-400">
            Time
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {startTime} – {endTime}
          </p>
        </div>

        {/* Purpose */}
        <div>
          <p className="text-xs text-slate-400">
            Purpose
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {capitalizeFirst(booking.purpose)}
          </p>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs text-slate-400">
            Status
          </p>

          <span
            className={
              booking.status === "approved"
                ? "mt-1 inline-block rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                : booking.status === "rejected"
                ? "mt-1 inline-block rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                : "mt-1 inline-block rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
            }
          >
            {booking.status.toUpperCase()}
          </span>
        </div>

      </div>

      {/* Actions */}
      {booking.status === "pending" && (
        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">

          <button
            type="button"
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Reject
          </button>

          <button
            type="button"
            className="rounded-md bg-[#03045e] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Approve
          </button>

        </div>
      )}

    </div>
  );
}