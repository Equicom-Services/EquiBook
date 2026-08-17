"use client";

import { useEffect, useState } from "react";

interface RideRequestFormProps {
  selectedDate: string;
}

export default function RideRequestForm({
  selectedDate,
}: RideRequestFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    company_email: "",
    site: "",
    travel_date: selectedDate,
    departure_time: "",
    roundtrip: false,
    return_pickup: "",
    dropoff_destination: "",
    purpose: "",
    passengers_count: 1,
    dropoff_map_link: "",
    pickup_location: "",
    pickup_map_link: "",
  });

  // Keep travel date synchronized with calendar
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      travel_date: selectedDate,
    }));
  }, [selectedDate]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "passengers_count"
            ? Number(value)
            : value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    console.log("Ride request:", formData);
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

        {/* Travel Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Travel Date
          </label>

          <input
            type="date"
            name="travel_date"
            value={formData.travel_date}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Departure Time */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Departure Time
          </label>

          <input
            type="time"
            name="departure_time"
            value={formData.departure_time}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Passengers Count */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Passengers Count
          </label>

          <input
            type="number"
            name="passengers_count"
            value={formData.passengers_count}
            onChange={handleChange}
            min={1}
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>
      </div>

      {/* Roundtrip */}
      <div className="rounded-md border border-slate-200 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="roundtrip"
            checked={formData.roundtrip}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 accent-[#03045e]"
          />

          <span className="text-sm font-medium text-slate-700">
            Roundtrip
          </span>
        </label>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Pickup Location */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Pickup Location
          </label>

          <input
            type="text"
            name="pickup_location"
            value={formData.pickup_location}
            onChange={handleChange}
            placeholder="Enter pickup location"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Dropoff Destination */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Dropoff Destination
          </label>

          <input
            type="text"
            name="dropoff_destination"
            value={formData.dropoff_destination}
            onChange={handleChange}
            placeholder="Enter dropoff destination"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Pickup Map Link */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Pickup Map Link
          </label>

          <input
            type="url"
            name="pickup_map_link"
            value={formData.pickup_map_link}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Dropoff Map Link */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Dropoff Map Link
          </label>

          <input
            type="url"
            name="dropoff_map_link"
            value={formData.dropoff_map_link}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
          />
        </div>

        {/* Return Pickup */}
        {formData.roundtrip && (
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Return Pickup
            </label>

            <input
              type="text"
              name="return_pickup"
              value={formData.return_pickup}
              onChange={handleChange}
              placeholder="Enter return pickup location"
              required={formData.roundtrip}
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
            />
          </div>
        )}
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
          placeholder="Enter the purpose of the ride request"
          required
          className="w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full rounded-md bg-[#03045e] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Submit Ride Request
      </button>
    </form>
  );
}