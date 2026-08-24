"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import RoomRequestConfirmationModal from "../employee/room/RoomRequestConfirmationModal";

interface RoomRequest {
  room_reservation_id: number;

  request_date_time: string;

  room_id: number;
  room: string;

  employee_name: string;
  employee_email: string;

  reservation_date: string;

  start_time: string;
  end_time: string;

  duration_minutes: number;

  purpose: string;

  status:
    | "pending"
    | "approved"
    | "rejected";

  admin_remarks: string | null;

  approved_rejected_date_time: string | null;

  site: string;
}
interface AdminRoomBookingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingRequest?: RoomRequest | null;
}

interface Admin {
  id: number;
  name: string;
  email: string;
  site: string;
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

interface ExistingBooking {
  room_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

type TimeOption = {
  value: string;
  label: string;
  disabled: boolean;
};

export default function AdminRoomBookingForm({
  onClose,
  onSuccess,
}: AdminRoomBookingFormProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // =========================================================
  // ADMIN
  // =========================================================

  const [employeeName, setEmployeeName] = useState("")
  const [employeeEmail, setEmployeeEmail] = useState("")
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // =========================================================
  // ROOMS
  // =========================================================

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // =========================================================
  // FORM
  // =========================================================


const [showConfirmation, setShowConfirmation] =
  useState(false);
  const [roomId, setRoomId] = useState("");
  const [purpose, setPurpose] = useState("");

  const [bookingSchedules, setBookingSchedules] = useState<
    BookingSchedule[]
  >([
    {
      id: Date.now(),
      date: "",
      start_time: "",
      end_time: "",
    },
  ]);

  // =========================================================
  // EXISTING BOOKINGS
  // =========================================================

  const [existingBookings, setExistingBookings] = useState<
    ExistingBooking[]
  >([]);

  const [loadingBookings, setLoadingBookings] = useState(true);

  // =========================================================
  // SUBMIT
  // =========================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // =========================================================
  // GET CURRENT ADMIN
  // =========================================================

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        setLoadingAdmin(true);

        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${API_URL}/api/admin/me`,
          {
            headers: {
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch admin information.");
        }

        const data: Admin = await response.json();

        setAdmin(data);
      } catch (error) {
        console.error("Error fetching admin:", error);

        setError(
          "Failed to load your admin information."
        );
      } finally {
        setLoadingAdmin(false);
      }
    };

    fetchAdmin();
  }, [API_URL]);

  // =========================================================
  // GET ROOMS
  //
  // The backend already supports:
  //
  // /api/rooms?site_id=...
  //
  // We need the admin's site_id, but Admin currently returns
  // site NAME.
  //
  // Therefore we first fetch all sites and find the matching
  // site by name.
  // =========================================================

  useEffect(() => {
    if (!admin?.site) {
      return;
    }

    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);

        // Get sites
        const sitesResponse = await fetch(
          `${API_URL}/api/sites`
        );

        if (!sitesResponse.ok) {
          throw new Error("Failed to fetch sites.");
        }

        const sites = await sitesResponse.json();

        const adminSite = sites.find(
          (site: {
            site_id: number;
            site_name: string;
          }) =>
            site.site_name === admin.site
        );

        if (!adminSite) {
          throw new Error(
            `Your assigned site "${admin.site}" was not found.`
          );
        }

        // Get rooms belonging to admin's site
        const roomsResponse = await fetch(
          `${API_URL}/api/rooms?site_id=${adminSite.site_id}`
        );

        if (!roomsResponse.ok) {
          throw new Error("Failed to fetch rooms.");
        }

        const roomsData: Room[] =
          await roomsResponse.json();

        setRooms(roomsData);
      } catch (error) {
        console.error(
          "Error fetching admin rooms:",
          error
        );

        setRooms([]);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load rooms."
        );
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [admin, API_URL]);

  // =========================================================
  // GET ACTIVE BOOKINGS
  //
  // We use /active because it returns both:
  //
  // APPROVED
  // PENDING
  //
  // This prevents the admin from booking on top of an existing
  // employee request.
  // =========================================================

  useEffect(() => {
    const fetchExistingBookings = async () => {
      try {
        setLoadingBookings(true);

        const response = await fetch(
          `${API_URL}/api/room-requests/active`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch existing bookings."
          );
        }

        const data: ExistingBooking[] =
          await response.json();

        setExistingBookings(data);
      } catch (error) {
        console.error(
          "Error fetching existing bookings:",
          error
        );

        setExistingBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchExistingBookings();
  }, [API_URL]);

  // =========================================================
  // TIME OPTIONS
  // =========================================================

  const getTimeOptions = (
    selectedDate: string,
    selectedRoomId: string,
    scheduleId: number,
    field: "start_time" | "end_time"
  ): TimeOption[] => {
    const options: TimeOption[] = [];

    const now = new Date();

    const todayString = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    // Existing bookings for this room/date
    const roomBookings = existingBookings.filter(
      (booking) =>
        String(booking.room_id) ===
          selectedRoomId &&
        booking.reservation_date === selectedDate &&
        ["APPROVED", "PENDING"].includes(
          booking.status.toUpperCase()
        )
    );

    // Current schedule
    const currentSchedule =
      bookingSchedules.find(
        (schedule) => schedule.id === scheduleId
      );

    const selectedStartTime =
      currentSchedule?.start_time || "";

    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const value = `${String(hour).padStart(
          2,
          "0"
        )}:${String(minute).padStart(2, "0")}`;

        const hour12 =
          hour === 0
            ? 12
            : hour > 12
            ? hour - 12
            : hour;

        const period = hour < 12 ? "AM" : "PM";

        const label = `${hour12}:${String(
          minute
        ).padStart(2, "0")} ${period}`;

        let disabled = false;

        // -----------------------------------------------------
        // 1. Disable past times if date is today
        // -----------------------------------------------------

        if (selectedDate === todayString) {
          const selectedTime = new Date();

          selectedTime.setHours(
            hour,
            minute,
            0,
            0
          );

          if (selectedTime <= now) {
            disabled = true;
          }
        }

        const selectedMinutes =
          hour * 60 + minute;

        // -----------------------------------------------------
        // 2. Disable times occupied by existing bookings
        // -----------------------------------------------------

        for (const booking of roomBookings) {
          const [startHour, startMinute] =
            booking.start_time
              .slice(0, 5)
              .split(":")
              .map(Number);

          const [endHour, endMinute] =
            booking.end_time
              .slice(0, 5)
              .split(":")
              .map(Number);

          const bookingStart =
            startHour * 60 + startMinute;

          const bookingEnd =
            endHour * 60 + endMinute;

          if (field === "start_time") {
            if (
              selectedMinutes >= bookingStart &&
              selectedMinutes < bookingEnd
            ) {
              disabled = true;
            }
          }

          if (field === "end_time") {
            if (
              selectedMinutes > bookingStart &&
              selectedMinutes < bookingEnd
            ) {
              disabled = true;
            }
          }
        }

        // -----------------------------------------------------
        // 3. End time must be after start time
        // -----------------------------------------------------

        if (
          field === "end_time" &&
          selectedStartTime
        ) {
          const [startHour, startMinute] =
            selectedStartTime
              .split(":")
              .map(Number);

          const startMinutes =
            startHour * 60 + startMinute;

          if (selectedMinutes <= startMinutes) {
            disabled = true;
          }
        }

        options.push({
          value,
          label,
          disabled,
        });
      }
    }

    return options;
  };

  // =========================================================
  // SCHEDULE CHANGE
  // =========================================================

  const handleScheduleChange = (
    id: number,
    field:
      | "date"
      | "start_time"
      | "end_time",
    value: string
  ) => {
    setBookingSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === id
          ? {
              ...schedule,
              [field]: value,
            }
          : schedule
      )
    );
  };

  // =========================================================
  // ADD DATE
  // =========================================================

  const addSchedule = () => {
    setBookingSchedules((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        date: "",
        start_time: "",
        end_time: "",
      },
    ]);
  };

  // =========================================================
  // REMOVE DATE
  // =========================================================

  const removeSchedule = (id: number) => {
    setBookingSchedules((prev) =>
      prev.filter(
        (schedule) => schedule.id !== id
      )
    );
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!admin) {
      setError(
        "Admin information is not available."
      );
      return;
    }

    if (!roomId) {
      setError("Please select a room.");
      return;
    }
    if (!employeeName.trim()) {
  setError("Please enter the requester's name.");
  return;
}

if (!employeeEmail.trim()) {
  setError("Please enter the requester's company email.");
  return;
}

    if (!purpose.trim()) {
      setError("Please enter a purpose.");
      return;
    }

    if (bookingSchedules.length === 0) {
      setError(
        "Please add at least one reservation date."
      );
      return;
    }

    // Validate every schedule
    for (const schedule of bookingSchedules) {
      if (
        !schedule.date ||
        !schedule.start_time ||
        !schedule.end_time
      ) {
        setError(
          "Please complete the date, start time, and end time for every reservation."
        );
        return;
      }

      if (
        schedule.start_time >=
        schedule.end_time
      ) {
        setError(
          `End time must be later than start time for ${schedule.date}.`
        );
        return;
      }
    }

    // -------------------------------------------------------
    // Check overlapping schedules inside this form
    // -------------------------------------------------------

    for (
      let i = 0;
      i < bookingSchedules.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < bookingSchedules.length;
        j++
      ) {
        const first = bookingSchedules[i];
        const second = bookingSchedules[j];

        if (
          first.date === second.date &&
          first.start_time <
            second.end_time &&
          first.end_time >
            second.start_time
        ) {
          setError(
            `Reservation ${i + 1} and Reservation ${
              j + 1
            } overlap on ${first.date}.`
          );
          return;
        }
      }
    }



    // -------------------------------------------------------
    // Everythng is valid
    //Show confirmation modal
    // -------------------------------------------------------

    setShowConfirmation(true)
};

// PUT confirmSubmit HERE
const confirmSubmit = async () => {
  try {
    setLoading(true);
    setError("");

    const token =
      localStorage.getItem("access_token");

    const responses = await Promise.all(
      bookingSchedules.map((schedule) =>
        fetch(
          `${API_URL}/api/room-requests/admin/room-bookings`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },

            credentials: "include",

            body: JSON.stringify({
              room_id: Number(roomId),

              employee_name:
                employeeName.trim(),

              employee_email:
                employeeEmail.trim(),

              reservation_date:
                schedule.date,

              start_time:
                schedule.start_time,

              end_time:
                schedule.end_time,

              purpose:
                purpose.trim(),
            }),
          }
        )
      )
    );

    for (const response of responses) {
      if (!response.ok) {
        let errorMessage =
          "Failed to create room booking.";

        try {
          const data = await response.json();

          if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((item: any) => item.msg)
              .join(", ");
          }
        } catch {
          // Keep default error
        }

        throw new Error(errorMessage);
      }
    }

    // Success
    setShowConfirmation(false);

    onSuccess();
    onClose();

  } catch (error) {
    console.error(
      "Admin room booking error:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Failed to create room booking."
    );
  } finally {
    setLoading(false);
  }
};


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Book a Room
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Admin booking
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 px-6 py-6"
        >

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* =================================================
              ADMIN INFORMATION
          ================================================= */}

         
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  {/* Requester Name */}
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Name
    </label>

    <input
      type="text"
      value={employeeName}
      onChange={(e) => setEmployeeName(e.target.value)}
      placeholder="Enter requester's name"
      required
      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>

  {/* Requester Email */}
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Company Email
    </label>

    <input
      type="email"
      value={employeeEmail}
      onChange={(e) => setEmployeeEmail(e.target.value)}
      placeholder="name@company.com"
      required
      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>
</div>

          {/* =================================================
              SITE
          ================================================= */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Site
            </label>

            <input
              type="text"
              value={
                loadingAdmin
                  ? "Loading..."
                  : admin?.site || ""
              }
              readOnly
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
            />

            <p className="mt-1 text-xs text-slate-400">
              You can only book rooms within your
              assigned site.
            </p>
          </div>

          {/* =================================================
              ROOM
          ================================================= */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Room
            </label>

            <select
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);

                setBookingSchedules((prev) =>
                  prev.map((schedule) => ({
                    ...schedule,
                    start_time: "",
                    end_time: "",
                  }))
                );
              }}
              required
              disabled={
                loadingRooms ||
                loadingAdmin
              }
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e] disabled:bg-slate-100"
            >
              <option value="">
                {loadingRooms
                  ? "Loading rooms..."
                  : "Select room"}
              </option>

              {rooms.map((room) => (
                <option
                  key={room.room_id}
                  value={room.room_id}
                >
                  {room.room_code} —{" "}
                  {room.room_name}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              RESERVATION SCHEDULES
          ================================================= */}

          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Reservation Schedule
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Add multiple dates if you need
                  recurring reservations.
                </p>
              </div>

              <button
                type="button"
                onClick={addSchedule}
                className="rounded-md border border-[#03045e] px-3 py-2 text-xs font-semibold text-[#03045e] transition hover:bg-[#03045e] hover:text-white"
              >
                + Add Another Date
              </button>
            </div>

            {bookingSchedules.map(
              (schedule, index) => (
                <div
                  key={schedule.id}
                  className="rounded-md border border-slate-200 p-4"
                >

                  <div className="mb-3 flex items-center justify-between">

                    <p className="text-sm font-semibold text-slate-700">
                      Reservation{" "}
                      {index + 1}
                    </p>

                    {bookingSchedules.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeSchedule(
                            schedule.id
                          )
                        }
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}

                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* Date */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Date
                      </label>

                      <input
                        type="date"
                        value={
                          schedule.date
                        }
                        min={today}
                        onChange={(e) =>
                          handleScheduleChange(
                            schedule.id,
                            "date",
                            e.target.value
                          )
                        }
                        required
                        className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
                      />
                    </div>

                    {/* Start */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Start Time
                      </label>

                      <select
                        value={
                          schedule.start_time
                        }
                        onChange={(e) =>
                          handleScheduleChange(
                            schedule.id,
                            "start_time",
                            e.target.value
                          )
                        }
                        required
                        disabled={
                          !schedule.date ||
                          !roomId ||
                          loadingBookings
                        }
                        className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] disabled:bg-slate-100"
                      >
                        <option value="">
                          Select start time
                        </option>

                        {getTimeOptions(
                          schedule.date,
                          roomId,
                          schedule.id,
                          "start_time"
                        ).map(
                          (
                            time
                          ) => (
                            <option
                              key={
                                time.value
                              }
                              value={
                                time.value
                              }
                              disabled={
                                time.disabled
                              }
                            >
                              {
                                time.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* End */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        End Time
                      </label>

                      <select
                        value={
                          schedule.end_time
                        }
                        onChange={(e) =>
                          handleScheduleChange(
                            schedule.id,
                            "end_time",
                            e.target.value
                          )
                        }
                        required
                        disabled={
                          !schedule.date ||
                          !roomId ||
                          loadingBookings
                        }
                        className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] disabled:bg-slate-100"
                      >
                        <option value="">
                          Select end time
                        </option>

                        {getTimeOptions(
                          schedule.date,
                          roomId,
                          schedule.id,
                          "end_time"
                        ).map(
                          (
                            time
                          ) => (
                            <option
                              key={
                                time.value
                              }
                              value={
                                time.value
                              }
                              disabled={
                                time.disabled
                              }
                            >
                              {
                                time.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                  </div>
                </div>
              )
            )}
          </div>

          {/* =================================================
              PURPOSE
          ================================================= */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Purpose
            </label>

            <textarea
              value={purpose}
              onChange={(e) =>
                setPurpose(e.target.value)
              }
              rows={3}
              placeholder="Enter the purpose of the room reservation"
              required
              className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />
          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingAdmin ||
                loadingRooms
              }
              className="rounded-lg bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Booking..."
                : "Book Room"}
            </button>

          </div>

        </form>
         {/* Confirmation Modal — OUTSIDE the form */}
    <RoomRequestConfirmationModal
      isOpen={showConfirmation}
      employeeName={employeeName}
      employeeEmail={employeeEmail}
      roomId={roomId}
      purpose={purpose}
      rooms={rooms}
      bookingSchedules={bookingSchedules}
      onEdit={() => setShowConfirmation(false)}
      onConfirm={confirmSubmit}
      submitting={loading}
    />
        
      </div>

    </div>
  );
}