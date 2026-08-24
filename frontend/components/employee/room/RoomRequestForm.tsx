"use client";

import { useEffect, useState } from "react";
import RoomRequestConfirmationModal from "./RoomRequestConfirmationModal";
import { interactionSettingsStore } from "@fullcalendar/core/internal";
interface RoomRequestFormProps {
  selectedDate: string;
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

interface ApprovedBooking {
  room_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
}
export default function RoomRequestForm({
  selectedDate,
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

// const getTimeOptions = (selectedDate: string): TimeOption[] => {
//   const options: TimeOption[] = [];

//   const now = new Date();

//   const today = new Date();
//   const todayString = `${today.getFullYear()}-${String(
//     today.getMonth() + 1
//   ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

//   for (let hour = 0; hour < 24; hour++) {
//     for (const minute of [0, 30]) {
//       const value = `${String(hour).padStart(2, "0")}:${String(
//         minute
//       ).padStart(2, "0")}`;

//       const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

//       const period = hour < 12 ? "AM" : "PM";

//       const label = `${hour12}:${String(minute).padStart(
//         2,
//         "0"
//       )} ${period}`;

//       let disabled = false;

//       // Disable times that have already passed if the selected date is today
//       if (selectedDate === todayString) {
//         const selectedTime = new Date();

//         selectedTime.setHours(hour, minute, 0, 0);

//         if (selectedTime <= now) {
//           disabled = true;
//         }
//       }

//       options.push({
//         value,
//         label,
//         disabled,
//       });
//     }
//   }

//   return options;
// };

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

  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
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
       * 1. Disable times that have already passed
       *    if the selected date is today.
       */
      if (selectedDate === todayString) {
        const selectedTime = new Date();

        selectedTime.setHours(hour, minute, 0, 0);

        if (selectedTime <= now) {
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
       */
      if (field === "end_time" && selectedStartTime) {
        const [startHour, startMinute] = selectedStartTime
          .split(":")
          .map(Number);

        const startMinutes = startHour * 60 + startMinute;

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
const [showConfirmation, setShowConfirmation] = useState(false);
const [submitting, setSubmitting] = useState(false);
const today = new Date().toISOString().split("T")[0];
const [sites, setSites] = useState<Site[]>([]);
const [rooms, setRooms] = useState<Room[]>([]);
const [loadingSites, setLoadingSites] = useState(true);
const [loadingRooms, setLoadingRooms] = useState(false);
const [approvedBookings, setApprovedBookings] = useState<ApprovedBooking[]>([]);
const [loadingApprovedBookings, setLoadingApprovedBookings] = useState(false);



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
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms?site_id=${formData.site_id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch rooms.");
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


useEffect(() => {
  const fetchApprovedBookings = async () => {
    try {
      setLoadingApprovedBookings(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/room-requests/active`
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
  };

  fetchApprovedBookings();
}, []);

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
      prev.map((schedule) =>
        schedule.id === id
          ? {
              ...schedule,
              [field]: value,
            }
          : schedule
      )
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
    alert("Please enter your name.");
    return;
  }

  if (!formData.company_email) {
    alert("Please enter your company email.");
    return;
  }

  if (!formData.site_id) {
    alert("Please select a site.");
    return;
  }

  if (!formData.room_id) {
    alert("Please select a room.");
    return;
  }

  if (!formData.purpose) {
    alert("Please enter the purpose.");
    return;
  }

  for (const schedule of bookingSchedules) {
    if (
      !schedule.date ||
      !schedule.start_time ||
      !schedule.end_time
    ) {
      alert(
        "Please complete the date, start time, and end time for every reservation."
      );
      return;
    }

    if (schedule.start_time >= schedule.end_time) {
      alert(
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
        let errorMessage = "Failed to submit room request.";

        try {
          const error = await response.json();

          if (typeof error.detail === "string") {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail
              .map((item: any) => item.msg)
              .join(", ");
          }
        } catch {
          // Keep default error message
        }

        throw new Error(errorMessage);
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

    alert(
      `${data.length} room request(s) submitted successfully!`
    );

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
  } catch (error) {
    console.error("Room request error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to submit room request."
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

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
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
    </form>
  );
}