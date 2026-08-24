interface RideBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  pickup_location: string;
  dropoff_destination: string;
  employee: string;
  purpose: string;
  passengers_count: number;
  roundtrip: boolean;
  status: "approved" | "pending";
}

interface RideRequestCardProps {
  booking: RideBooking;
}

export default function RideRequestCard({
  booking,
}: RideRequestCardProps) {
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
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">

        {/* Title */}
        <div>
          <p className="text-xs text-slate-400">
            Request
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
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
        </div>

        {/* Pickup */}
        <div>
          <p className="text-xs text-slate-400">
            Pickup
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {booking.pickup_location}
          </p>
        </div>

        {/* Destination */}
        <div>
          <p className="text-xs text-slate-400">
            Destination
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {booking.dropoff_destination}
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

        {/* Passengers */}
        <div>
          <p className="text-xs text-slate-400">
            Passengers
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {booking.passengers_count}
          </p>
        </div>

        {/* Trip Type */}
        <div>
          <p className="text-xs text-slate-400">
            Trip Type
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {booking.roundtrip
              ? "Round Trip"
              : "One Way"}
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
                : "mt-1 inline-block rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
            }
          >
            {booking.status.toUpperCase()}
          </span>
        </div>

        {/* Purpose */}
        <div className="col-span-2">
          <p className="text-xs text-slate-400">
            Purpose
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {booking.purpose}
          </p>
        </div>

        {/* Actions */}
        {booking.status === "pending" && (
          <div className="col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3">

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
    </div>
  );
}