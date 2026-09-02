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

  // Employee form
  formData?: FormData;
  sites?: Site[];

  // Admin form
  employeeName?: string;
  employeeEmail?: string;
  roomId?: string;
  purpose?: string;

  /*
   * The admin form books for its own site, so the site name is
   * passed directly instead of being looked up in `sites`.
   */
  siteName?: string;

  // Shared
  rooms: Room[];
  bookingSchedules: BookingSchedule[];

  onEdit: () => void;
  onConfirm: () => void | Promise<void>;
  submitting?: boolean;
}

export default function RoomRequestConfirmationModal({
  isOpen,

  formData,
  sites = [],

  employeeName,
  employeeEmail,
  roomId,
  purpose,
  siteName,

  rooms,
  bookingSchedules,

  onEdit,
  onConfirm,
  submitting = false,
}: RoomRequestConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  // ============================================================
  // Support BOTH employee and admin forms
  // ============================================================

  const displayName =
    formData?.name ??
    employeeName ??
    "";

  const displayEmail =
    formData?.company_email ??
    employeeEmail ??
    "";

  const displayPurpose =
    formData?.purpose ??
    purpose ??
    "";

  const selectedRoomId =
    formData?.room_id ??
    roomId ??
    "";

  const selectedSiteId =
    formData?.site_id ??
    "";

  const selectedSite = sites.find(
    (site) =>
      String(site.site_id) === selectedSiteId
  );

  const selectedRoom = rooms.find(
    (room) =>
      String(room.room_id) === selectedRoomId
  );

  // ============================================================
  // Format helpers
  // ============================================================

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const formatTime = (time: string) => {
    if (!time) {
      return "-";
    }

    const [hours, minutes] =
      time.split(":");

    const hour = Number(hours);

    const hour12 =
      hour === 0
        ? 12
        : hour > 12
        ? hour - 12
        : hour;

    const period =
      hour >= 12
        ? "PM"
        : "AM";

    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white shadow-2xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-800">
            Confirm Room Reservation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please review the details below before submitting
            your reservation.
          </p>
        </div>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div className="space-y-6 px-6 py-6">

          {/* ====================================================
              REQUESTER INFORMATION
          ==================================================== */}

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
                    {displayName || "-"}
                  </p>
                </div>

                {/* Email */}

                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Company Email
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {displayEmail || "-"}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ====================================================
              ROOM INFORMATION
          ==================================================== */}

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Room Information
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50">

              <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">

                {/* Site */}

                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Site
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedSite?.site_name ||
                      formData?.site ||
                      siteName ||
                      "-"}
                  </p>
                </div>

                {/* Room */}

                <div className="p-4">
                  <p className="text-xs text-slate-400">
                    Room
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedRoom
                      ? `${selectedRoom.room_code} — ${selectedRoom.room_name}`
                      : formData?.room || "-"}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ====================================================
              RESERVATION SCHEDULE
          ==================================================== */}

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Reservation Schedule
            </h3>

            <div className="space-y-3">

              {bookingSchedules.map(
                (schedule, index) => (
                  <div
                    key={schedule.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >

                    <div className="mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Reservation {index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                      {/* Date */}

                      <div>
                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(
                            schedule.date
                          )}
                        </p>
                      </div>

                      {/* Start */}

                      <div>
                        <p className="text-xs text-slate-400">
                          Start Time
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatTime(
                            schedule.start_time
                          )}
                        </p>
                      </div>

                      {/* End */}

                      <div>
                        <p className="text-xs text-slate-400">
                          End Time
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatTime(
                            schedule.end_time
                          )}
                        </p>
                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          </div>

          {/* ====================================================
              PURPOSE
          ==================================================== */}

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Purpose
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {displayPurpose || "-"}
              </p>
            </div>
          </div>

          {/* ====================================================
              WARNING
          ==================================================== */}

          <div className="rounded-lg bg-[#03045e] p-4">
            <p className="text-sm font-medium text-white">
              Please make sure all information is correct
              before submitting your reservation.
            </p>
          </div>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

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