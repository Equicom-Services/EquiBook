interface ReservationStatusFilterProps {
  activeStatus: "all" | "pending" | "approved" | "rejected";
  onChange: (
    status: "all" | "pending" | "approved" | "rejected"
  ) => void;
}

export default function ReservationStatusFilter({
  activeStatus,
  onChange,
}: ReservationStatusFilterProps) {
  const statuses = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ] as const;

  return (
    <div className="flex rounded-md bg-slate-100 p-1">
      {statuses.map((status) => (
        <button
          key={status.value}
          type="button"
          onClick={() => onChange(status.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            activeStatus === status.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}