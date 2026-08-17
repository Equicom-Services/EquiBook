"use client";

import { useEffect, useState } from "react";

interface RoomRequestFormProps {
  selectedDate: string;
}

export default function RoomRequestForm({
  selectedDate,
}: RoomRequestFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    company_email: "",
    site: "",
    room: "",
    date: selectedDate,
    start_time: "",
    end_time: "",
    purpose: "",
  });

  // Keep date synchronized with calendar
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: selectedDate,
    }));
  }, [selectedDate]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    console.log("Room request:", formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Employee Information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Company Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Company Email
          </label>

          <input
            type="email"
            name="company_email"
            value={formData.company_email}
            onChange={handleChange}
            placeholder="name@company.com"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Site */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Site
          </label>

          <select
            name="site"
            value={formData.site}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          >
            <option value="">Select site</option>
            <option value="Main Office">Main Office</option>
            <option value="Branch Office">Branch Office</option>
          </select>
        </div>

        {/* Room */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Room
          </label>

          <select
            name="room"
            value={formData.room}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          >
            <option value="">Select room</option>
            <option value="Meeting Room 1">Meeting Room 1</option>
            <option value="Meeting Room 2">Meeting Room 2</option>
            <option value="Conference Room">Conference Room</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Date
          </label>

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Start Time
          </label>

          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            End Time
          </label>

          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Purpose
        </label>

        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          rows={3}
          placeholder="Enter the purpose of the room reservation"
          required
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full rounded-md bg-[#03045e] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Submit Room Request
      </button>
    </form>
  );
}