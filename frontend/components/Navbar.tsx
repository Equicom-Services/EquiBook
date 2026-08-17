"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bus, User, ShieldCheck, LogOut } from "lucide-react";
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

    setIsLoggedIn(true);

    const fetchAdmin = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch admin");
        }

        const data = await response.json();

        setAdmin(data);
      } catch (error) {
        console.error("Failed to load admin:", error);

        localStorage.removeItem("access_token");
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
    <nav className="w-full bg-white border-b border-slate-100">
      <div className="max-w-1xl mx-auto px-6 py-3.5 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#03045e] flex items-center justify-center text-white shadow-sm">
            <Bus className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-base font-bold text-[#03045e] leading-tight">
              EquiBook
            </h1>

            <p className="text-xs text-slate-400 font-medium">
              Equiserve Booking Platform
            </p>
          </div>
        </div>

        {/* Right Side */}
        {isLoggedIn && admin ? (
          <div className="flex items-center gap-5">

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
              className="flex items-center gap-1.5 rounded-full bg-[#03045e] text-white px-4 py-2 text-xs font-semibold hover:bg-[#02034b] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>

          </div>
        ) : (
          /* Employee / Admin Toggle */
          <div className="flex rounded-full bg-gray-100 p-1 border border-slate-200/50">

            <Link
              href="/employee_page"
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                !isAdmin
                  ? "!bg-[#03045e] !text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <User className="w-3.5 h-3.5" />
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
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Link>

          </div>
        )}
      </div>
    </nav>
  );
}