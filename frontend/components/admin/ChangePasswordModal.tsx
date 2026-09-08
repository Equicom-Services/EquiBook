"use client";

import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { changeAdminPassword } from "@/services/auth";
import { getThrownMessage } from "@/lib/api";

interface ChangePasswordModalProps {
  // Called once the new password has been saved.
  onSuccess: () => void;

  // Shown above the form to explain why the change is required.
  title?: string;
  subtitle?: string;
}

const MIN_LENGTH = 8;

export default function ChangePasswordModal({
  onSuccess,
  title = "Set a new password",
  subtitle = "For your security, please create a new password before continuing.",
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (newPassword.length < MIN_LENGTH) {
      setError(
        `Password must be at least ${MIN_LENGTH} characters long.`
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await changeAdminPassword(newPassword);
      onSuccess();
    } catch (err) {
      setError(
        getThrownMessage(
          err,
          "We could not update your password. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
        {/* Header Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-10 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Must be at least {MIN_LENGTH} characters and
            different from your current password.
          </p>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 ease-in-out hover:bg-[#02034b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
