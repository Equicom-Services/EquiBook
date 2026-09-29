"use client";

import { Car, DoorOpen } from "lucide-react";

import {
  BookingRecord,
  BookingType,
  RideBookingRecord,
  RoomBookingRecord,
  getBookingId,
} from "@/lib/bookingAccess";

interface BookingSummaryCardProps {
  bookingType: BookingType;
  booking: BookingRecord;
}

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatTime(time: string) {
  if (!time) {
    return "";
  }

  const [hours, minutes] = time.split(":");

  const hour = Number(hours);

  const hour12 =
    hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${hour12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

function statusClasses(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-green-50 text-green-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/*
 * Compact booking details shown inside the booking assistant
 * once the employee has verified they own the booking.
 */
export default function BookingSummaryCard({
  bookingType,
  booking,
}: BookingSummaryCardProps) {
  let rows: [string, string][];

  if (bookingType === "room") {
    const room = booking as RoomBookingRecord;

    rows = [
      ["Room", room.room],
      ["Site", room.site],
      ["Date", formatDate(room.reservation_date)],
      [
        "Time",
        `${formatTime(room.start_time)} – ${formatTime(
          room.end_time
        )}`,
      ],
      ["Purpose", room.purpose],
    ];
  } else {
    const ride = booking as RideBookingRecord;

    rows = [
      ["Travel date", formatDate(ride.travel_date)],
      ["Departure", formatTime(ride.departure_time)],
      [
        "Route",
        `${ride.pickup_location} → ${ride.dropoff_destination}`,
      ],
      ["Passengers", String(ride.passenger_count)],
    ];
  }

  const Icon = bookingType === "room" ? DoorOpen : Car;

  const status = booking.status ?? "";

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Icon className="h-3.5 w-3.5 text-[#03045e]" />
          Booking #{getBookingId(bookingType, booking)}
        </p>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClasses(
            status
          )}`}
        >
          {status.toLowerCase() || "-"}
        </span>
      </div>

      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[5rem_1fr] gap-2 text-xs"
          >
            <dt className="text-slate-400">{label}</dt>

            <dd className="break-words font-medium text-slate-700">
              {value || "-"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
