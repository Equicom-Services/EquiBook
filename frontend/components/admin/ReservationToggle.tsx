interface ReservationToggleProps {
  activeType: "room" | "ride";
  onChange: (type: "room" | "ride") => void;
}

export default function ReservationToggle({
  activeType,
  onChange,
}: ReservationToggleProps) {
  return (
    <div className="flex w-fit rounded-md bg-slate-100 p-1">
      {/* Room Reservations */}
      <button
        type="button"
        onClick={() => onChange("room")}
        className={`rounded-md px-5 py-2 text-sm font-medium transition ${
          activeType === "room"
            ? "bg-[#03045e] text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Room Requests
      </button>

      {/* Ride Reservations */}
      <button
        type="button"
        onClick={() => onChange("ride")}
        className={`rounded-md px-5 py-2 text-sm font-medium transition ${
          activeType === "ride"
            ? "bg-[#03045e] text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Ride Requests
      </button>
    </div>
  );
}