"use client";

import { useCallback, useEffect, useState } from "react";
import RoomRequestConfirmationModal from "./RoomRequestConfirmationModal";
import MessageDialog, {
  DialogMessage,
  MessageVariant,
} from "@/components/shared/MessageDialog";
import { interactionSettingsStore } from "@fullcalendar/core/internal";
import EmployeeNameInput from "@/components/shared/EmployeeNameInput";
import {
  getErrorMessage,
  getThrownMessage,
} from "@/lib/api";

interface RoomRequestFormProps {
  selectedDate: string;

  /*
   * Called after every request in a submission has been
   * created, so the parent page can refresh its bookings.
   */
  onSuccess?: () => void | Promise<void>;
}

interface Site{
  site_id: number;
  site_name: string
}

interface Room{
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

/*
 * Bookable window.
 *
 * Slots run from 6:00 AM to 10:00 PM. A reservation can end
 * at 10:00 PM, so that is the last selectable end time and
 * 9:30 PM is the last selectable start time.
 */
const OPENING_HOUR = 6;
const CLOSING_HOUR = 22;

interface ApprovedBooking {
  room_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
}
export default function RoomRequestForm({
  selectedDate,
  onSuccess,
}: RoomRequestFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    company_email: "",
    site: "",
    room: "",
    purpose: "",
    site_id: "",
    room_id: ""
  });


type TimeOption = {
  value: string;
  label: string;
  disabled: boolean;
};

