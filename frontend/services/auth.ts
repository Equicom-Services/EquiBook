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
      data.detail || "Invalid email or password"
    );
  }

  return data;
}