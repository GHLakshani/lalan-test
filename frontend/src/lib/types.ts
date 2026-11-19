export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Priority = "low" | "medium" | "high" | "urgent";

export type Status = "open" | "in_progress" | "resolved";

export type Option<T extends string> = {
  value: T;
  label: string;
};

export type StatusHistoryEntry = {
  id: number;
  from_status: Option<Status> | null;
  to_status: Option<Status>;
  version: number;
  remark: string | null;
  changed_by: { id: number; name: string } | null;
  created_at: string;
};

export type ServiceRequest = {
  id: number;
  title: string;
  description: string;
  priority: Option<Priority>;
  status: Option<Status>;
  next_status: Option<Status> | null;
  version: number;
  requested_by: { id: number; name: string } | null;
  status_history?: StatusHistoryEntry[];
  created_at: string;
  updated_at: string;
};

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ServiceRequestFilters = {
  search?: string;
  priority?: Priority | "";
  status?: Status | "";
  per_page?: number;
  page?: number;
};

export type NewServiceRequest = {
  title: string;
  description: string;
  priority: Priority | "";
};

export type StatusChange = {
  status: Status;
  version: number;
  remark?: string;
};

export const PRIORITIES: Option<Priority>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const STATUSES: Option<Status>[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export const PAGE_SIZES = [10, 25, 50];
