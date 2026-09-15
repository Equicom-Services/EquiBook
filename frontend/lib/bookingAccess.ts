import {
  getThrownMessage,
  pickErrorMessage,
} from "@/lib/api";

/*
 * Employee self-service access to an existing booking.
 *
 * Employees do not log in, so a booking is unlocked with a
 * one-time code emailed to the requester. Verifying the code
 * returns a short-lived token scoped to that one booking.
 *
 * The token is only ever held in React state, never in
 * storage, and these calls use plain fetch so the admin token
 * that apiFetch attaches is never sent.
 */

export type BookingType = "room" | "ride";

export type BookingAction = "cancel" | "edit";

/*
 * Same shape as the public POST /api/room-requests response.
 */
export interface RoomBookingRecord {
  room_reservation_id: number;
  request_date_time: string;
  room_id: number;
  employee_name: string;
  employee_email: string;

  /* YYYY-MM-DD */
  reservation_date: string;

  /* HH:MM:SS */
  start_time: string;
  end_time: string;

  duration_minutes: number;
  purpose: string;
  status: string;
  admin_remarks: string | null;
  approved_rejected_by: number | null;
  approved_rejected_date_time: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
  room: string;
  site: string;
  site_id: number | null;
}

/*
 * Same shape as the public POST /api/ride-reservations response.
 */
export interface RideBookingRecord {
  ride_reservation_id: number;
  request_date_time: string;
  employee_name: string;
  employee_email: string;
  site_id: number;
  site: string;

  /* YYYY-MM-DD */
  travel_date: string;

  /* HH:MM:SS */
  departure_time: string;

  roundtrip: boolean;

  /* ISO date time, e.g. 2026-09-12T17:30:00 */
  return_pickup: string | null;

  pickup_location: string;
  pickup_maps_link: string | null;
  dropoff_destination: string;
  drop_off_maps_link: string | null;
  return_drop_off_location: string | null;
  return_drop_off_maps_link: string | null;
  purpose: string;
  passenger_count: number;
  vehicle_type: string | null;
  status: string;
  admin_remarks: string | null;
  approved_rejected_by: number | null;
  approved_rejected_date_time: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingRecord =
  | RoomBookingRecord
  | RideBookingRecord;

/*
 * Body RoomRequestForm sends to POST /api/room-requests for a
 * single booking. An edit sends exactly the same body.
 */
export interface RoomRequestPayload {
  room_id: number;
  room_name: string;
  employee_name: string;
  employee_email: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;

  /* The selected site id, as the form holds it. */
  site: string;
}

/*
 * Body RideRequestForm sends to POST /api/ride-reservations for
 * a single booking. An edit sends exactly the same body.
 */
export interface RideReservationPayload {
  employee_name: string;
  employee_email: string;
  site_id: number | null;
  travel_date: string;
  departure_time: string;
  roundtrip: boolean;
  return_pickup: string | null;
  pickup_location: string;
  pickup_maps_link: string | null;
  dropoff_destination: string;
  drop_off_maps_link: string | null;
  return_drop_off_location: string | null;
  return_drop_off_maps_link: string | null;
  purpose: string;
  passenger_count: number;
}

export type BookingPayload =
  | RoomRequestPayload
  | RideReservationPayload;

export interface RequestCodeResponse {
  message: string;
  email_hint: string;
  expires_in_minutes: number;
}

export interface VerifyResponse {
  access_token: string;
  expires_in_minutes: number;
  booking_type: BookingType;
  booking: BookingRecord;
}

export interface BookingChangeResponse {
  message: string;
  booking: BookingRecord;
}

/*
 * A failed call, carrying the HTTP status so the caller can
 * tell a retryable error from one that ends the conversation.
 * A status of 0 means the API could not be reached.
 */
export class BookingAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BookingAccessError";
    this.status = status;
  }
}

/*
 * The shared 401 message tells admins to log in again, which
 * makes no sense to an employee, so expiry is worded here.
 */
export const EXPIRED_MESSAGE =
  "Your verification has expired. Please start over.";

async function send<T>(
  path: string,
  method: "POST" | "PUT",
  body: unknown,
  fallback: string,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${path}`,
      {
        method,
        headers,
        cache: "no-store",
        body: JSON.stringify(body),
      }
    );
  } catch (error) {
    throw new BookingAccessError(
      getThrownMessage(error, fallback),
      0
    );
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    // A non JSON body carries nothing worth showing.
  }

  if (!response.ok) {
    throw new BookingAccessError(
      response.status === 401
        ? EXPIRED_MESSAGE
        : pickErrorMessage(response, payload, fallback),
      response.status
    );
  }

  return payload as T;
}

export function requestAccessCode(
  bookingType: BookingType,
  bookingId: number,
  action: BookingAction
) {
  return send<RequestCodeResponse>(
    "/api/booking-access/request-code",
    "POST",
    {
      booking_type: bookingType,
      booking_id: bookingId,
      action,
    },
    "We could not send a verification code. Please try again."
  );
}

export function verifyAccessCode(
  bookingType: BookingType,
  bookingId: number,
  code: string
) {
  return send<VerifyResponse>(
    "/api/booking-access/verify",
    "POST",
    {
      booking_type: bookingType,
      booking_id: bookingId,
      code,
    },
    "We could not verify that code. Please try again."
  );
}

export function cancelBooking(
  token: string,
  reason: string
) {
  return send<BookingChangeResponse>(
    "/api/booking-access/cancel",
    "POST",
    { reason },
    "We could not cancel your booking. Please try again.",
    token
  );
}

export function updateBooking(
  token: string,
  bookingType: BookingType,
  payload: BookingPayload
) {
  return send<BookingChangeResponse>(
    `/api/booking-access/${bookingType}`,
    "PUT",
    payload,
    "We could not save your changes. Please try again.",
    token
  );
}

/*
 * Accepts "123" or "#123". Returns null for anything else.
 */
export function parseBookingId(
  input: string
): number | null {
  const match = input.trim().match(/^#?\s*(\d{1,10})$/);

  if (!match) {
    return null;
  }

  const id = Number(match[1]);

  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

export function toBookingError(
  error: unknown,
  fallback: string
): BookingAccessError {
  return error instanceof BookingAccessError
    ? error
    : new BookingAccessError(
        getThrownMessage(error, fallback),
        0
      );
}

export function getBookingId(
  bookingType: BookingType,
  booking: BookingRecord
): number {
  return bookingType === "room"
    ? (booking as RoomBookingRecord).room_reservation_id
    : (booking as RideBookingRecord).ride_reservation_id;
}
