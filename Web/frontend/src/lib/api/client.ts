export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export async function request<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_BASE_URL}. Start the Spring Boot backend (e.g. mvn spring-boot:run from Web/backend) and check VITE_API_BASE_URL in .env.`,
    );
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 200) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export function withAuth<T>(path: string, body: unknown, token: string) {
  return request<T>(path, body, token);
}
