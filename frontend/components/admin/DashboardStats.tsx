interface DashboardStatsProps {
  reservationType: "room" | "ride";
}

export default function DashboardStats({
  reservationType,
}: DashboardStatsProps) {
  // Temporary data
  // This will eventually come from your backend API.
  const stats = {
    total: 24,
    approved: 18,
    rejected: 3,
    pending: 3,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

      {/* Total Bookings */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Total Bookings
        </p>

        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {stats.total}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {reservationType === "room"
            ? "Room bookings"
            : "Ride bookings"}
        </p>
      </div>

      {/* Approved */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Approved
        </p>

        <p className="mt-2 text-2xl font-semibold text-green-600">
          {stats.approved}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Approved requests
        </p>
      </div>

      {/* Rejected */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Rejected
        </p>

        <p className="mt-2 text-2xl font-semibold text-red-600">
          {stats.rejected}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Rejected requests
        </p>
      </div>

      {/* Pending */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Pending
        </p>

        <p className="mt-2 text-2xl font-semibold text-yellow-600">
          {stats.pending}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Waiting for review
        </p>
      </div>

    </div>
  );
}