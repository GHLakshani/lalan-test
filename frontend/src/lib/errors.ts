import { ApiError } from "@/lib/api";

export const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Unable to reach the server. Check your connection and make sure the API is running.";
    }

    if (error.status === 401) {
      return SESSION_EXPIRED;
    }

    if (error.status === 403) {
      return error.message && error.message !== "This action is unauthorized."
        ? error.message
        : "You do not have permission to perform this action.";
    }

    if (error.status === 404) {
      return "The requested item could not be found.";
    }

    if (error.status === 429) {
      return "Too many attempts. Please wait a minute and try again.";
    }

    if (error.status >= 500) {
      return "The server ran into a problem. Please try again shortly.";
    }

    return error.message || fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export function fieldErrors(error: unknown): Record<string, string[]> {
  return error instanceof ApiError && error.status === 422 ? error.errors : {};
}

export function isStatus(error: unknown, status: number) {
  return error instanceof ApiError && error.status === status;
}
