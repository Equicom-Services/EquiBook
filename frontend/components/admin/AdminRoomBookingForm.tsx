"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import RoomRequestConfirmationModal from "../employee/room/RoomRequestConfirmationModal";
import {
  apiFetch,
  getErrorMessage,
  getThrownMessage,
} from "@/lib/api";
import EmployeeNameInput from "@/components/shared/EmployeeNameInput";

/*
 * The subset of a booking the edit form needs. Kept structural
 * so the admin list can pass its own row type.
 */
interface EditableRoomBooking {
  room_reservation_id: number;

  room_id: number;

  employee_name: string;
  employee_email: string;

  reservation_date: string;

  start_time: string;
  end_time: string;

  purpose: string;
}

interface AdminRoomBookingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingRequest?: EditableRoomBooking | null;
}

interface Admin {
  admin_id: number;
  name: string;
  email: string;
  site_id: number;
  site_name: string;
}

/*
 * Bookable window.
 *
 * Slots run from 6:00 AM to 10:00 PM. A reservation can end
 * at 10:00 PM, so that is the last selectable end time and
 * 9:30 PM is the last selectable start time.
 */
const OPENING_HOUR = 6;
const CLOSING_HOUR = 22;

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
  room_reservation_id: number;
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

/*
 * The API returns times as `HH:MM:SS`, the selects use `HH:MM`.
 */
const toTimeValue = (time: string) => time.slice(0, 5);

