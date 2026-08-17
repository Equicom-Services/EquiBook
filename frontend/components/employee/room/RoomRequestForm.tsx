"use client";

import { useEffect, useState } from "react";

interface RoomRequestFormProps {
  selectedDate: string;
}

interface BookingSchedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
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
  });

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

  /*
   * Keep the first reservation date synchronized
   * with the date selected from the calendar.
   */
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

    if (!formData.site) {
      alert("Please select a site.");
      return;
    }

    if (!formData.room) {
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

    try {
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
                room_id: Number(formData.room),
                room_name:
                  formData.room === "1"
                    ? "Meeting Room 1"
                    : formData.room === "2"
                    ? "Meeting Room 2"
                    : "Conference Room",

                employee_name: formData.name,
                employee_email: formData.company_email,

                reservation_date: schedule.date,
                start_time: schedule.start_time,
                end_time: schedule.end_time,

                purpose: formData.purpose,
                site: formData.site,
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
      });

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
            name="site"
            value={formData.site}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          >
            <option value="">Select site</option>
            <option value="Main Office">Main Office</option>
            <option value="Branch Office">Branch Office</option>
          </select>
        </div>

        {/* Room */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Room
          </label>

          <select
            name="room"
            value={formData.room}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          >
            <option value="">Select room</option>
            <option value="1">Meeting Room 1</option>
            <option value="2">Meeting Room 2</option>
            <option value="3">Conference Room</option>
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

              {/* Start Time */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Start Time
                </label>

                <input
                  type="time"
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
                />
              </div>

              {/* End Time */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  End Time
                </label>

                <input
                  type="time"
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
                />
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
    </form>
  );
}