"use client";

import { X } from "lucide-react";

import RoomRequestForm from "./room/RoomRequestForm";
import RideRequestForm from "./ride/RideRequestForm";
import {
  BookingPayload,
  BookingRecord,
  BookingType,
  RideBookingRecord,
  RoomBookingRecord,
  getBookingId,
} from "@/lib/bookingAccess";

interface EditBookingModalProps {
  bookingType: BookingType;
  booking: BookingRecord;
  onClose: () => void;

  /*
   * Receives the same body the form would POST to create the
   * booking. Throwing shows the error in the form's dialog.
   */
  onSubmitEdit: (payload: BookingPayload) => Promise<void>;
}

/*
 * Opens the employee's usual booking form, prefilled with an
 * existing booking, so an edit uses the same fields and rules
 * as a new request.
 */
export default function EditBookingModal({
  bookingType,
  booking,
  onClose,
  onSubmitEdit,
}: EditBookingModalProps) {
  const bookingId = getBookingId(bookingType, booking);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-booking-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2
              id="edit-booking-title"
              className="text-xl font-bold text-slate-900"
            >
              Edit Booking #{bookingId}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Saving your changes sends this booking back
              for admin approval.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {bookingType === "room" ? (
            <RoomRequestForm
              selectedDate={
                (booking as RoomBookingRecord)
                  .reservation_date
              }
              editBooking={booking as RoomBookingRecord}
              onSubmitEdit={onSubmitEdit}
            />
          ) : (
            <RideRequestForm
              selectedDate={
                (booking as RideBookingRecord).travel_date
              }
              editBooking={booking as RideBookingRecord}
              onSubmitEdit={onSubmitEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
