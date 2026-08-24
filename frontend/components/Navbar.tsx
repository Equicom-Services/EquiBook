"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bus,
  User,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  DoorOpen,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Admin {
  id: number;
  email: string;
  name?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const isAdmin = pathname.startsWith("/admin");

  // Check admin authentication
useEffect(() => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    setIsLoggedIn(false);
    setAdmin(null);
    return;
  }

  const fetchAdmin = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`;

      console.log("Fetching admin from:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log("Admin response:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          setIsLoggedIn(false);
          setAdmin(null);
          return;
        }

        throw new Error(`Failed to fetch admin: ${response.status}`);
      }

      const data = await response.json();

      console.log("Admin data:", data);

      setAdmin(data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Failed to load admin:", error);
      setIsLoggedIn(false);
      setAdmin(null);
    }
  };

  fetchAdmin();
}, [pathname]);

  // Update date and time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setIsLoggedIn(false);
    setAdmin(null);

    router.push("/employee_page");
  };

  const formattedDate = currentDateTime.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <nav className="w-full border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-1xl items-center justify-between px-6 py-3.5">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03045e] text-white shadow-sm">
            <Bus className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-base font-bold leading-tight text-[#03045e]">
              EquiBook
            </h1>

            <p className="text-xs font-medium text-slate-400">
              Equiserve Booking Platform
            </p>
          </div>
        </div>

        {/* Logged-in Admin */}
        {isLoggedIn && admin ? (
          <div className="flex items-center gap-5">

            {/* Admin Navigation */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">

              {/* Dashboard */}
              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
                  pathname === "/admin/dashboard"
                    ? "bg-[#03045e] text-white shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>

              {/* Room Management */}
              <Link
                href="/admin/rooms"
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
                  pathname.startsWith("/admin/rooms")
                    ? "bg-[#03045e] text-white shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                }`}
              >
                <DoorOpen className="h-3.5 w-3.5" />
                Room Management
              </Link>

            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200" />

            {/* Admin Information */}
            <div className="text-right">
              <p className="text-sm font-semibold text-[#03045e]">
                {admin.name || admin.email}
              </p>

              <p className="text-xs text-slate-400">
                Administrator
              </p>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200" />

            {/* Date & Time */}
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">
                {formattedDate}
              </p>

              <p className="text-xs text-slate-400">
                {formattedTime}
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full bg-[#03045e] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#02034b]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>

          </div>
        ) : (
          /* Employee / Admin Toggle */
          <div className="flex rounded-full border border-slate-200/50 bg-gray-100 p-1">

            <Link
              href="/employee_page"
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                !isAdmin
                  ? "!bg-[#03045e] !text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Employee
            </Link>

            <Link
              href="/admin/login"
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                isAdmin
                  ? "!bg-[#03045e] !text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>

          </div>
        )}
      </div>
    </nav>
  );
}