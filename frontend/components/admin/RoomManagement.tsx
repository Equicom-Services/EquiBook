"use client";

import { useEffect, useState } from "react";
import {
  apiFetch,
  pickErrorMessage,
  getThrownMessage,
} from "@/lib/api";

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

interface SiteOption {
  site_id: number;
  site_name: string;
}

/* Shown in the site filter when no one site is chosen. */
const ALL_SITES = "all";

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [admin, setAdmin] = useState<Admin | null>(null);

  /*
   * Rooms can be managed for any site, not only the admin's own,
   * so every site is listed here: the table is filtered by one of
   * them, and a new room is added to whichever one is chosen.
   */
  const [sites, setSites] = useState<SiteOption[]>([]);

  /* A site_id as a string, or ALL_SITES. Set once the admin loads. */
  const [siteFilter, setSiteFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingRoomId, setUpdatingRoomId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Room queued for deletion, held while the confirmation modal
  // is open. Deleting is permanent, so it never fires straight
  // off the row button.
  const [roomToDelete, setRoomToDelete] =
    useState<Room | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    room_code: "",
    room_name: "",
    capacity: "",
    location: "",
    site_id: "",
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
          pickErrorMessage(
            adminResponse,
            adminData,
            "Unable to load your admin information."
          )
        );
      }

      const currentAdmin: Admin = adminData;

      setAdmin(currentAdmin);

      // --------------------------------------------------------
      // Every site, for the filter and the Add Room form
      //
      // GET /api/sites
      // --------------------------------------------------------

      const sitesResponse = await apiFetch("/api/sites", {
        method: "GET",
        cache: "no-store",
      });

      const sitesData = await sitesResponse.json().catch(() => null);

      if (!sitesResponse.ok) {
        throw new Error(
          pickErrorMessage(
            sitesResponse,
            sitesData,
            "Unable to load sites."
          )
        );
      }

      setSites(sitesData);

      // --------------------------------------------------------
      // Rooms. The admin's own site is where they usually work,
      // so that is what the table opens on.
      // --------------------------------------------------------

      const initialFilter = String(currentAdmin.site_id);

      setSiteFilter(initialFilter);

      await loadRooms(initialFilter);
    } catch (error) {
      setError(
        getThrownMessage(
          error,
          "Unable to load rooms."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Rooms for one site, or for all of them.
   *
   * Throws rather than showing the error itself, so the caller
   * decides whether it belongs in the page or in the modal.
   */
  async function loadRooms(filter: string) {
    const response = await apiFetch(
      filter === ALL_SITES
        ? "/api/rooms"
        : `/api/rooms?site_id=${filter}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        pickErrorMessage(
          response,
          data,
          "Unable to load rooms."
        )
      );
    }

    setRooms(data);
  }

  /*
   * Switching the table to another site.
   */
  async function changeSiteFilter(filter: string) {
    setSiteFilter(filter);
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      await loadRooms(filter);
    } catch (error) {
      setError(
        getThrownMessage(
          error,
          "Unable to load rooms."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * The name to show for a room's site.
   *
   * Sites come from the active list, so a room left behind by a
   * site that was switched off has no name to show.
   */
  function siteNameOf(siteId: number): string {
    return (
      sites.find((site) => site.site_id === siteId)
        ?.site_name ?? "Unknown site"
    );
  }

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
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

      // A new room goes to the admin's own site unless they
      // pick another one.
      site_id: admin ? String(admin.site_id) : "",
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
    const siteId = Number(formData.site_id);

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

    if (!siteId) {
      setError("Please choose the site for this room.");
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
          site_id: siteId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          pickErrorMessage(
            response,
            data,
            "Unable to add room."
          )
        );
      }

      // ------------------------------------------------------
      // Show the new room
      //
      // A room added to a site the table is not showing would
      // otherwise appear for a moment and then be gone on the
      // next load, so the table moves to that site instead.
      // ------------------------------------------------------

      const addedElsewhere =
        siteFilter !== ALL_SITES &&
        siteFilter !== String(data.site_id);

      if (addedElsewhere) {
        setSiteFilter(String(data.site_id));

        await loadRooms(String(data.site_id));
      } else {
        setRooms((prev) => [data, ...prev]);
      }

      setSuccess(
        `Room "${data.room_name}" was added to ` +
          `${siteNameOf(data.site_id)}.`
      );

      closeModal();
    } catch (error) {
      setError(
        getThrownMessage(
          error,
          "Unable to add room."
        )
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
          pickErrorMessage(
            response,
            data,
            "Unable to update room status."
          )
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
      setError(
        getThrownMessage(
          error,
          "Unable to update room status."
        )
      );
    } finally {
      setUpdatingRoomId(null);
    }
  }

  // ==========================================================
  // DELETE ROOM
  //
  // The backend refuses to delete a room that has reservations
  // on record, so its 409 message is what the admin sees when
  // disabling is the right move instead.
  // ==========================================================

  async function deleteRoom() {
    if (!roomToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      // --------------------------------------------------------
      // DELETE /api/rooms/{room_id}
      // --------------------------------------------------------

      const response = await apiFetch(
        `/api/rooms/${roomToDelete.room_id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          pickErrorMessage(
            response,
            data,
            "Unable to delete room."
          )
        );
      }

      setRooms((prev) =>
        prev.filter(
          (room) =>
            room.room_id !== roomToDelete.room_id
        )
      );

      setSuccess(
        data?.message ??
          `Room "${roomToDelete.room_name}" has been deleted.`
      );

      setRoomToDelete(null);
    } catch (error) {
      setError(
        getThrownMessage(
          error,
          "Unable to delete room."
        )
      );

      setRoomToDelete(null);
    } finally {
      setDeleting(false);
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
            Manage meeting rooms for any site, not only your own.
          </p>

          {admin && (
            <p className="mt-1 text-xs font-medium text-[#03045e]">
              Your site: {admin.site_name}
            </p>
          )}
        </div>

        <div className="flex items-end gap-3">

          {/* Which site's rooms the table is showing */}

          <div>
            <label
              htmlFor="room-site-filter"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              Site
            </label>

            <select
              id="room-site-filter"
              value={siteFilter}
              onChange={(e) =>
                changeSiteFilter(e.target.value)
              }
              disabled={!admin || sites.length === 0}
              className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e] disabled:bg-slate-50"
            >
              {/* Only until the admin's own site is known. */}
              {siteFilter === "" && (
                <option value="">Loading sites...</option>
              )}

              <option value={ALL_SITES}>
                All sites
              </option>

              {sites.map((site) => (
                <option
                  key={site.site_id}
                  value={String(site.site_id)}
                >
                  {site.site_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              resetForm();
              setIsModalOpen(true);
            }}
            disabled={!admin || loading}
            className="rounded-md bg-[#03045e] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Room
          </button>
        </div>
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
                {siteFilter === ALL_SITES
                  ? "No rooms have been set up yet."
                  : `No rooms found for ${siteNameOf(
                      Number(siteFilter)
                    )}.`}
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
                    {siteNameOf(room.site_id)}
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

                    <div className="flex items-center gap-3">

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

                      <button
                        type="button"
                        disabled={updating || deleting}
                        onClick={() =>
                          setRoomToDelete(room)
                        }
                        className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>

                    </div>

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
                  Add a meeting room to any site.
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

            {/* Site the room belongs to */}

            <div className="mt-5">

              <label
                htmlFor="room-site"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Site
              </label>

              <select
                id="room-site"
                name="site_id"
                value={formData.site_id}
                onChange={handleChange}
                required
                disabled={submitting || sites.length === 0}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20 disabled:bg-slate-50"
              >
                <option value="">
                  {sites.length === 0
                    ? "Loading sites..."
                    : "Select site"}
                </option>

                {sites.map((site) => (
                  <option
                    key={site.site_id}
                    value={String(site.site_id)}
                  >
                    {site.site_name}
                  </option>
                ))}
              </select>

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

      {/* ======================================================
          DELETE ROOM CONFIRMATION
      ====================================================== */}

      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-2xl">

            <h3 className="text-lg font-semibold text-slate-900">
              Delete room
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              This permanently removes{" "}
              <span className="font-medium text-slate-700">
                {roomToDelete.room_name}
              </span>{" "}
              ({roomToDelete.room_code}) from{" "}
              {siteNameOf(roomToDelete.site_id)}. A room that
              already has reservations can&apos;t be deleted —
              disable it instead.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                disabled={deleting}
                className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteRoom}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Room"}
              </button>

            </div>

          </div>
        </div>
      )}
    </section>
  );
}