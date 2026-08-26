"use client";

import { useEffect, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  Ban,
} from "lucide-react";

interface DashboardStatsProps {
  reservationType: "room" | "ride";
  refreshTrigger?: number;
}

interface Stats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  cancelled: number;
}

export default function DashboardStats({
  reservationType,
  refreshTrigger = 0,
}: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    cancelled: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const endpoint =
          reservationType === "room"
            ? "/api/dashboard/room-stats"
            : "/api/dashboard/ride-stats";

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(
            `Failed to fetch dashboard statistics. Status: ${response.status}`
          );
        }

        const data: Stats = JSON.parse(responseText);

        setStats(data);
      } catch (error) {
        console.error("Dashboard stats error:", error);

        setError("Unable to load statistics.");

        setStats({
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          cancelled: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [reservationType, refreshTrigger]);

  const reservationLabel =
    reservationType === "room" ? "Room" : "Ride";

  const cards = [
    {
      title: "Total Bookings",
      value: stats.total,
      description: `${reservationLabel} bookings`,
      icon: CalendarDays,
      iconClass: "text-[#03045e]",
      iconBg: "bg-blue-50",
      valueClass: "text-slate-900",
    },
    {
      title: "Approved",
      value: stats.approved,
      description: "Approved requests",
      icon: CheckCircle2,
      iconClass: "text-green-600",
      iconBg: "bg-green-50",
      valueClass: "text-green-600",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      description: "Rejected requests",
      icon: XCircle,
      iconClass: "text-red-600",
      iconBg: "bg-red-50",
      valueClass: "text-red-600",
    },
    {
      title: "Pending",
      value: stats.pending,
      description: "Waiting for review",
      icon: Clock3,
      iconClass: "text-yellow-600",
      iconBg: "bg-yellow-50",
      valueClass: "text-yellow-600",
    },
    {
      title: "Cancelled",
      value: stats.cancelled,
      description: "Cancelled bookings",
      icon: Ban,
      iconClass: "text-slate-500",
      iconBg: "bg-slate-100",
      valueClass: "text-slate-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-md border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p
                  className={`mt-2 text-2xl font-semibold ${card.valueClass}`}
                >
                  {loading ? "..." : card.value}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
              >
                <Icon
                  size={20}
                  strokeWidth={2}
                  className={card.iconClass}
                />
              </div>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}