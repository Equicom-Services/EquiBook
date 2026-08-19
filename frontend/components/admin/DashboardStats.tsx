"use client";

import { useEffect, useState } from "react";

interface DashboardStatsProps {
  reservationType: "room" | "ride";
}

interface Stats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

export default function DashboardStats({
  reservationType,
}: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  const fetchStats = async () => {
    if (reservationType !== "room") {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/room-stats`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics.");
      }

      const data: Stats = await response.json();

      setStats(data);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      setError("Unable to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
}, [reservationType]);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

      {/* Total Bookings */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Total Bookings
        </p>

        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {loading ? "..." : stats.total}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Room bookings
        </p>
      </div>

      {/* Approved */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Approved
        </p>

        <p className="mt-2 text-2xl font-semibold text-green-600">
          {loading ? "..." : stats.approved}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Approved requests
        </p>
      </div>

      {/* Rejected */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Rejected
        </p>

        <p className="mt-2 text-2xl font-semibold text-red-600">
          {loading ? "..." : stats.rejected}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Rejected requests
        </p>
      </div>

      {/* Pending */}
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Pending
        </p>

        <p className="mt-2 text-2xl font-semibold text-yellow-600">
          {loading ? "..." : stats.pending}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Waiting for review
        </p>
      </div>

    </div>
  );
}