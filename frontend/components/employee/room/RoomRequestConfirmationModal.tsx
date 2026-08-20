"use client";

interface Site {
  site_id: number;
  site_name: string;
}

interface Room {
  room_id: number;
  room_code: string;
  room_name: string;
  capacity: number | null;
  location: string | null;
  is_active: boolean;
  site_id: number;
}

interface BookingSchedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
}

interface FormData {
  name: string;
  company_email: string;
  site: string;
  room: string;
  purpose: string;
  site_id: string;
  room_id: string;
}

interface RoomRequestConfirmationModalProps {
  isOpen: boolean;
  formData: FormData;
  sites: Site[];
  rooms: Room[];
  bookingSchedules: BookingSchedule[];
  onEdit: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export default function RoomRequestConfirmationModal({
  isOpen,
  formData,
  sites,
  rooms,
  bookingSchedules,
  onEdit,
  onConfirm,
  submitting = false,
}: RoomRequestConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  const selectedSite = sites.find(
    (site) => String(site.site_id) === formData.site_id
  );

  const selectedRoom = rooms.find(
    (room) => String(room.room_id) === formData.room_id
  );

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    if (!time) return "-";

    const [hours, minutes] = time.split(":");
    const hour = Number(hours);

    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    const period = hour >= 12 ? "PM" : "AM";

    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-800">
            Confirm Room Reservation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please review the details below before submitting your request.
          </p>
        </div>

        {/* Receipt */}
        <div className="space-y-6 px-6 py-6">
          {/* Employee Information */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Employee Information
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="p-4">
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.name}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Company Email
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {formData.company_email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Room Information */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Room Information
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Site
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedSite?.site_name || "-"}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Room
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedRoom
                      ? `${selectedRoom.room_code} — ${selectedRoom.room_name}`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Schedule */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Reservation Schedule
            </h3>

            <div className="space-y-3">
              {bookingSchedules.map((schedule, index) => (
                <div
                  key={schedule.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Reservation {index + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(schedule.date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Start Time
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatTime(schedule.start_time)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        End Time
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatTime(schedule.end_time)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Purpose
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {formData.purpose}
              </p>
            </div>
          </div>

          {/* Warning */}
<div className="rounded-lg bg-[#03045e] p-4">
  <p className="text-sm font-medium text-white">
    Please make sure all information is correct before
    submitting your reservation request.
  </p>
</div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onEdit}
            disabled={submitting}
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-md bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Confirm & Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}