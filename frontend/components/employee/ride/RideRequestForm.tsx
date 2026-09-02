"use client";
import { useState, useEffect } from "react";
import RideRequestConfirmationModal from "./RideRequestConfirmationModal";
import MessageDialog, {
  DialogMessage,
  MessageVariant,
} from "@/components/shared/MessageDialog";
interface RideRequestFormProps {
  selectedDate: string;

  /*
   * Called after every reservation in a submission has been
   * created, so the parent page can refresh its bookings.
   */
  onSuccess?: () => void | Promise<void>;
}

interface Site {
  site_id: number;
  site_name: string;
}

interface RideFormData {
  name: string;
  company_email: string;

  site: string;
  site_id: number | null;

  pickup_location: string;
  pickup_maps_link: string;

  dropoff_destination: string;
  drop_off_maps_link: string;

  purpose: string;
  passenger_count: number;
}


type TimeOption = {
  value: string;
  label: string;
};

interface TravelSchedule {
  id: number;
  date: string;
  departure_time: string;

  /*
   * Round trip is decided per travel date, so one reservation
   * can be a round trip while another is one way.
   */
  roundtrip: boolean;
  return_pickup: string;
  return_drop_off_location: string;
  return_drop_off_maps_link: string;
}

const emptySchedule = (
  date: string
): TravelSchedule => ({
  id: Date.now() + Math.random(),
  date,
  departure_time: "",
  roundtrip: false,
  return_pickup: "",
  return_drop_off_location: "",
  return_drop_off_maps_link: "",
});

/*
 * Format a Date as YYYY-MM-DD in local time.
 */
