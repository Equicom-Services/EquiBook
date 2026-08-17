"use client";

import { useState } from "react";
import ReservationToggle from "./ReservationToggle";
import DashboardStats from "./DashboardStats";
import GenerateReport from "./GenerateReport";
import ReservationStatusFilter from "./ReservationStatusFilter";
import RoomRequests from "./RoomRequests";
import RideRequests from "./RideRequests";

type ReservationType = "room" | "ride";

type ReservationStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

export default function AdminDashboard() {
  const [activeType, setActiveType] =
    useState<ReservationType>("room");

  const [activeStatus, setActiveStatus] =
    useState<ReservationStatus>("all");

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Dashboard Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage employee reservation requests.
            </p>
          </div>

          {/* Generate Report */}
          <GenerateReport
            reservationType={activeType}
          />
        </div>

        {/* Room / Ride Toggle */}
        <div className="mt-6">
          <ReservationToggle
            activeType={activeType}
            onChange={(type) => {
              setActiveType(type);
              setActiveStatus("all");
            }}
          />
        </div>

        {/* Dashboard Statistics */}
        <div className="mt-6">
          <DashboardStats
            reservationType={activeType}
          />
        </div>

        {/* Requests Section */}
        <section className="mt-8">

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {activeType === "room"
                  ? "Room Requests"
                  : "Ride Requests"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review employee requests and take appropriate action.
              </p>
            </div>

            {/* Status Filter */}
            <ReservationStatusFilter
              activeStatus={activeStatus}
              onChange={setActiveStatus}
            />
          </div>

          {/* Request List */}
          <div className="mt-5">
            {activeType === "room" ? (
              <RoomRequests
                status={activeStatus}
              />
            ) : (
              <RideRequests
                status={activeStatus}
              />
            )}
          </div>

        </section>

      </div>
    </main>
  );
}