const getTimeOptions = (
  selectedDate: string,
  roomId: string,
  scheduleId: number,
  field: "start_time" | "end_time"
): TimeOption[] => {
  const options: TimeOption[] = [];

  const now = new Date();

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Get approved bookings for this specific room and date
  const roomBookings = approvedBookings.filter(
    (booking) =>
      String(booking.room_id) === roomId &&
      booking.reservation_date === selectedDate &&
      booking.status === "APPROVED"
  );

  // Get the current schedule
  const currentSchedule = bookingSchedules.find(
    (schedule) => schedule.id === scheduleId
  );

  const selectedStartTime = currentSchedule?.start_time || "";

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

      const value = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

      const period = hour < 12 ? "AM" : "PM";

      const label = `${hour12}:${String(minute).padStart(
        2,
        "0"
      )} ${period}`;

      let disabled = false;

      /*
       * 1. Remove times that have already passed
       *    if the selected date is today.
       */
      if (selectedDate === todayString) {
        const selectedTime = new Date();

        selectedTime.setHours(hour, minute, 0, 0);

        if (selectedTime <= now) {
          // Past slots are not bookable, so they are removed
          // from the list instead of shown as disabled.
          if (value !== selectedValue) {
            continue;
          }

          disabled = true;
        }
      }

      /*
       * 2. Disable times that are inside an approved booking.
       */
      const selectedMinutes = hour * 60 + minute;

      for (const booking of roomBookings) {
        const [startHour, startMinute] = booking.start_time
          .slice(0, 5)
          .split(":")
          .map(Number);

        const [endHour, endMinute] = booking.end_time
          .slice(0, 5)
          .split(":")
          .map(Number);

        const bookingStartMinutes =
          startHour * 60 + startMinute;

        const bookingEndMinutes =
          endHour * 60 + endMinute;

        /*
         * Start time:
         * Disable times from booking start up to,
         * but not including, booking end.
         */
        if (field === "start_time") {
          if (
            selectedMinutes >= bookingStartMinutes &&
            selectedMinutes < bookingEndMinutes
          ) {
            disabled = true;
          }
        }

        /*
         * End time:
         * Disable times that are inside an existing booking.
         */
        if (field === "end_time") {
          if (
            selectedMinutes > bookingStartMinutes &&
            selectedMinutes < bookingEndMinutes
          ) {
            disabled = true;
          }
        }
      }

      /*
       * 3. End time must be later than selected start time.
       *    Earlier times are removed from the list.
       */
      if (field === "end_time" && selectedStartTime) {
        const [startHour, startMinute] = selectedStartTime
          .split(":")
          .map(Number);

        const startMinutes = startHour * 60 + startMinute;

        if (selectedMinutes <= startMinutes) {
          continue;
        }

        /*
         * 4. The reservation cannot run past the next existing
         *    booking, otherwise the selected range would
         *    enclose it and conflict with it.
         */
        let nextBookingStart: number | null = null;

        for (const booking of roomBookings) {
          const [bookingHour, bookingMinute] = booking.start_time
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
const [showConfirmation, setShowConfirmation] = useState(false);
const [submitting, setSubmitting] = useState(false);
const today = new Date().toISOString().split("T")[0];
const [sites, setSites] = useState<Site[]>([]);
const [rooms, setRooms] = useState<Room[]>([]);
const [loadingSites, setLoadingSites] = useState(true);
const [loadingRooms, setLoadingRooms] = useState(false);
const [approvedBookings, setApprovedBookings] = useState<ApprovedBooking[]>([]);
const [loadingApprovedBookings, setLoadingApprovedBookings] = useState(false);

/*
 * Success and error messages shown in a dialog.
 */
const [dialog, setDialog] = useState<DialogMessage | null>(
  null
);

function showDialog(
  variant: MessageVariant,
  title: string,
  message: string
) {
  setDialog({ variant, title, message });
}

/*
 * Re-renders the form every minute so time slots that have
 * just passed drop out of the Start/End time lists without
 * requiring a page refresh.
 */
const [, setMinuteTick] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setMinuteTick((tick) => tick + 1);
  }, 60000);

  return () => clearInterval(interval);
}, []);



  const [bookingSchedules, setBookingSchedules] = useState<
    BookingSchedule[]
  >([
    {
      id: Date.now(),
      date: selectedDate,
      start_time: "",
      end_time: "",
    },
  ]);


  useEffect(() => {
    setBookingSchedules((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: Date.now(),
            date: selectedDate,
            start_time: "",
            end_time: "",
          },
        ];
      }

      return prev.map((schedule, index) =>
        index === 0
          ? {
              ...schedule,
              date: selectedDate,
            }
          : schedule
      );
    });
  }, [selectedDate]);

  useEffect(() => {
  const fetchSites = async () => {
    try {
      setLoadingSites(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sites`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sites.");
      }

      const data: Site[] = await response.json();

      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    } finally {
      setLoadingSites(false);
    }
  };

  fetchSites();
}, []);

  useEffect(() => {
  if (!formData.site_id) {
    setRooms([]);
    return;
  }

const fetchRooms = async () => {
  try {
    setLoadingRooms(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/available?site_id=${formData.site_id}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.detail || "Failed to fetch rooms."
      );
    }

    const data: Room[] = await response.json();

    setRooms(data);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    setRooms([]);
  } finally {
    setLoadingRooms(false);
  }
};

  fetchRooms();
}, [formData.site_id]);


const fetchApprovedBookings = useCallback(async () => {
  try {
    setLoadingApprovedBookings(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/room-requests/active`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch approved bookings.");
    }

    const data: ApprovedBooking[] = await response.json();

    setApprovedBookings(data);
  } catch (error) {
    console.error("Error fetching approved bookings:", error);
    setApprovedBookings([]);
  } finally {
    setLoadingApprovedBookings(false);
  }
}, []);

useEffect(() => {
  fetchApprovedBookings();
}, [fetchApprovedBookings]);

  /*
   * Employee information
   */
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /*
   * Reservation schedule fields
   */
  function handleScheduleChange(
    id: number,
    field: "date" | "start_time" | "end_time",
    value: string
  ) {
    setBookingSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.id !== id) {
          return schedule;
        }

        const updated = {
          ...schedule,
          [field]: value,
        };

        /*
         * A start time that is at or after the chosen end time
         * makes that end time invalid, and it is no longer in
         * the end time list, so clear it.
         */
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
  }

  /*
   * Add another reservation date
   */
  function addSchedule() {
    setBookingSchedules((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        date: "",
        start_time: "",
        end_time: "",
      },
    ]);
  }

  /*
   * Remove reservation date
   */
  function removeSchedule(id: number) {
    setBookingSchedules((prev) =>
      prev.filter((schedule) => schedule.id !== id)
    );
  }

  /*
   * Submit all reservation dates
   */
