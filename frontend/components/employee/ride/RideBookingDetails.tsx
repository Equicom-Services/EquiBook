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

interface RideBookingDetailsProps {
  selectedDate: string;
  bookings: RideBooking[];
}

export default function RideBookingDetails({
  selectedDate,
  bookings,
}: RideBookingDetailsProps) {
  const formattedDate = new Date(
    `${selectedDate}T00:00:00`
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Rides for {formattedDate}
      </h2>

      {bookings.length === 0 ? (
        <div className="mt-5 flex min-h-[250px] items-center justify-center rounded-md bg-slate-50">
          <p className="text-sm text-slate-500">
            No ride bookings for this date.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {bookings.map((booking) => {
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
              <div
                key={booking.id}
                className="rounded-md border border-slate-200 p-4"
              >
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {/* Booking / Title */}
                  <div>
                    <p className="text-xs text-slate-400">Booking</p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {booking.title}
                    </h3>
                  </div>

                  {/* Route */}
                  <div>
                    <p className="text-xs text-slate-400">Route</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {booking.pickup_location} → {booking.dropoff_destination}
                    </p>
                    {booking.roundtrip && (
                      <span className="mt-1 inline-block text-xs font-semibold text-[#03045e]">
                        (Roundtrip)
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <div>
                    <p className="text-xs text-slate-400">Time</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {startTime} – {endTime}
                    </p>
                  </div>

                  {/* Requested By */}
                  <div>
                    <p className="text-xs text-slate-400">Requested by</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.employee}
                    </p>
                  </div>

                  {/* Passengers */}
                  <div>
                    <p className="text-xs text-slate-400">Passengers</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.passengers_count}{" "}
                      {booking.passengers_count === 1
                        ? "passenger"
                        : "passengers"}
                    </p>
                  </div>

                  {/* Purpose */}
                  <div>
                    <p className="text-xs text-slate-400">Purpose</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.purpose}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-end justify-end">
                    <span
                      className={
                        booking.status === "approved"
                          ? "rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                          : "rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
                      }
                    >
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}