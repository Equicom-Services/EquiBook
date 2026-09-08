"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import EmployeeNameInput from "@/components/shared/EmployeeNameInput";
import {
  getErrorMessage,
  getThrownMessage,
} from "@/lib/api";

interface Admin {
admin_id: number;
name: string;
email: string;
site_id: number;
site_name: string;
}

/*
 * The existing reservation being edited.
 *
 * Shaped to match the RideBooking object the request list already
 * holds, so the card can hand its booking straight to the form.
 */
interface EditableRideBooking {
id: string;
employee: string;
employee_email: string;
travel_date: string;
departure_time: string;
roundtrip: boolean;
return_pickup: string | null;
pickup_location: string;
pickup_maps_link: string | null;
dropoff_destination: string;
drop_off_maps_link: string | null;
return_drop_off_location: string | null;
return_drop_off_maps_link: string | null;
purpose: string;
passengers_count: number;
vehicle_type: string | null;
admin_remarks: string | null;
}

interface AdminRideBookingFormProps {
onClose: () => void;
onSuccess: () => void;

// When set, the form edits this reservation instead of creating
// new ones. Editing is limited to a single travel date.
editingReservation?: EditableRideBooking | null;
}

/*
 * Pull a "HH:MM" value out of either a bare time ("13:30:00") or a
 * full datetime ("2026-09-04T13:30:00") for the time inputs.
 */
const toTimeInput = (
value?: string | null
): string => {
if (!value) {
  return "";
}

const timePart = value.includes("T")
  ? value.split("T")[1]
  : value;

return timePart.slice(0, 5);
};

/*
 * One row of the travel schedule.
 *
 * Each row is booked as its own ride reservation, so round trip
 * and the return details are decided per travel date.
 */
interface TravelSchedule {
id: number;
date: string;
departure_time: string;
roundtrip: boolean;
return_pickup: string;
return_drop_off_location: string;
return_drop_off_maps_link: string;
}

const emptySchedule = (): TravelSchedule => ({
id: Date.now() + Math.random(),
date: "",
departure_time: "",
roundtrip: false,
return_pickup: "",
return_drop_off_location: "",
return_drop_off_maps_link: "",
});

