import { apiFetch, getErrorMessage, pickErrorMessage } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function loginAdmin(
  email: string,
  password: string
) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      pickErrorMessage(
        response,
        data,
        "Invalid email or password."
      )
    );
  }

  return data;
}

/*
 * Set a new password for the signed-in admin.
 *
 * Used for the forced first-login change and the 30-day rotation.
 * Relies on the stored JWT (via apiFetch), so it must run while the
 * admin is authenticated.
 */
export async function changeAdminPassword(
  newPassword: string
) {
  const response = await apiFetch(
    "/api/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        new_password: newPassword,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "We could not update your password. Please try again."
      )
    );
  }

  return response.json();
}