"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Room {
  room_id: number;
  room_code: string;
  room_name: string;
  capacity: number;
  location: string | null;
  is_active: boolean;
  site_id: number;
}

interface Admin {
  admin_id: number;
  email: string;
  name: string;
  site_id: number;
  site_name: string;
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [admin, setAdmin] = useState<Admin | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingRoomId, setUpdatingRoomId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    room_code: "",
    room_name: "",
    capacity: "",
    location: "",
  });

  // ==========================================================
  // FETCH ADMIN + ROOMS
  // ==========================================================

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------------
      // Get current admin
      // GET /api/admin/me
      // --------------------------------------------------------

      const adminResponse = await apiFetch("/api/admin/me", {
        method: "GET",
        cache: "no-store",
      });

      const adminData = await adminResponse.json().catch(() => null);

      if (!adminResponse.ok) {
        throw new Error(
          adminData?.detail ||
            `Failed to fetch admin information: ${adminResponse.status}`
        );
      }

      const currentAdmin: Admin = adminData;

      setAdmin(currentAdmin);

      // --------------------------------------------------------
      // Fetch rooms for admin's assigned site
      //
      // GET /api/rooms?site_id={site_id}
      // --------------------------------------------------------

      const roomsResponse = await apiFetch(
        `/api/rooms?site_id=${currentAdmin.site_id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const roomsData = await roomsResponse.json().catch(() => null);

      if (!roomsResponse.ok) {
        throw new Error(
          roomsData?.detail ||
            `Failed to fetch rooms: ${roomsResponse.status}`
        );
      }

      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading room management:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load rooms."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ==========================================================
  // RESET FORM
  // ==========================================================

  function resetForm() {
    setFormData({
      room_code: "",
      room_name: "",
      capacity: "",
      location: "",
    });
  }

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  function closeModal() {
    if (submitting) return;

    setIsModalOpen(false);
    resetForm();
  }

  // ==========================================================
  // ADD ROOM
  // ==========================================================

  async function handleAddRoom(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!admin) {
      setError(
        "Unable to determine your assigned site."
      );
      return;
    }

    setError("");
    setSuccess("");

    const roomCode = formData.room_code.trim();
    const roomName = formData.room_name.trim();
    const capacity = Number(formData.capacity);
    const location = formData.location.trim();

    // --------------------------------------------------------
    // Frontend validation
    // --------------------------------------------------------

    if (!roomCode) {
      setError("Room code is required.");
      return;
    }

    if (!roomName) {
      setError("Room name is required.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      setError("Capacity must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);

      // ------------------------------------------------------
      // POST /api/rooms
      //
      // Backend expects:
      //
      // {
      //   room_code: string,
      //   room_name: string,
      //   capacity: number,
      //   location: string | null,
      //   site_id: number
      // }
      // ------------------------------------------------------

      const response = await apiFetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_code: roomCode,
          room_name: roomName,
          capacity,
          location: location || null,
          site_id: admin.site_id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Failed to add room: ${response.status}`
        );
      }

      // ------------------------------------------------------
      // Add returned room to list
      // ------------------------------------------------------

      setRooms((prev) => [data, ...prev]);

      setSuccess(
        `Room "${data.room_name}" was added successfully.`
      );

      closeModal();
    } catch (error) {
      console.error("Error adding room:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to add room."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ==========================================================
  // TOGGLE ROOM STATUS
  // ==========================================================

  async function toggleRoomStatus(
    roomId: number,
    isActive: boolean
  ) {
    try {
      setUpdatingRoomId(roomId);
      setError("");
      setSuccess("");

      // --------------------------------------------------------
      // PATCH /api/rooms/{room_id}/status
      // --------------------------------------------------------

      const response = await apiFetch(
        `/api/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !isActive,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Failed to update room: ${response.status}`
        );
      }

      // --------------------------------------------------------
      // Replace room with backend response
      // --------------------------------------------------------

      setRooms((prev) =>
        prev.map((room) =>
          room.room_id === roomId
            ? data
            : room
        )
      );

      setSuccess(
        `Room "${data.room_name}" is now ${
          data.is_active ? "active" : "inactive"
        }.`
      );
    } catch (error) {
      console.error(
        "Error updating room status:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update room status."
      );
    } finally {
      setUpdatingRoomId(null);
    }
  }

  return (
    <section className="mt-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Room Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage meeting rooms for your assigned site.
          </p>

          {admin && (
            <p className="mt-1 text-xs font-medium text-[#03045e]">
              Site: {admin.site_name}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setSuccess("");
            setIsModalOpen(true);
          }}
          disabled={!admin || loading}
          className="rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Room
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">
            {success}
          </p>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            Loading rooms...
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-white">

          {/* --------------------------------------------------
              TABLE HEADER
          -------------------------------------------------- */}

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

          {/* --------------------------------------------------
              ROOMS
          -------------------------------------------------- */}

          {rooms.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                No rooms found for your site.
              </p>
            </div>
          ) : (
            rooms.map((room) => {

              const updating =
                updatingRoomId === room.room_id;

              return (
                <div
                  key={room.room_id}
                  className="grid grid-cols-4 items-center border-b border-slate-100 px-5 py-4 last:border-b-0"
                >

                  {/* Room */}

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {room.room_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {room.room_code}
                    </p>

                    {room.location && (
                      <p className="mt-1 text-xs text-slate-400">
                        {room.location}
                      </p>
                    )}
                  </div>

                  {/* Site */}

                  <p className="text-sm text-slate-600">
                    {admin?.site_name ?? "Unknown Site"}
                  </p>

                  {/* Capacity */}

                  <p className="text-sm text-slate-600">
                    {room.capacity} people
                  </p>

                  {/* Status */}

                  <div className="flex items-center justify-between gap-4">

                    <span
                      className={
                        room.is_active
                          ? "rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                          : "rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                      }
                    >
                      {room.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        toggleRoomStatus(
                          room.room_id,
                          room.is_active
                        )
                      }
                      className="text-xs font-medium text-[#03045e] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating
                        ? "Updating..."
                        : room.is_active
                        ? "Disable"
                        : "Enable"}
                    </button>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================
          ADD ROOM MODAL
      ====================================================== */}

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
                  Add a meeting room to your assigned site.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="text-xl leading-none text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* Assigned Site */}

            <div className="mt-5">

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Site
              </label>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                {admin?.site_name ?? "Loading site..."}
              </div>

            </div>

            {/* Form */}

            <form
              onSubmit={handleAddRoom}
              className="mt-4 space-y-4"
            >

              {/* Room Code */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Room Code
                </label>

                <input
                  type="text"
                  name="room_code"
                  value={formData.room_code}
                  onChange={handleChange}
                  placeholder="e.g. ROOM-006"
                  required
                  disabled={submitting}
                  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                />

              </div>

              {/* Room Name */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Room Name
                </label>

                <input
                  type="text"
                  name="room_name"
                  value={formData.room_name}
                  onChange={handleChange}
                  placeholder="e.g. Meeting Room 3"
                  required
                  disabled={submitting}
                  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                />

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
                  step="1"
                  required
                  disabled={submitting}
                  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                />

              </div>

              {/* Location */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. 3rd Floor"
                  disabled={submitting}
                  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
                />

              </div>

              {/* Actions */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !admin}
                  className="rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Adding..."
                    : "Add Room"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </section>
  );
}