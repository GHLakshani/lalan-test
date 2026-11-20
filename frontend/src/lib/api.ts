import type {
  NewServiceRequest,
  Paginated,
  ServiceRequest,
  PermissionOption,
  ServiceRequestFilters,
  StatusChange,
  StatusHistoryEntry,
  User,
  UserFilters,
  UserInput,
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
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
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

function toQuery(filters: Record<string, string | number | null | undefined>) {
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
  return request<{ token: string; token_type: string; user: User }>("/auth/login", {
    method: "POST",
    body: { email, password, device_name: "nextjs" },
  });
}

export function logout(token: string) {
  return request<{ message: string }>("/auth/logout", { method: "POST", token });
}

export async function fetchMe(token: string) {
  const response = await request<{ data: User }>("/auth/me", { token });
  return response.data;
}

export function listServiceRequests(token: string, filters: ServiceRequestFilters = {}) {
  return request<Paginated<ServiceRequest>>(`/requests${toQuery(filters)}`, { token });
}

export async function getServiceRequest(token: string, id: string | number) {
  const response = await request<{ data: ServiceRequest }>(`/requests/${id}`, { token });
  return response.data;
}

export async function createServiceRequest(token: string, input: NewServiceRequest) {
  const response = await request<{ data: ServiceRequest }>("/requests", {
    method: "POST",
    body: input,
    token,
  });
  return response.data;
}

export async function updateServiceRequestStatus(token: string, id: string | number, change: StatusChange) {
  const response = await request<{ data: ServiceRequest }>(`/requests/${id}/status`, {
    method: "PATCH",
    body: change,
    token,
  });
  return response.data;
}

export async function fetchPermissions(token: string) {
  const response = await request<{ data: PermissionOption[] }>("/permissions", { token });
  return response.data;
}

export function listUsers(token: string, filters: UserFilters = {}) {
  return request<Paginated<User>>(`/users${toQuery(filters)}`, { token });
}

export async function getUser(token: string, id: string | number) {
  const response = await request<{ data: User }>(`/users/${id}`, { token });
  return response.data;
}

export async function createUser(token: string, input: UserInput) {
  const response = await request<{ data: User }>("/users", { method: "POST", body: input, token });
  return response.data;
}

export async function updateUser(token: string, id: string | number, input: UserInput) {
  const response = await request<{ data: User }>(`/users/${id}`, { method: "PUT", body: input, token });
  return response.data;
}

export async function deleteUser(token: string, id: string | number) {
  await request<unknown>(`/users/${id}`, { method: "DELETE", token });
}

export async function getServiceRequestHistory(token: string, id: string | number) {
  const response = await request<{ data: StatusHistoryEntry[] }>(`/requests/${id}/history`, { token });
  return response.data;
}
