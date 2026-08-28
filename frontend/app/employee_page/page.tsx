"use client";

import { useState } from "react";
import { Car, DoorOpen } from "lucide-react";

import RoomBookingPage from "@/components/employee/room/RoomBookingPage";
import RideBookingPage from "@/components/employee/ride/RideBookingPage";

export default function EmployeePage() {
  const [activeBooking, setActiveBooking] = useState<"room" | "ride">("room");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Booking Type Toggle */}
      <div className="flex justify-center px-6 pt-6">
        <div className="flex rounded-full border border-slate-200/50 bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveBooking("room")}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200 ${
              activeBooking === "room"
                ? "bg-[#03045e] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <DoorOpen className="h-3.5 w-3.5" />
            Rooms
          </button>

          <button
            type="button"
            onClick={() => setActiveBooking("ride")}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200 ${
              activeBooking === "ride"
                ? "bg-[#03045e] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            Ride
          </button>
        </div>
      </div>

      {/* Active Booking Page */}
      {activeBooking === "room" ? (
        <RoomBookingPage />
      ) : (
        <RideBookingPage />
      )}
    </main>
  );
}