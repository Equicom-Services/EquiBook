"use client";

import { useState } from "react";

interface Room {
  id: string;
  name: string;
  site: string;
  capacity: number;
  status: "active" | "inactive";
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "1",
      name: "Meeting Room 1",
      site: "Main Office",
      capacity: 10,
      status: "active",
    },
    {
      id: "2",
      name: "Meeting Room 2",
      site: "Main Office",
      capacity: 8,
      status: "active",
    },
    {
      id: "3",
      name: "Conference Room",
      site: "Branch Office",
      capacity: 20,
      status: "active",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    site: "",
    capacity: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAddRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newRoom: Room = {
      id: Date.now().toString(),
      name: formData.name,
      site: formData.site,
      capacity: Number(formData.capacity),
      status: "active",
    };

    setRooms((prev) => [...prev, newRoom]);

    setFormData({
      name: "",
      site: "",
      capacity: "",
    });

    setIsModalOpen(false);
  }

  function toggleRoomStatus(id: string) {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === id
          ? {
              ...room,
              status:
                room.status === "active"
                  ? "inactive"
                  : "active",
            }
          : room
      )
    );
  }

  return (
    <section className="mt-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Room Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage company meeting rooms available for booking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Add Room
        </button>
      </div>

      {/* Room List */}
      <div className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-white">

        {/* Table Header */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs font-medium text-slate-500">
            Room
          </p>

          <p className="text-xs font-medium text-slate-500">
            Site
          </p>

          <p className="text-xs font-medium text-slate-500">
            Capacity
          </p>

          <p className="text-xs font-medium text-slate-500">
            Status
          </p>
        </div>

        {/* Rooms */}
        {rooms.map((room) => (
          <div
            key={room.id}
            className="grid grid-cols-4 items-center border-b border-slate-100 px-5 py-4 last:border-b-0"
          >
            {/* Room */}
            <div>
              <p className="text-sm font-medium text-slate-900">
                {room.name}
              </p>
            </div>

            {/* Site */}
            <p className="text-sm text-slate-600">
              {room.site}
            </p>

            {/* Capacity */}
            <p className="text-sm text-slate-600">
              {room.capacity} people
            </p>

            {/* Status */}
            <div className="flex items-center justify-between gap-4">
              <span
                className={
                  room.status === "active"
                    ? "rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                    : "rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                }
              >
                {room.status.toUpperCase()}
              </span>

              <button
                type="button"
                onClick={() => toggleRoomStatus(room.id)}
                className="text-xs font-medium text-[#03045e] hover:underline"
              >
                {room.status === "active"
                  ? "Disable"
                  : "Enable"}
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">

            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add Room
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add a company meeting room.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xl leading-none text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleAddRoom}
              className="mt-6 space-y-4"
            >

              {/* Room Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Room Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Meeting Room 3"
                  required
                  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
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
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
                >
                  <option value="">
                    Select site
                  </option>

                  <option value="Main Office">
                    Main Office
                  </option>

                  <option value="Branch Office">
                    Branch Office
                  </option>
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Capacity
                </label>

                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Number of people"
                  min="1"
                  required
                  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Add Room
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
}