export default function AdminRoomBookingForm({
  onClose,
  onSuccess,
  editingRequest = null,
}: AdminRoomBookingFormProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /*
   * The same form both creates a booking and edits an existing
   * one. Editing always works on a single reservation.
   */
  const isEditing = editingRequest !== null;

  // =========================================================
  // ADMIN
  // =========================================================

  const [employeeName, setEmployeeName] = useState(
    editingRequest?.employee_name ?? ""
  );
  const [employeeEmail, setEmployeeEmail] = useState(
    editingRequest?.employee_email ?? ""
  );
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
  const [roomId, setRoomId] = useState(
    editingRequest
      ? String(editingRequest.room_id)
      : ""
  );

  const [purpose, setPurpose] = useState(
    editingRequest?.purpose ?? ""
  );

  const [bookingSchedules, setBookingSchedules] = useState<
    BookingSchedule[]
  >([
    editingRequest
      ? {
          id: editingRequest.room_reservation_id,
          date: editingRequest.reservation_date,
          start_time: toTimeValue(
            editingRequest.start_time
          ),
          end_time: toTimeValue(
            editingRequest.end_time
          ),
        }
      : {
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

  /*
   * A booking being edited can sit on an earlier date, and the
   * date input must still be able to show it.
   */
  const minDate =
    editingRequest &&
    editingRequest.reservation_date < today
      ? editingRequest.reservation_date
      : today;

  // =========================================================
  // CLOCK TICK
  //
  // Re-renders the form every minute so time slots that have
  // just passed drop out of the Start/End time lists without
  // requiring a page refresh.
  // =========================================================

  const [, setMinuteTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMinuteTick((tick) => tick + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
  if (!admin?.site_id) {
    return;
  }

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);

      // /api/rooms is admin protected, so it must be called
      // through apiFetch to attach the Bearer token.
      const roomsResponse = await apiFetch(
        `/api/rooms?site_id=${admin.site_id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!roomsResponse.ok) {
        throw new Error(
          await getErrorMessage(
            roomsResponse,
            "Unable to load rooms."
          )
        );
      }

      const roomsData: Room[] =
        await roomsResponse.json();

      setRooms(roomsData);
    } catch (error) {
      setRooms([]);

      setError(
        getThrownMessage(
          error,
          "Unable to load rooms."
        )
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

    // Existing bookings for this room/date.
    // A booking being edited never conflicts with itself.
    const roomBookings = existingBookings.filter(
      (booking) =>
        booking.room_reservation_id !==
          editingRequest?.room_reservation_id &&
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

    // Value currently selected for this field, so a slot that
    // lapses while the form is open is still rendered.
    const selectedValue =
      (field === "start_time"
        ? currentSchedule?.start_time
        : currentSchedule?.end_time) || "";

    for (let hour = OPENING_HOUR; hour <= CLOSING_HOUR; hour++) {
      for (const minute of [0, 30]) {
        // The window closes at 10:00 PM, so there is no 10:30 PM.
        if (hour === CLOSING_HOUR && minute > 0) {
          continue;
        }

        // A reservation cannot start at closing time.
        if (
          field === "start_time" &&
          hour === CLOSING_HOUR
        ) {
          continue;
        }

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
        // 1. Remove past times if date is today
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
            // Past slots are not bookable, so they are removed
            // from the list instead of shown as disabled.
            if (value !== selectedValue) {
              continue;
            }

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
        //    Earlier times are removed from the list.
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
            continue;
          }

          // -----------------------------------------------------
          // 4. The reservation cannot run past the next existing
          //    booking, otherwise the selected range would
          //    enclose it and the server rejects it as a conflict.
          // -----------------------------------------------------

          let nextBookingStart: number | null = null;

          for (const booking of roomBookings) {
            const [bookingHour, bookingMinute] =
              booking.start_time
                .slice(0, 5)
                .split(":")
                .map(Number);

            const bookingStart =
              bookingHour * 60 + bookingMinute;

            if (
              bookingStart >= startMinutes &&
              (nextBookingStart === null ||
                bookingStart < nextBookingStart)
            ) {
              nextBookingStart = bookingStart;
            }
          }

          if (
            nextBookingStart !== null &&
            selectedMinutes > nextBookingStart
          ) {
            continue;
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
      prev.map((schedule) => {
        if (schedule.id !== id) {
          return schedule;
        }

        const updated = {
          ...schedule,
          [field]: value,
        };

        // A start time that is at or after the chosen end time
        // makes that end time invalid, and it is no longer in
        // the end time list, so clear it.
        if (
          field === "start_time" &&
          updated.end_time &&
          value >= updated.end_time
        ) {
          updated.end_time = "";
        }

        return updated;
      })
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

    // -----------------------------------------------------
    // EDIT
    //
    // An edit updates the one booking in place, so it is a
    // single PUT instead of one POST per schedule.
    // -----------------------------------------------------

    if (editingRequest) {
      const schedule = bookingSchedules[0];

      const response = await apiFetch(
        `/api/room-requests/admin/room-bookings/${editingRequest.room_reservation_id}`,
        {
          method: "PUT",

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
      );

      if (!response.ok) {
        const errorMessage =
          "We could not update this booking. Please try again.";

        throw new Error(
          await getErrorMessage(
            response,
            errorMessage
          )
        );
      }

      setShowConfirmation(false);

      onSuccess();
      onClose();

      return;
    }

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
        const errorMessage =
          "We could not create this booking. Please try again.";

        throw new Error(
          await getErrorMessage(
            response,
            errorMessage
          )
        );
      }
    }

    // Success
    setShowConfirmation(false);

    onSuccess();
    onClose();

  } catch (error) {
    // Close the confirmation modal, otherwise it covers the
    // error message shown at the top of the form.
    setShowConfirmation(false);

    setError(
      getThrownMessage(
        error,
        isEditing
          ? "We could not update this booking. Please try again."
          : "We could not create this booking. Please try again."
      )
    );
  } finally {
    setLoading(false);
  }
};


  // =========================================================
  // UI
  // =========================================================

  return (
    <>
    {/*
      The form is hidden while the confirmation is open, so the
      two dialogs do not stack on top of each other.
    */}
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${
        showConfirmation ? "hidden" : ""
      }`}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditing
                ? "Edit Booking Request"
                : "Book a Room"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Saving these changes approves this request"
                : "Admin booking"}
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

    <EmployeeNameInput
      value={employeeName}
      onChange={setEmployeeName}
      onSelect={(employee) => {
        setEmployeeName(employee.name);
        setEmployeeEmail(employee.email);
      }}
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
                  : admin?.site_name || ""
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
                  {isEditing
                    ? "An edit applies to this reservation only."
                    : "Add multiple dates if you need recurring reservations."}
                </p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={addSchedule}
                  className="rounded-md border border-[#03045e] px-3 py-2 text-xs font-semibold text-[#03045e] transition hover:bg-[#03045e] hover:text-white"
                >
                  + Add Another Date
                </button>
              )}
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
                        min={minDate}
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
                ? isEditing
                  ? "Approving..."
                  : "Booking..."
                : isEditing
                ? "Save & Approve"
                : "Book Room"}
            </button>

          </div>

        </form>

      </div>

    </div>

    {/* Confirmation Modal */}

    <RoomRequestConfirmationModal
      isOpen={showConfirmation}
      employeeName={employeeName}
      employeeEmail={employeeEmail}
      roomId={roomId}
      purpose={purpose}
      siteName={admin?.site_name}
      rooms={rooms}
      bookingSchedules={bookingSchedules}
      onEdit={() => setShowConfirmation(false)}
      onConfirm={confirmSubmit}
      submitting={loading}
      {...(isEditing
        ? {
            title: "Confirm & Approve Booking",

            description:
              "Saving these changes approves this request.",

            notice:
              "This booking will be marked as APPROVED. The requester is emailed the approved details, and any pending request that overlaps this room and time is automatically rejected.",

            confirmLabel: "Confirm & Approve",

            submittingLabel: "Approving...",
          }
        : {})}
    />
    </>
  );
}