function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function RideRequestForm({
  selectedDate,
  onSuccess,
}: RideRequestFormProps) {
  const today = new Date().toISOString().split("T")[0];

const [formData, setFormData] = useState<RideFormData>({
  name: "",
  company_email: "",
  site: "",
  site_id: null,
  pickup_location: "",
  pickup_maps_link: "",
  dropoff_destination: "",
  drop_off_maps_link: "",
  purpose: "",
  passenger_count: 1,
});

  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /*
   * Travel schedule.
   *
   * Each row is submitted as its own ride reservation using
   * the same endpoint and the same rules.
   */
  const [travelSchedules, setTravelSchedules] = useState<
    TravelSchedule[]
  >([emptySchedule(selectedDate)]);

  /*
   * Success and error messages shown in a dialog.
   */
  const [dialog, setDialog] =
    useState<DialogMessage | null>(null);

  function showDialog(
    variant: MessageVariant,
    title: string,
    message: string
  ) {
    setDialog({ variant, title, message });
  }

  /*
   * Re-renders the form every minute so departure times that
   * have just passed drop out of the list without requiring a
   * page refresh.
   */
  const [, setMinuteTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMinuteTick((tick) => tick + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  /*
   * Generate time options every 30 minutes.
   *
   * Times that have already passed are removed when the
   * travel date is today, so they cannot be booked.
   */
  const getTimeOptions = (
    travelDate: string,
    selectedValue: string
  ): TimeOption[] => {
    const options: TimeOption[] = [];

    const now = new Date();

    const todayString = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const value = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;

        if (travelDate === todayString) {
          const slotTime = new Date();

          slotTime.setHours(hour, minute, 0, 0);

          /*
           * A slot that lapses while the form is open is kept
           * so the current selection stays visible.
           */
          if (
            slotTime <= now &&
            value !== selectedValue
          ) {
            continue;
          }
        }

        const hour12 =
          hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

        const period = hour < 12 ? "AM" : "PM";

        const label = `${hour12}:${String(minute).padStart(
          2,
          "0"
        )} ${period}`;

        options.push({
          value,
          label,
        });
      }
    }

    return options;
  };


  /*
   * Fetch sites.
   */
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

/*
 * Keep the first travel date in step with the date selected
 * on the calendar.
 */
useEffect(() => {
  setTravelSchedules((prev) => {
    if (prev.length === 0) {
      return [emptySchedule(selectedDate)];
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
 * Travel schedule fields
 */
function handleScheduleChange(
  id: number,
  field:
    | "date"
    | "departure_time"
    | "return_pickup"
    | "return_drop_off_location"
    | "return_drop_off_maps_link",
  value: string
) {
  setTravelSchedules((prev) =>
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
 * Round trip for one travel date
 */
function handleScheduleRoundTrip(
  id: number,
  checked: boolean
) {
  setTravelSchedules((prev) =>
    prev.map((schedule) =>
      schedule.id === id
        ? {
            ...schedule,
            roundtrip: checked,
            return_pickup: checked
              ? schedule.return_pickup
              : "",
            return_drop_off_location: checked
              ? schedule.return_drop_off_location
              : "",
            return_drop_off_maps_link: checked
              ? schedule.return_drop_off_maps_link
              : "",
          }
        : schedule
    )
  );
}

/*
 * Add another travel date
 */
function addSchedule() {
  setTravelSchedules((prev) => [
    ...prev,
    emptySchedule(""),
  ]);
}

/*
 * Remove travel date
 */
function removeSchedule(id: number) {
  setTravelSchedules((prev) =>
    prev.filter((schedule) => schedule.id !== id)
  );
}

function handleChange(
  e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >
) {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]:
      name === "passenger_count"
        ? Number(value)
        : value,
  }));
}

async function handleSubmit(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  if (!formData.name.trim()) {
    showDialog(
      "error",
      "Missing Information",
      "Please enter your name."
    );
    return;
  }

  if (!formData.company_email.trim()) {
    showDialog(
      "error",
      "Missing Information",
      "Please enter your company email."
    );
    return;
  }

  if (!formData.site_id) {
    showDialog(
      "error",
      "Missing Information",
      "Please select a site."
    );
    return;
  }

  if (!formData.pickup_location.trim()) {
    showDialog(
      "error",
      "Missing Information",
      "Please enter the pickup location."
    );
    return;
  }

  if (!formData.dropoff_destination.trim()) {
    showDialog(
      "error",
      "Missing Information",
      "Please enter the drop-off destination."
    );
    return;
  }

  if (!formData.purpose.trim()) {
    showDialog(
      "error",
      "Missing Information",
      "Please enter the purpose."
    );
    return;
  }

  if (formData.passenger_count <= 0) {
    showDialog(
      "error",
      "Invalid Passenger Count",
      "Passenger count must be greater than 0."
    );
    return;
  }

  /*
   * Validate every reservation this submission will create.
   */
  const now = new Date();

  const todayString = toDateString(now);

  const seen = new Set<string>();

  for (const schedule of travelSchedules) {
    if (!schedule.date || !schedule.departure_time) {
      showDialog(
        "error",
        "Incomplete Schedule",
        "Please complete the travel date and departure time for every reservation."
      );
      return;
    }

    const key = `${schedule.date} ${schedule.departure_time}`;

    if (seen.has(key)) {
      showDialog(
        "error",
        "Duplicate Reservation",
        `${schedule.date} at ${schedule.departure_time} appears more than once. ` +
          "Please remove the duplicate."
      );
      return;
    }

    seen.add(key);

    if (schedule.date < todayString) {
      showDialog(
        "error",
        "Invalid Date",
        `${schedule.date} is in the past. ` +
          "Please choose a date from today onwards."
      );
      return;
    }

    if (schedule.date === todayString) {
      const [hour, minute] = schedule.departure_time
        .split(":")
        .map(Number);

      const departure = new Date();

      departure.setHours(hour, minute, 0, 0);

      if (departure <= now) {
        showDialog(
          "error",
          "Invalid Departure Time",
          `The departure time for ${schedule.date} has already passed. ` +
            "Please choose a later time."
        );
        return;
      }
    }

    if (schedule.roundtrip) {
      if (!schedule.return_pickup) {
        showDialog(
          "error",
          "Missing Information",
          `Please select the return pickup date and time for ${schedule.date}.`
        );
        return;
      }

      if (
        !schedule.return_drop_off_location.trim()
      ) {
        showDialog(
          "error",
          "Missing Information",
          `Please enter the return drop-off location for ${schedule.date}.`
        );
        return;
      }
    }
  }

  setShowConfirmation(true);
}

async function confirmSubmit() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  /*
   * Every row in the travel schedule is submitted through the
   * same endpoint, so the existing booking rules apply to all
   * of them.
   */
  try {
    setSubmitting(true);

    const buildPayload = (schedule: TravelSchedule) => ({
      employee_name: formData.name,
      employee_email: formData.company_email,
      site_id: formData.site_id,
      travel_date: schedule.date,
      departure_time: schedule.departure_time,
      roundtrip: schedule.roundtrip,
      return_pickup: schedule.roundtrip
        ? schedule.return_pickup
        : null,
      pickup_location: formData.pickup_location,
      pickup_maps_link:
        formData.pickup_maps_link || null,
      dropoff_destination:
        formData.dropoff_destination,
      drop_off_maps_link:
        formData.drop_off_maps_link || null,
      return_drop_off_location:
        schedule.roundtrip
          ? schedule.return_drop_off_location
          : null,
      return_drop_off_maps_link:
        schedule.roundtrip
          ? schedule.return_drop_off_maps_link || null
          : null,
      purpose: formData.purpose,
      passenger_count: formData.passenger_count,
    });

    const responses = await Promise.all(
      travelSchedules.map((schedule) =>
        fetch(
          `${apiUrl}/api/ride-reservations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(
              buildPayload(schedule)
            ),
          }
        )
      )
    );

    /*
     * Check every reservation.
     */
    for (const response of responses) {
      if (!response.ok) {
        let errorMessage =
          "We could not submit your ride reservation. Please try again.";

        try {
          const error = await response.json();

          if (typeof error.detail === "string") {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail
              .map((item: { msg: string }) => item.msg)
              .join(", ");
          }
        } catch {
          // Keep default error message
        }

        throw new Error(errorMessage);
      }
    }

    setShowConfirmation(false);

    setFormData({
      name: "",
      company_email: "",
      site: "",
      site_id: null,
      pickup_location: "",
      pickup_maps_link: "",
      dropoff_destination: "",
      drop_off_maps_link: "",
      purpose: "",
      passenger_count: 1,
    });

    setTravelSchedules([
      emptySchedule(selectedDate),
    ]);

    /*
     * Refresh the bookings shown by the parent page so the new
     * reservations appear without a manual browser refresh.
     */
    if (onSuccess) {
      await onSuccess();
    }

    // Alert only after the refreshed data is on screen.
    showDialog(
      "success",
      "Reservation Submitted",
      responses.length === 1
        ? "Your ride reservation has been submitted and is now pending approval. " +
            "A confirmation email has been sent to you."
        : `Your ${responses.length} ride reservations have been submitted and are now pending approval. ` +
            "A confirmation email has been sent to you."
    );
  } catch (error) {
    console.error("Ride reservation error:", error);

    /*
     * Some reservations in the batch may already have been
     * created, so refresh before reporting the failure. Without
     * this the page would look unchanged and invite a duplicate
     * submit.
     */
    if (onSuccess) {
      await onSuccess();
    }

    showDialog(
      "error",
      "Submission Failed",
      error instanceof Error
        ? error.message
        : "We could not submit your ride reservation. Please try again."
    );
  } finally {
    setSubmitting(false);
  }
}
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
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
  value={formData.site_id ?? ""}
  onChange={(e) => {
    const siteId = Number(e.target.value);

    const selectedSite = sites.find(
      (site) => site.site_id === siteId
    );

    setFormData((prev) => ({
      ...prev,
      site_id: siteId || null,
      site: selectedSite?.site_name ?? "",
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

        {/* Passenger Count */}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Passenger Count
          </label>

<input
  type="number"
  name="passenger_count"
  value={formData.passenger_count}
  onChange={handleChange}
  min="1"
  placeholder="Number of passengers"
  required
  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
/>
        </div>
      </div>

      {/* Travel Information */}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Travel Information
        </h3>

        {/* Travel Schedule */}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">
                Travel Schedule
              </h4>

              <p className="mt-1 text-xs text-slate-400">
                Add multiple dates if you need recurring
                reservations.
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

          {travelSchedules.map((schedule, index) => (
            <div
              key={schedule.id}
              className="rounded-md border border-slate-200 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Reservation {index + 1}
                </p>

                {travelSchedules.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeSchedule(schedule.id)
                    }
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Travel Date */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Travel Date
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

                {/* Departure Time */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Departure Time
                  </label>

                  <select
                    value={schedule.departure_time}
                    onChange={(e) =>
                      handleScheduleChange(
                        schedule.id,
                        "departure_time",
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
                  >
                    <option value="">
                      Select departure time
                    </option>

                    {getTimeOptions(
                      schedule.date,
                      schedule.departure_time
                    ).map((time) => (
                      <option
                        key={time.value}
                        value={time.value}
                      >
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Round Trip */}

              <div className="mt-4 flex items-center gap-3">
                <input
                  id={`roundtrip-${schedule.id}`}
                  type="checkbox"
                  checked={schedule.roundtrip}
                  onChange={(e) =>
                    handleScheduleRoundTrip(
                      schedule.id,
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#03045e] focus:ring-[#03045e]"
                />

                <label
                  htmlFor={`roundtrip-${schedule.id}`}
                  className="text-sm font-medium text-slate-700"
                >
                  Round Trip
                </label>
              </div>

              {/* Return Trip */}

              {schedule.roundtrip && (
                <div className="mt-4 space-y-4 rounded-md bg-slate-50 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Return Pickup
                    </label>

                    <input
                      type="datetime-local"
                      value={schedule.return_pickup}
                      min={`${
                        schedule.date || today
                      }T${
                        schedule.departure_time || "00:00"
                      }`}
                      onChange={(e) =>
                        handleScheduleChange(
                          schedule.id,
                          "return_pickup",
                          e.target.value
                        )
                      }
                      required
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Return Drop-off Location
                      </label>

                      <input
                        type="text"
                        value={
                          schedule.return_drop_off_location
                        }
                        onChange={(e) =>
                          handleScheduleChange(
                            schedule.id,
                            "return_drop_off_location",
                            e.target.value
                          )
                        }
                        placeholder="Enter return destination"
                        required
                        className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Google Maps Link
                      </label>

                      <input
                        type="url"
                        value={
                          schedule.return_drop_off_maps_link
                        }
                        onChange={(e) =>
                          handleScheduleChange(
                            schedule.id,
                            "return_drop_off_maps_link",
                            e.target.value
                          )
                        }
                        placeholder="https://maps.google.com/..."
                        className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* Pickup */}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Pickup Location
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Pickup Location
            </label>

            <input
              type="text"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              placeholder="Enter pickup location"
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Google Maps Link
            </label>

<input
  type="url"
  name="pickup_maps_link"
  value={formData.pickup_maps_link}
  onChange={handleChange}
  placeholder="https://maps.google.com/..."
  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
/>
          </div>
        </div>
      </div>

      {/* Destination */}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Drop-off Destination
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Drop-off Destination
            </label>

            <input
              type="text"
              name="dropoff_destination"
              value={formData.dropoff_destination}
              onChange={handleChange}
              placeholder="Enter destination"
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Google Maps Link
            </label>

            <input
              type="url"
              name="drop_off_maps_link"
              value={formData.drop_off_maps_link}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />
          </div>
        </div>
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
          placeholder="Enter the purpose of the ride reservation"
          required
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />
      </div>

      {/* Submit */}

      <button
        type="submit"
        className="w-full rounded-md bg-[#03045e] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Submit Ride Request
      </button>

      {/* Confirmation Modal */}

      
<RideRequestConfirmationModal
  isOpen={showConfirmation}
  formData={formData}
  travelSchedules={travelSchedules}
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