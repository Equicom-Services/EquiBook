"use client";

import { useState } from "react";

interface GenerateReportProps {
  reservationType: "room" | "ride";
}

type ReportStatus = "all" | "pending" | "approved" | "rejected";

export default function GenerateReport({
  reservationType,
}: GenerateReportProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [reportData, setReportData] = useState({
    type: reservationType,
    start_date: "",
    end_date: "",
    status: "all" as ReportStatus,
  });

  function handleGenerate() {
    console.log("Generate report:", reportData);

    // API call will be added later.
    // Example:
    // GET /api/admin/reports?type=room&start_date=...&end_date=...

    setIsOpen(false);
  }

  function handleOpen() {
    setReportData((prev) => ({
      ...prev,
      type: reservationType,
    }));

    setIsOpen(true);
  }

  return (
    <>
      {/* Generate Report Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Generate Report
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">

            {/* Header */}
            <div className="flex items-start justify-between">
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
                onClick={() => setIsOpen(false)}
                className="text-xl leading-none text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div className="mt-6 space-y-4">

              {/* Reservation Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Reservation Type
                </label>

                <select
                  value={reportData.type}
                  onChange={(e) =>
                    setReportData((prev) => ({
                      ...prev,
                      type: e.target.value as "room" | "ride",
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
                >
                  <option value="room">Room Requests</option>
                  <option value="ride">Ride Requests</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date Range
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <input
                    type="date"
                    value={reportData.start_date}
                    onChange={(e) =>
                      setReportData((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
                  />

                  <input
                    type="date"
                    value={reportData.end_date}
                    onChange={(e) =>
                      setReportData((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
                  />

                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Generate Report
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}