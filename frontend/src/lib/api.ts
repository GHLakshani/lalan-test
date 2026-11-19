import type {
  NewServiceRequest,
  Paginated,
  ServiceRequest,
  ServiceRequestFilters,
  StatusChange,
  User,
} from "@/lib/types";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  payload: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
    payload: Record<string, unknown> = {},
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.payload = payload;
  }
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/lalan-test/api").replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, { method = "GET", body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please check that the API is running.", 0);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message ?? "Request failed.", response.status, data.errors ?? {}, data);
  }

  return data as T;
}

function toQuery(filters: ServiceRequestFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export function login(email: string, password: string) {
  return request<{ token: string; token_type: string; user: User }>("/login", {
    method: "POST",
    body: { email, password, device_name: "nextjs" },
  });
}

export function logout(token: string) {
  return request<{ message: string }>("/logout", { method: "POST", token });
}

export async function fetchMe(token: string) {
  const response = await request<{ data: User }>("/me", { token });
  return response.data;
}

export function listServiceRequests(token: string, filters: ServiceRequestFilters = {}) {
  return request<Paginated<ServiceRequest>>(`/service-requests${toQuery(filters)}`, { token });
}

export async function getServiceRequest(token: string, id: string | number) {
  const response = await request<{ data: ServiceRequest }>(`/service-requests/${id}`, { token });
  return response.data;
}

export async function createServiceRequest(token: string, input: NewServiceRequest) {
  const response = await request<{ data: ServiceRequest }>("/service-requests", {
    method: "POST",
    body: input,
    token,
  });
  return response.data;
}

export async function updateServiceRequestStatus(token: string, id: string | number, change: StatusChange) {
  const response = await request<{ data: ServiceRequest }>(`/service-requests/${id}/status`, {
    method: "PATCH",
    body: change,
    token,
  });
  return response.data;
}