async function handleSubmit(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  // Basic validation
  if (!formData.name) {
    showDialog("error", "Missing Information", "Please enter your name.");
    return;
  }

  if (!formData.company_email) {
    showDialog(
      "error",
      "Missing Information",
      "Please enter your company email."
    );
    return;
  }

  if (!formData.site_id) {
    showDialog("error", "Missing Information", "Please select a site.");
    return;
  }

  if (!formData.room_id) {
    showDialog("error", "Missing Information", "Please select a room.");
    return;
  }

  if (!formData.purpose) {
    showDialog("error", "Missing Information", "Please enter the purpose.");
    return;
  }

  for (const schedule of bookingSchedules) {
    if (
      !schedule.date ||
      !schedule.start_time ||
      !schedule.end_time
    ) {
      showDialog(
        "error",
        "Incomplete Schedule",
        "Please complete the date, start time, and end time for every reservation."
      );
      return;
    }

    if (schedule.start_time >= schedule.end_time) {
      showDialog(
        "error",
        "Invalid Time",
        `Invalid time for ${schedule.date}. End time must be later than start time.`
      );
      return;
    }
  }

  // Open confirmation modal
  setShowConfirmation(true);
}
async function confirmSubmit() {
  try {
    setSubmitting(true);

    const responses = await Promise.all(
      bookingSchedules.map((schedule) =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/room-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              room_id: Number(formData.room_id),

              room_name: (() => {
                const selectedRoom = rooms.find(
                  (room) =>
                    String(room.room_id) === formData.room_id
                );

                return selectedRoom?.room_name || "";
              })(),

              employee_name: formData.name,
              employee_email: formData.company_email,

              reservation_date: schedule.date,
              start_time: schedule.start_time,
              end_time: schedule.end_time,

              purpose: formData.purpose,

              site: formData.site_id,
            }),
          }
        )
      )
    );

    /*
     * Check every request
     */
    for (const response of responses) {
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "We could not submit your room request. Please try again."
          )
        );
      }
    }

    /*
     * Parse successful responses
     */
    const data = await Promise.all(
      responses.map((response) => response.json())
    );

    console.log("Room requests submitted:", data);

    // Close confirmation modal
    setShowConfirmation(false);

    /*
     * Reset form
     */
    setFormData({
      name: "",
      company_email: "",
      site: "",
      room: "",
      purpose: "",
      site_id: "",
      room_id: "",
    });

    setRooms([]);

    setBookingSchedules([
      {
        id: Date.now(),
        date: selectedDate,
        start_time: "",
        end_time: "",
      },
    ]);

    /*
     * Refresh the booked time slots used by this form and the
     * bookings shown by the parent page, so the new request is
     * visible without a manual browser refresh.
     */
    await fetchApprovedBookings();

    if (onSuccess) {
      await onSuccess();
    }

    // Alert only after the refreshed data is on screen.
    showDialog(
      "success",
      "Request Submitted",
      data.length === 1
        ? "Your room request has been submitted and is now pending approval. " +
            "A confirmation email has been sent to you."
        : `Your ${data.length} room requests have been submitted and are now pending approval. ` +
            "A confirmation email has been sent to you."
    );
  } catch (error) {
    /*
     * Some requests in the batch may already have been created,
     * so refresh before reporting the failure. Without this the
     * page would look unchanged and invite a duplicate submit.
     */
    await fetchApprovedBookings();

    if (onSuccess) {
      await onSuccess();
    }

    showDialog(
      "error",
      "Submission Failed",
      getThrownMessage(
        error,
        "We could not submit your room request. Please try again."
      )
    );
  } finally {
    setSubmitting(false);
  }
}

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Name
          </label>

          <EmployeeNameInput
            name="name"
            value={formData.name}
            onChange={(name) =>
              setFormData((prev) => ({
                ...prev,
                name,
              }))
            }
            onSelect={(employee) =>
              setFormData((prev) => ({
                ...prev,
                name: employee.name,
                company_email: employee.email,
              }))
            }
            placeholder="Enter your name"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Company Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Company Email
          </label>

          <input
            type="email"
            name="company_email"
            value={formData.company_email}
            onChange={handleChange}
            placeholder="name@company.com"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>
{/* Site */}
<div>
  <label className="mb-1 block text-sm font-medium text-slate-700">
    Site
  </label>

  <select
    name="site_id"
    value={formData.site_id}
    onChange={(e) => {
      setFormData((prev) => ({
        ...prev,
        site_id: e.target.value,
        room_id: "",
      }));
    }}
    required
    disabled={loadingSites}
    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-100"
  >
    <option value="">
      {loadingSites ? "Loading sites..." : "Select site"}
    </option>

    {sites.map((site) => (
      <option
        key={site.site_id}
        value={site.site_id}
      >
        {site.site_name}
      </option>
    ))}
  </select>
