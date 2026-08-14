"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bus, User, ShieldCheck, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setIsLoggedIn(false);

    router.push("/employee_booking_form");
  };

  return (
    <nav className="w-full bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">

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

        {/* Right side */}
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-[#03045e] text-white px-4 py-2 text-xs font-semibold hover:bg-[#02034b] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        ) : (
          /* Employee / Admin Toggle */
          <div className="flex rounded-full bg-gray-100 p-1 border border-slate-200/50">

            <Link
              href="/employee_booking_form"
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