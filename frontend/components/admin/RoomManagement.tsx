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

interface Site {
  site_id: number;
  site_name: string;
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

const [formData, setFormData] = useState({
  room_code: "",
  name: "",
  site: "",
  capacity: "",
  location: "",
});

  // ==========================================================
  // FETCH ROOMS + SITES
  // ==========================================================

  useEffect(() => {
const fetchData = async () => {
  try {
    setLoading(true);
    setError("");

    // Get current admin
    const adminResponse = await apiFetch(
      "/api/admin/me",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!adminResponse.ok) {
      throw new Error(
        `Failed to fetch admin information: ${adminResponse.status}`
      );
    }

    const admin = await adminResponse.json();

    // Get all sites
    const sitesResponse = await apiFetch(
      "/api/sites",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!sitesResponse.ok) {
      throw new Error(
        `Failed to fetch sites: ${sitesResponse.status}`
      );
    }

    const sitesData: Site[] =
      await sitesResponse.json();

    setSites(sitesData);

    // Find the admin's site
    const adminSite = sitesData.find(
      (site) =>
        site.site_name.trim().toLowerCase() ===
        admin.site.trim().toLowerCase()
    );

    if (!adminSite) {
      throw new Error(
        `Site "${admin.site}" was not found.`
      );
    }

    // Fetch ONLY rooms belonging to admin's site
    const roomsResponse = await apiFetch(
      `/api/rooms?site_id=${adminSite.site_id}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!roomsResponse.ok) {
      throw new Error(
        `Failed to fetch rooms: ${roomsResponse.status}`
      );
    }

    const roomsData: Room[] =
      await roomsResponse.json();

    setRooms(roomsData);

  } catch (error) {
    console.error(
      "Error loading room management:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to load rooms."
    );
  } finally {
    setLoading(false);
  }
};
    fetchData();
  }, []);

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
  // ADD ROOM
  // ==========================================================

  function handleAddRoom(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    // Backend POST endpoint is not available yet.
    alert(
      "The Add Room API still needs to be added to the backend."
    );
  }

  // ==========================================================
  // TOGGLE ROOM STATUS
  // ==========================================================

  function toggleRoomStatus(
    roomId: number,
    isActive: boolean
  ) {
    // Backend PATCH endpoint is not available yet.
    alert(
      `The ${
        isActive ? "Disable" : "Enable"
      } Room API still needs to be added to the backend.`
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
 
    {/* Error */} 
    {error && ( 
      <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4"> 
        <p className="text-sm text-red-600"> 
          {error} 
        </p> 
      </div> 
    )} 
 
    {/* Loading */} 
    {loading ? ( 
      <div className="mt-5 rounded-md border border-slate-200 bg-white p-8 text-center"> 
        <p className="text-sm text-slate-500"> 
          Loading rooms... 
        </p> 
      </div> 
    ) : ( 
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
        {rooms.length === 0 ? ( 
          <div className="p-8 text-center"> 
            <p className="text-sm text-slate-500"> 
              No rooms found. 
            </p> 
          </div> 
        ) : ( 
          rooms.map((room) => { 
            const site = sites.find( 
              (site) => 
                site.site_id === room.site_id 
            ); 
 
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
                </div> 
 
                {/* Site */} 
                <p className="text-sm text-slate-600"> 
                  {site?.site_name ?? "Unknown Site"} 
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
                    onClick={() => 
                      toggleRoomStatus( 
                        room.room_id, 
                        room.is_active 
                      ) 
                    } 
                    className="text-xs font-medium text-[#03045e] hover:underline" 
                  > 
                    {room.is_active 
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
              onClick={() => 
                setIsModalOpen(false) 
              } 
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
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20" 
              /> 
            </div> 
 
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
 
                {sites.map((site) => ( 
                  <option 
                    key={site.site_id} 
                    value={site.site_id} 
                  > 
                    {site.site_name} 
                  </option> 
                ))} 
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
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#03045e] focus:ring-1 focus:ring-[#03045e]/20" 
              /> 
            </div> 
 
            {/* Actions */} 
            <div className="flex justify-end gap-3 pt-2"> 
 
              <button 
                type="button" 
                onClick={() => 
                  setIsModalOpen(false) 
                } 
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