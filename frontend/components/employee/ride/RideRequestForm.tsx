"use client";
import { useState, useEffect } from "react";
import RideRequestConfirmationModal from "./RideRequestConfirmationModal";
interface RideRequestFormProps {
  selectedDate: string;
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


type TimeOption = {
  value: string;
  label: string;
};

export default function RideRequestForm({
  selectedDate,
}: RideRequestFormProps) {
  const today = new Date().toISOString().split("T")[0];

const [formData, setFormData] = useState<RideFormData>({
  name: "",
  company_email: "",
  site: "",
  site_id: null,
  travel_date: selectedDate,
  departure_time: "",
  roundtrip: false,
  return_pickup: "",
  pickup_location: "",
  pickup_maps_link: "",
  dropoff_destination: "",
  drop_off_maps_link: "",
  return_drop_off_location: "",
  return_drop_off_maps_link: "",
  purpose: "",
  passenger_count: 1,
});

  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /*
   * Generate time options every 30 minutes.
   */
  const getTimeOptions = (): TimeOption[] => {
    const options: TimeOption[] = [];

    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const value = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;

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

  function handleRoundTripChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const checked = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      roundtrip: checked,
      return_pickup: checked ? prev.return_pickup : "",
      return_drop_off_location: checked
        ? prev.return_drop_off_location
        : "",
      return_drop_off_maps_link: checked
        ? prev.return_drop_off_maps_link
        : "",
    }));
  }

async function handleSubmit(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  if (!formData.name.trim()) {
    alert("Please enter your name.");
    return;
  }

  if (!formData.company_email.trim()) {
    alert("Please enter your company email.");
    return;
  }

  if (!formData.site_id) {
    alert("Please select a site.");
    return;
  }

  if (!formData.travel_date) {
    alert("Please select a travel date.");
    return;
  }

  if (!formData.departure_time) {
    alert("Please select a departure time.");
    return;
  }

  if (!formData.pickup_location.trim()) {
    alert("Please enter the pickup location.");
    return;
  }

  if (!formData.dropoff_destination.trim()) {
    alert("Please enter the drop-off destination.");
    return;
  }

  if (!formData.purpose.trim()) {
    alert("Please enter the purpose.");
    return;
  }

  if (formData.passenger_count <= 0) {
    alert("Passenger count must be greater than 0.");
    return;
  }

  if (formData.roundtrip) {
    if (!formData.return_pickup) {
      alert("Please select the return pickup date and time.");
      return;
    }

    if (!formData.return_drop_off_location.trim()) {
      alert("Please enter the return drop-off location.");
      return;
    }
  }

  setShowConfirmation(true);
}

async function confirmSubmit() {
  try {
    setSubmitting(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ride-reservations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          employee_name: formData.name,
          employee_email: formData.company_email,
          site_id: formData.site_id,

          travel_date: formData.travel_date,
          departure_time: formData.departure_time,

          roundtrip: formData.roundtrip,

          return_pickup: formData.roundtrip
            ? formData.return_pickup
            : null,

          pickup_location: formData.pickup_location,

          pickup_maps_link:
            formData.pickup_maps_link || null,

          dropoff_destination:
            formData.dropoff_destination,

          drop_off_maps_link:
            formData.drop_off_maps_link || null,

          return_drop_off_location:
            formData.roundtrip
              ? formData.return_drop_off_location
              : null,

          return_drop_off_maps_link:
            formData.roundtrip
              ? formData.return_drop_off_maps_link || null
              : null,

          purpose: formData.purpose,

          passenger_count:
            formData.passenger_count,
        }),
      }
    );

    if (!response.ok) {
      let errorMessage =
        "Failed to submit ride reservation.";

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
        // Keep default error message.
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    console.log(
      "Ride reservation submitted:",
      data
    );

    setShowConfirmation(false);

    alert(
      "Ride reservation submitted successfully!"
    );

    setFormData({
      name: "",
      company_email: "",
      site: "",
      site_id: null,
      travel_date: selectedDate,
      departure_time: "",
      roundtrip: false,
      return_pickup: "",
      pickup_location: "",
      pickup_maps_link: "",
      dropoff_destination: "",
      drop_off_maps_link: "",
      return_drop_off_location: "",
      return_drop_off_maps_link: "",
      purpose: "",
      passenger_count: 1,
    });
  } catch (error) {
    console.error(
      "Ride reservation error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to submit ride reservation."
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Travel Date */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Travel Date
            </label>

            <input
              type="date"
              name="travel_date"
              value={formData.travel_date}
              min={today}
              onChange={handleChange}
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
              name="departure_time"
              value={formData.departure_time}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            >
              <option value="">
                Select departure time
              </option>

              {getTimeOptions().map((time) => (
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

        <div className="flex items-center gap-3 rounded-md border border-slate-200 p-4">
          <input
            id="roundtrip"
            type="checkbox"
            checked={formData.roundtrip}
            onChange={handleRoundTripChange}
            className="h-4 w-4 rounded border-slate-300 text-[#03045e] focus:ring-[#03045e]"
          />

          <label
            htmlFor="roundtrip"
            className="text-sm font-medium text-slate-700"
          >
            Round Trip
          </label>
        </div>

        {/* Return Trip */}

        {formData.roundtrip && (
          <div className="rounded-md border border-slate-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-700">
              Return Trip
            </h4>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Return Pickup
              </label>

              <input
                type="datetime-local"
                name="return_pickup"
                value={formData.return_pickup}
                onChange={handleChange}
                required={formData.roundtrip}
                min={`${formData.travel_date}T${formData.departure_time || "00:00"}`}
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
              />
            </div>
          </div>
        )}
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

      {/* Return Destination */}

      {formData.roundtrip && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Return Drop-off
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Return Drop-off Location
              </label>

              <input
                type="text"
                name="return_drop_off_location"
                value={formData.return_drop_off_location}
                onChange={handleChange}
                placeholder="Enter return destination"
                required={formData.roundtrip}
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Google Maps Link
              </label>

              <input
                type="url"
                name="return_drop_off_maps_link"
                value={formData.return_drop_off_maps_link}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
              />
            </div>
          </div>
        </div>
      )}

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
  onEdit={() => setShowConfirmation(false)}
  onConfirm={confirmSubmit}
  submitting={submitting}
/>
    </form>
  );
}