export default function AdminRideBookingForm({
onClose,
onSuccess,
editingReservation = null,
}: AdminRideBookingFormProps) {
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const isEditing = editingReservation !== null;

// =========================================================
// ADMIN
// =========================================================

const [admin, setAdmin] = useState<Admin | null>(null);
const [loadingAdmin, setLoadingAdmin] = useState(true);

// =========================================================
// REQUESTER
// =========================================================

const [employeeName, setEmployeeName] = useState(
editingReservation?.employee ?? ""
);
const [employeeEmail, setEmployeeEmail] = useState(
editingReservation?.employee_email ?? ""
);

// =========================================================
// TRAVEL SCHEDULE
//
// One reservation is created per row, so an admin can book a
// recurring ride the same way an employee requests one.
// =========================================================

const [travelSchedules, setTravelSchedules] = useState<
TravelSchedule[]
>(
editingReservation
  ? [
      {
        id: 1,
        date: editingReservation.travel_date,
        departure_time: toTimeInput(
          editingReservation.departure_time
        ),
        roundtrip: editingReservation.roundtrip,
        return_pickup: toTimeInput(
          editingReservation.return_pickup
        ),
        return_drop_off_location:
          editingReservation.return_drop_off_location ??
          "",
        return_drop_off_maps_link:
          editingReservation.return_drop_off_maps_link ??
          "",
      },
    ]
  : [emptySchedule()]
);

// =========================================================
// PICKUP / DROPOFF
// =========================================================

const [pickupLocation, setPickupLocation] = useState(
editingReservation?.pickup_location ?? ""
);
const [pickupMapsLink, setPickupMapsLink] = useState(
editingReservation?.pickup_maps_link ?? ""
);

const [dropoffDestination, setDropoffDestination] =
useState(
editingReservation?.dropoff_destination ?? ""
);

const [dropOffMapsLink, setDropOffMapsLink] =
useState(
editingReservation?.drop_off_maps_link ?? ""
);

// =========================================================
// ADDITIONAL DETAILS
// =========================================================

const [purpose, setPurpose] = useState(
editingReservation?.purpose ?? ""
);

const [passengerCount, setPassengerCount] =
useState(
editingReservation
  ? String(editingReservation.passengers_count)
  : ""
);

const [vehicleType, setVehicleType] =
useState(
editingReservation?.vehicle_type ?? ""
);

const [adminRemarks, setAdminRemarks] =
useState(
editingReservation?.admin_remarks ?? ""
);

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

    const token =
      localStorage.getItem("access_token");

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
      throw new Error(
        "Failed to fetch admin information."
      );
    }

    const data: Admin = await response.json();

    setAdmin(data);
  } catch (error) {
    console.error(
      "Error fetching admin:",
      error
    );

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
// SCHEDULE CHANGE
// =========================================================

const handleScheduleChange = (
id: number,
field:
  | "date"
  | "departure_time"
  | "return_pickup"
  | "return_drop_off_location"
  | "return_drop_off_maps_link",
value: string
) => {
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
};

// =========================================================
// ROUND TRIP FOR ONE TRAVEL DATE
// =========================================================

const handleScheduleRoundTrip = (
id: number,
checked: boolean
) => {
setTravelSchedules((prev) =>
  prev.map((schedule) =>
    schedule.id === id
      ? {
          ...schedule,
          roundtrip: checked,

          // Clearing the return details keeps a cancelled round
          // trip from submitting stale values.
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
};

// =========================================================
// ADD DATE
// =========================================================

const addSchedule = () => {
setTravelSchedules((prev) => [
  ...prev,
  emptySchedule(),
]);
};

// =========================================================
// REMOVE DATE
// =========================================================

const removeSchedule = (id: number) => {
setTravelSchedules((prev) =>
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

// ---------------------------------------------------------
// VALIDATE REQUESTER
// ---------------------------------------------------------

if (!employeeName.trim()) {
  setError(
    "Please enter the requester's name."
  );
  return;
}

if (!employeeEmail.trim()) {
  setError(
    "Please enter the requester's company email."
  );
  return;
}

// ---------------------------------------------------------
// VALIDATE TRAVEL SCHEDULE
//
// Every row becomes its own reservation, so each one is
// checked before anything is sent.
// ---------------------------------------------------------

if (travelSchedules.length === 0) {
  setError(
    "Please add at least one travel date."
  );
  return;
}

const seen = new Set<string>();

for (const schedule of travelSchedules) {
  if (!schedule.date) {
    setError(
      "Please select a travel date for every reservation."
    );
    return;
  }

  if (!schedule.departure_time) {
    setError(
      "Please select a departure time for every reservation."
    );
    return;
  }

  const key = `${schedule.date} ${schedule.departure_time}`;

  if (seen.has(key)) {
    setError(
      `${schedule.date} at ${schedule.departure_time} appears more than once. ` +
        "Please remove the duplicate."
    );
    return;
  }

  seen.add(key);

  if (!isEditing && schedule.date < today) {
    setError(
      `${schedule.date} is in the past. ` +
        "Please choose a date from today onwards."
    );
    return;
  }

  if (
    schedule.roundtrip &&
    !schedule.return_pickup
  ) {
    setError(
      `Return pickup time is required for the round trip on ${schedule.date}.`
    );
    return;
  }
}

// ---------------------------------------------------------
// VALIDATE LOCATIONS
// ---------------------------------------------------------

if (!pickupLocation.trim()) {
  setError(
    "Please enter the pickup location."
  );
  return;
}

if (!dropoffDestination.trim()) {
  setError(
    "Please enter the drop-off destination."
  );
  return;
}

// ---------------------------------------------------------
// VALIDATE OTHER DETAILS
// ---------------------------------------------------------

if (!purpose.trim()) {
  setError(
    "Please enter the purpose of the trip."
  );
  return;
}

if (
  !passengerCount ||
  Number(passengerCount) <= 0
) {
  setError(
    "Passenger count must be greater than 0."
  );
  return;
}

if (!vehicleType.trim()) {
  setError(
    "Please enter or select a vehicle type."
  );
  return;
}

// =========================================================
// CREATE ADMIN RIDE BOOKING
// =========================================================

try {
  setLoading(true);

  const token =
    localStorage.getItem("access_token");

  // Body for one travel date, shared by create and edit.
  const buildBody = (schedule: TravelSchedule) => ({
    employee_name: employeeName.trim(),

    employee_email: employeeEmail.trim(),

    travel_date: schedule.date,

    departure_time: schedule.departure_time,

    roundtrip: schedule.roundtrip,

    return_pickup:
      schedule.roundtrip && schedule.return_pickup
        ? `${schedule.date}T${schedule.return_pickup}:00`
        : null,

    pickup_location: pickupLocation.trim(),

    pickup_maps_link: pickupMapsLink.trim() || null,

    dropoff_destination: dropoffDestination.trim(),

    drop_off_maps_link: dropOffMapsLink.trim() || null,

    return_drop_off_location: schedule.roundtrip
      ? schedule.return_drop_off_location.trim() || null
      : null,

    return_drop_off_maps_link: schedule.roundtrip
      ? schedule.return_drop_off_maps_link.trim() || null
      : null,

    purpose: purpose.trim(),

    passenger_count: Number(passengerCount),

    vehicle_type: vehicleType.trim(),

    admin_remarks: adminRemarks.trim() || null,
  });

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };

  // ---------------------------------------------------------
  // EDIT: one reservation, transferred/updated in place.
  // ---------------------------------------------------------
  if (isEditing && editingReservation) {
    const response = await fetch(
      `${API_URL}/api/ride-reservations/admin/bookings/${editingReservation.id}`,
      {
        method: "PUT",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify(
          buildBody(travelSchedules[0])
        ),
      }
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "We could not update the ride booking. Please try again."
        )
      );
    }

    onSuccess();
    onClose();
    return;
  }

  // ---------------------------------------------------------
  // CREATE: one reservation per travel date row.
  // ---------------------------------------------------------
  const responses = await Promise.all(
    travelSchedules.map((schedule) =>
      fetch(
        `${API_URL}/api/ride-reservations/admin/bookings`,
        {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify(buildBody(schedule)),
        }
      )
    )
  );

  for (const response of responses) {
    if (!response.ok) {
      const errorMessage = await getErrorMessage(
        response,
        "We could not create the ride booking. Please try again."
      );

      // Some bookings in the batch may already have been
      // created, so refresh the list before reporting the
      // failure instead of leaving the page looking unchanged.
      onSuccess();

      throw new Error(errorMessage);
    }
  }

  onSuccess();
  onClose();

} catch (error) {
  setError(
    getThrownMessage(
      error,
      isEditing
        ? "We could not update the ride booking. Please try again."
        : "We could not create the ride booking. Please try again."
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
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

  <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white shadow-2xl">

    {/* HEADER */}

    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {isEditing ? "Edit Ride Booking" : "Book a Ride"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {isEditing
            ? "Transfer to another date or update the details."
            : "Admin booking"}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <X size={20} />
      </button>

    </div>

    {/* FORM */}

    <form
      onSubmit={handleSubmit}
      className="space-y-6 px-6 py-6"
    >

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* REQUESTER */}

      <div>

        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Requester Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* NAME */}

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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Company Email
            </label>

            <input
              type="email"
              value={employeeEmail}
              onChange={(e) =>
                setEmployeeEmail(
                  e.target.value
                )
              }
              placeholder="name@company.com"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </div>

        {/* Note: manual entry fallback */}
        <p className="mt-3 text-xs text-slate-400">
          If the requester&apos;s name or email doesn&apos;t appear in the suggestions, just type it in manually.
        </p>

      </div>

      {/* SITE */}

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
          You can only book rides within your
          assigned site.
        </p>

      </div>

      {/* TRAVEL SCHEDULE */}

      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Travel Schedule
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {isEditing
                ? "Change the travel date to transfer this ride."
                : "Add multiple dates if you need recurring bookings."}
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

        {travelSchedules.map(
          (schedule, index) => (

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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* TRAVEL DATE */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Travel Date
                  </label>

                  <input
                    type="date"
                    value={schedule.date}
                    min={isEditing ? undefined : today}
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

                {/* DEPARTURE TIME */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Departure Time
                  </label>

                  <input
                    type="time"
                    value={schedule.departure_time}
                    onChange={(e) =>
                      handleScheduleChange(
                        schedule.id,
                        "departure_time",
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
                  />
                </div>

              </div>

              {/* ROUND TRIP */}

              <div className="mt-4">

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={schedule.roundtrip}
                    onChange={(e) =>
                      handleScheduleRoundTrip(
                        schedule.id,
                        e.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Round Trip
                  </span>

                </label>

                {schedule.roundtrip && (

                  <div className="mt-4 space-y-4 rounded-md bg-slate-50 p-4">

                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Return Pickup Time
                      </label>

                      <input
                        type="time"
                        value={schedule.return_pickup}
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
                        placeholder="Enter return drop-off location"
                        className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Return Drop-off Google Maps Link
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

                )}

              </div>

            </div>

          )
        )}

      </div>

      {/* PICKUP */}

      <div>

        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Pickup Information
        </h3>

        <div className="space-y-4">

          <div>

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Pickup Location
            </label>

            <input
              type="text"
              value={pickupLocation}
              onChange={(e) =>
                setPickupLocation(
                  e.target.value
                )
              }
              placeholder="Enter pickup location"
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />

          </div>

          <div>

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Pickup Google Maps Link
            </label>

            <input
              type="url"
              value={pickupMapsLink}
              onChange={(e) =>
                setPickupMapsLink(
                  e.target.value
                )
              }
              placeholder="https://maps.google.com/..."
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />

          </div>

        </div>

      </div>

      {/* DROPOFF */}

      <div>

        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Drop-off Information
        </h3>

        <div className="space-y-4">

          <div>

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Drop-off Destination
            </label>

            <input
              type="text"
              value={dropoffDestination}
              onChange={(e) =>
                setDropoffDestination(
                  e.target.value
                )
              }
              placeholder="Enter drop-off destination"
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />

          </div>

          <div>

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Drop-off Google Maps Link
            </label>

            <input
              type="url"
              value={dropOffMapsLink}
              onChange={(e) =>
                setDropOffMapsLink(
                  e.target.value
                )
              }
              placeholder="https://maps.google.com/..."
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />

          </div>

        </div>

      </div>

      {/* PASSENGERS */}

      <div>

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Passenger Count
        </label>

        <input
          type="number"
          min="1"
          value={passengerCount}
          onChange={(e) =>
            setPassengerCount(
              e.target.value
            )
          }
          placeholder="Enter number of passengers"
          required
          className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
        />

      </div>

{/* VEHICLE */}
<div>
  <label className="mb-1 block text-sm font-medium text-slate-700">
    Vehicle Type
  </label>

  <select
    value={vehicleType}
    onChange={(e) => setVehicleType(e.target.value)}
    required
    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#03045e] focus:ring-2 focus:ring-blue-100"
  >
    <option value="" disabled>
      Select vehicle type
    </option>
    <option value="Company Car">Company Car</option>
    <option value="TNVS">TNVS</option>
  </select>
</div>

      {/* PURPOSE */}

      <div>

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Purpose
        </label>

        <textarea
          value={purpose}
          onChange={(e) =>
            setPurpose(
              e.target.value
            )
          }
          rows={3}
          placeholder="Enter the purpose of the trip"
          required
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
        />

      </div>

      {/* ADMIN REMARKS */}

      <div>

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Admin Remarks
        </label>

        <textarea
          value={adminRemarks}
          onChange={(e) =>
            setAdminRemarks(
              e.target.value
            )
          }
          rows={3}
          placeholder="Optional remarks"
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
        />

      </div>

      {/* BUTTONS */}

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
            loadingAdmin
          }
          className="rounded-lg bg-[#03045e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? isEditing
              ? "Saving..."
              : "Booking..."
            : isEditing
            ? "Save Changes"
            : "Book Ride"}
        </button>

      </div>

    </form>

  </div>

</div>

);
}