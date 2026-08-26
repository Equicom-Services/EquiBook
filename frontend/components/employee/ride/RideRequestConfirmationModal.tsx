"use client";

interface RideFormData {
  name: string;
  company_email: string;
  site: string;
  travel_date: string;
  departure_time: string;
  roundtrip: boolean;
  return_pickup: string;
  pickup_location: string;
  pickup_maps_link: string;
  dropoff_destination: string;
  drop_off_maps_link: string;
  return_drop_off_location: string;
  return_drop_off_maps_link: string;
  purpose: string;
  passenger_count: number;
}

interface RideRequestConfirmationModalProps {
  isOpen: boolean;
  formData: RideFormData;
  onEdit: () => void;
  onConfirm: () => void | Promise<void>;
  submitting?: boolean;
}

export default function RideRequestConfirmationModal({
  isOpen,
  formData,
  onEdit,
  onConfirm,
  submitting = false,
}: RideRequestConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    if (!time) {
      return "-";
    }

    const [hours, minutes] = time.split(":");
    const hour = Number(hours);

    const hour12 =
      hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    const period = hour >= 12 ? "PM" : "AM";

    return `${hour12}:${minutes} ${period}`;
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) {
      return "-";
    }

    const [date, time] = dateTime.split("T");

    if (!date || !time) {
      return dateTime;
    }

    return `${formatDate(date)} at ${formatTime(time)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-800">
            Confirm Ride Reservation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please review the details below before submitting
            your reservation.
          </p>
        </div>

        {/* CONTENT */}
        <div className="space-y-6 px-6 py-6">
          {/* REQUESTER INFORMATION */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Requester Information
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                {/* Name */}
                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Name
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.name || "-"}
                  </p>
                </div>

                {/* Email */}
                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Company Email
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {formData.company_email || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIDE INFORMATION */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ride Information
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                {/* Site */}
                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Site
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.site || "-"}
                  </p>
                </div>

                {/* Passenger Count */}
                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Passenger Count
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.passenger_count || "-"}
                  </p>
                </div>

                {/* Round Trip */}
                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Trip Type
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.roundtrip
                      ? "Round Trip"
                      : "One Way"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TRAVEL SCHEDULE */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Travel Schedule
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {/* Travel Date */}
                <div>
                  <p className="text-xs text-slate-400">
                    Travel Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(formData.travel_date)}
                  </p>
                </div>

                {/* Departure Time */}
                <div>
                  <p className="text-xs text-slate-400">
                    Departure Time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatTime(formData.departure_time)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PICKUP */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Pickup Location
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="p-4">
                <p className="text-xs text-slate-400">
                  Pickup Location
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formData.pickup_location || "-"}
                </p>

                {formData.pickup_maps_link && (
                  <a
                    href={formData.pickup_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-[#03045e] hover:underline"
                  >
                    View Google Maps Location
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* DESTINATION */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Drop-off Destination
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="p-4">
                <p className="text-xs text-slate-400">
                  Drop-off Destination
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formData.dropoff_destination || "-"}
                </p>

                {formData.drop_off_maps_link && (
                  <a
                    href={formData.drop_off_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-[#03045e] hover:underline"
                  >
                    View Google Maps Location
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* RETURN TRIP */}
          {formData.roundtrip && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Return Trip
              </h3>

              <div className="space-y-3">
                {/* Return Pickup */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Return Pickup
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDateTime(formData.return_pickup)}
                  </p>
                </div>

                {/* Return Drop-off */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Return Drop-off Location
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.return_drop_off_location || "-"}
                  </p>

                  {formData.return_drop_off_maps_link && (
                    <a
                      href={formData.return_drop_off_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-[#03045e] hover:underline"
                    >
                      View Google Maps Location
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PURPOSE */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Purpose
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {formData.purpose || "-"}
              </p>
            </div>
          </div>

          {/* WARNING */}
          <div className="rounded-lg bg-[#03045e] p-4">
            <p className="text-sm font-medium text-white">
              Please make sure all information is correct
              before submitting your reservation.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          {/* Edit */}
          <button
            type="button"
            onClick={onEdit}
            disabled={submitting}
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit
          </button>

          {/* Confirm */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-md bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : "Confirm & Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}