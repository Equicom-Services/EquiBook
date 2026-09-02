"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Admin {
admin_id: number;
name: string;
email: string;
site_id: number;
site_name: string;
}

interface AdminRideBookingFormProps {
onClose: () => void;
onSuccess: () => void;
}

export default function AdminRideBookingForm({
onClose,
onSuccess,
}: AdminRideBookingFormProps) {
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// =========================================================
// ADMIN
// =========================================================

const [admin, setAdmin] = useState<Admin | null>(null);
const [loadingAdmin, setLoadingAdmin] = useState(true);

// =========================================================
// REQUESTER
// =========================================================

const [employeeName, setEmployeeName] = useState("");
const [employeeEmail, setEmployeeEmail] = useState("");

// =========================================================
// RIDE DETAILS
// =========================================================

const [travelDate, setTravelDate] = useState("");
const [departureTime, setDepartureTime] = useState("");

const [roundtrip, setRoundtrip] = useState(false);
const [returnPickup, setReturnPickup] = useState("");

// =========================================================
// PICKUP / DROPOFF
// =========================================================

const [pickupLocation, setPickupLocation] = useState("");
const [pickupMapsLink, setPickupMapsLink] = useState("");

const [dropoffDestination, setDropoffDestination] =
useState("");

const [dropOffMapsLink, setDropOffMapsLink] =
useState("");

const [returnDropOffLocation, setReturnDropOffLocation] =
useState("");

const [
returnDropOffMapsLink,
setReturnDropOffMapsLink,
] = useState("");

// =========================================================
// ADDITIONAL DETAILS
// =========================================================

const [purpose, setPurpose] = useState("");

const [passengerCount, setPassengerCount] =
useState("");

const [vehicleType, setVehicleType] =
useState("");

const [adminRemarks, setAdminRemarks] =
useState("");

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
// VALIDATE TRAVEL DETAILS
// ---------------------------------------------------------

if (!travelDate) {
  setError(
    "Please select a travel date."
  );
  return;
}

if (!departureTime) {
  setError(
    "Please select a departure time."
  );
  return;
}

if (roundtrip && !returnPickup) {
  setError(
    "Return pickup time is required for a round trip."
  );
  return;
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

  const response = await fetch(
    `${API_URL}/api/ride-reservations/admin/bookings`,
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
        employee_name:
          employeeName.trim(),

        employee_email:
          employeeEmail.trim(),

        travel_date:
          travelDate,

        departure_time:
          departureTime,

        roundtrip:
          roundtrip,

        return_pickup:
        roundtrip && returnPickup
            ? `${travelDate}T${returnPickup}:00`
            : null,

        pickup_location:
          pickupLocation.trim(),

        pickup_maps_link:
          pickupMapsLink.trim() || null,

        dropoff_destination:
          dropoffDestination.trim(),

        drop_off_maps_link:
          dropOffMapsLink.trim() || null,

        return_drop_off_location:
          roundtrip
            ? returnDropOffLocation.trim() || null
            : null,

        return_drop_off_maps_link:
          roundtrip
            ? returnDropOffMapsLink.trim() || null
            : null,

        purpose:
          purpose.trim(),

        passenger_count:
          Number(passengerCount),

        vehicle_type:
          vehicleType.trim(),

        admin_remarks:
          adminRemarks.trim() || null,
      }),
    }
  );

  if (!response.ok) {
    let errorMessage =
      "Failed to create ride booking.";

    try {
      const data =
        await response.json();

      if (
        typeof data.detail === "string"
      ) {
        errorMessage = data.detail;
      } else if (
        Array.isArray(data.detail)
      ) {
        errorMessage = data.detail
          .map(
            (item: any) => item.msg
          )
          .join(", ");
      }
    } catch {
      // Keep default error message
    }

    throw new Error(errorMessage);
  }

  onSuccess();
  onClose();

} catch (error) {
  console.error(
    "Admin ride booking error:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Failed to create ride booking."
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
          Book a Ride
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Admin booking
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

            <input
              type="text"
              value={employeeName}
              onChange={(e) =>
                setEmployeeName(
                  e.target.value
                )
              }
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

      {/* TRAVEL DETAILS */}

      <div>

        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Travel Details
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* TRAVEL DATE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Travel Date
            </label>

            <input
              type="date"
              value={travelDate}
              min={today}
              onChange={(e) =>
                setTravelDate(
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
              value={departureTime}
              onChange={(e) =>
                setDepartureTime(
                  e.target.value
                )
              }
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />
          </div>

        </div>

      </div>

      {/* ROUND TRIP */}

      <div className="rounded-lg border border-slate-200 p-4">

        <label className="flex cursor-pointer items-center gap-3">

          <input
            type="checkbox"
            checked={roundtrip}
            onChange={(e) => {
              setRoundtrip(
                e.target.checked
              );

              if (!e.target.checked) {
                setReturnPickup("");
                setReturnDropOffLocation("");
                setReturnDropOffMapsLink("");
              }
            }}
            className="h-4 w-4"
          />

          <span className="text-sm font-medium text-slate-700">
            Round Trip
          </span>

        </label>

        {roundtrip && (

          <div className="mt-4">

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Return Pickup Time
            </label>

            <input
              type="time"
              value={returnPickup}
              onChange={(e) =>
                setReturnPickup(
                  e.target.value
                )
              }
              required={roundtrip}
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e]"
            />

          </div>

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

      {/* RETURN DROPOFF */}

      {roundtrip && (

        <div>

          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            Return Drop-off Information
          </h3>

          <div className="space-y-4">

            <div>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Return Drop-off Location
              </label>

              <input
                type="text"
                value={returnDropOffLocation}
                onChange={(e) =>
                  setReturnDropOffLocation(
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
                value={returnDropOffMapsLink}
                onChange={(e) =>
                  setReturnDropOffMapsLink(
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
            ? "Booking..."
            : "Book Ride"}
        </button>

      </div>

    </form>

  </div>

</div>

);
}