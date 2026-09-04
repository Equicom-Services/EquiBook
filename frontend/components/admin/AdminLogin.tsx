'use client';

import { Lock, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {loginAdmin} from "@/services/auth"
import { getThrownMessage } from "@/lib/api";

export default function AdminLogin() {

    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


async function handleSubmit(
  e: React.FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    const result = await loginAdmin(email, password);

    // Store JWT
    localStorage.setItem(
      "access_token",
      result.access_token
    );

    // Login successful
    router.push("/admin/dashboard");

  } catch (error) {
    setError(
      getThrownMessage(
        error,
        "We could not sign you in. Please try again."
      )
    );
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-sm p-8">
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-900">Hi Admin</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your credentials provided.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/*  Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@equiservices.com"
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                required
              />
            </div>
          </div>
            {/* Error */}
            {error && (
                <p className="text-sm text-red-500">
                    {error}
                </p>
            )}    
        
{/* Submit */}
<button
  type="submit"
  disabled={loading}
  className="w-full mt-2 bg-[#03045e] hover:bg-[#02034b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors duration-150 ease-in-out shadow-sm"
>
  {loading ? "Signing In..." : "Sign In"}
</button>

<p className="text-center text-xs text-slate-500 mt-4">
  Contact DIO's for account access.
</p>
        </form>
      </div>
    </div>
  );
}
