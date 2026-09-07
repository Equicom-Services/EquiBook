"use client";

import { useEffect, useState } from "react";
import { FileText, X, Download } from "lucide-react";
import {
  getErrorMessage,
  getThrownMessage,
} from "@/lib/api";

interface GenerateReportProps {
  reservationType: "room" | "ride";
}

type ReportStatus =
  | "all"
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled";
type ReportFormat = "csv" | "pdf";

export default function GenerateReport({
  reservationType,
}: GenerateReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportData, setReportData] = useState({
    type: reservationType,
    start_date: "",
    end_date: "",
    status: "all" as ReportStatus,
    format: "pdf" as ReportFormat,
  });

  // Keep report type synchronized with the dashboard toggle
  useEffect(() => {
    setReportData((prev) => ({
      ...prev,
      type: reservationType,
    }));
  }, [reservationType]);

  function handleOpen() {
    setError(null);

    setReportData((prev) => ({
      ...prev,
      type: reservationType,
    }));

    setIsOpen(true);
  }

  function handleClose() {
    if (isGenerating) return;

    setError(null);
    setIsOpen(false);
  }

  async function handleGenerate() {
    setError(null);

    if (!reportData.start_date) {
      setError("Please select a start date.");
      return;
    }

    if (!reportData.end_date) {
      setError("Please select an end date.");
      return;
    }

    if (reportData.start_date > reportData.end_date) {
      setError("Start date cannot be later than the end date.");
      return;
    }

    try {
      setIsGenerating(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("You are not authenticated.");
      }

      const params = new URLSearchParams({
        type: reportData.type,
        start_date: reportData.start_date,
        end_date: reportData.end_date,
        status: reportData.status,
        format: reportData.format,
      });

      const response = await fetch(
        `${apiUrl}/api/admin/reports?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "We could not generate the report. Please try again."
          )
        );
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;

      const typeName =
        reportData.type === "room" ? "room" : "ride";

      const extension =
        reportData.format === "pdf" ? "pdf" : "csv";

      link.download = `${typeName}-booking-report-${reportData.start_date}-to-${reportData.end_date}.${extension}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setIsOpen(false);
    } catch (err) {
      setError(
        getThrownMessage(
          err,
          "We could not generate the report. Please try again."
        )
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      {/* Generate Report Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <FileText className="h-4 w-4" />
        Generate Report
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Generate Report
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the details for your report.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isGenerating}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5 p-6">
              {/* Reservation Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reservation Type
                </label>

                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 text-slate-500" />

                  {reportData.type === "room"
                    ? "Room Requests"
                    : "Ride Requests"}
                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Based on the current reservation toggle.
                </p>
              </div>

              {/* Date Range */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Date Range
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Start Date */}
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={reportData.start_date}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                      disabled={isGenerating}
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      End Date
                    </label>

                    <input
                      type="date"
                      value={reportData.end_date}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          end_date: e.target.value,
                        }))
                      }
                      disabled={isGenerating}
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={reportData.status}
                  onChange={(e) =>
                    setReportData((prev) => ({
                      ...prev,
                      status: e.target.value as ReportStatus,
                    }))
                  }
                  disabled={isGenerating}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                >
                  <option value="all">All Requests</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Report Format */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Report Format
                </label>

                <select
                  value={reportData.format}
                  onChange={(e) =>
                    setReportData((prev) => ({
                      ...prev,
                      format: e.target.value as ReportFormat,
                    }))
                  }
                  disabled={isGenerating}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
                  <p className="text-sm text-red-600">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isGenerating}
                className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}