</div>
{/* Room */}
<div>
  <label className="mb-1 block text-sm font-medium text-slate-700">
    Room
  </label>

<select
  name="room_id"
  value={formData.room_id}
  onChange={(e) => {
    setFormData((prev) => ({
      ...prev,
      room_id: e.target.value,
    }));

    setBookingSchedules((prev) =>
      prev.map((schedule) => ({
        ...schedule,
        start_time: "",
        end_time: "",
      }))
    );
  }}
  required
  disabled={!formData.site_id || loadingRooms}
    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-100"
  >
    <option value="">
      {!formData.site_id
        ? "Select a site first"
        : loadingRooms
        ? "Loading rooms..."
        : rooms.length === 0
        ? "No rooms available"
        : "Select room"}
    </option>

    {rooms.map((room) => (
      <option
        key={room.room_id}
        value={room.room_id}
      >
        {room.room_code} — {room.room_name}
      </option>
    ))}
  </select>
</div>
</div>
      {/* Reservation Schedules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Reservation Schedule
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Add multiple dates if you need recurring reservations.
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

        {bookingSchedules.map((schedule, index) => (
          <div
            key={schedule.id}
            className="rounded-md border border-slate-200 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Reservation {index + 1}
              </p>

              {bookingSchedules.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSchedule(schedule.id)}
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
  value={schedule.date}
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

<div>
  <label className="mb-1 block text-sm font-medium text-slate-700">
    Start Time
  </label>

  <select
    value={schedule.start_time}
    onChange={(e) =>
      handleScheduleChange(
        schedule.id,
        "start_time",
        e.target.value
      )
    }
    required
    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
  >
    <option value="">Select start time</option>

{getTimeOptions(
  schedule.date,
  formData.room_id,
  schedule.id,
  "start_time"
).map((time: TimeOption) => (
      <option
        key={time.value}
        value={time.value}
        disabled={time.disabled}
      >
        {time.label}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-slate-700">
    End Time
  </label>

  <select
    value={schedule.end_time}
    onChange={(e) =>
      handleScheduleChange(
        schedule.id,
        "end_time",
        e.target.value
      )
    }
    required
    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
  >
    <option value="">Select end time</option>

{getTimeOptions(
  schedule.date,
  formData.room_id,
  schedule.id,
  "end_time"
).map((time: TimeOption) => (
      <option
        key={time.value}
        value={time.value}
        disabled={time.disabled}
      >
        {time.label}
      </option>
    ))}
  </select>
</div>
            </div>
          </div>
        ))}
      </div>

      {/* Purpose */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Purpose
        </label>

        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          rows={3}
          placeholder="Enter the purpose of the room reservation"
          required
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full rounded-md bg-[#03045e] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Submit Room Request
      </button>
      <RoomRequestConfirmationModal
  isOpen={showConfirmation}
  formData={formData}
  sites={sites}
  rooms={rooms}
  bookingSchedules={bookingSchedules}
  onEdit={() => setShowConfirmation(false)}
  onConfirm={confirmSubmit}
  submitting={submitting}
/>

      <MessageDialog
        isOpen={dialog !== null}
        variant={dialog?.variant}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        onClose={() => setDialog(null)}
      />
    </form>
  );
}