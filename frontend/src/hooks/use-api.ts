"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { SESSION_EXPIRED } from "@/lib/errors";
import type { NewServiceRequest, ServiceRequestFilters, StatusChange } from "@/lib/types";

export function useApi() {
  const { token, expire } = useAuth();

  return useMemo(() => {
    async function call<T>(fn: (token: string) => Promise<T>): Promise<T> {
      try {
        return await fn(token ?? "");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          expire(SESSION_EXPIRED);
        }
        throw error;
      }
    }

    return {
      ready: token !== null,
      listServiceRequests: (filters: ServiceRequestFilters = {}) =>
        call((t) => api.listServiceRequests(t, filters)),
      getServiceRequest: (id: string | number) => call((t) => api.getServiceRequest(t, id)),
      createServiceRequest: (input: NewServiceRequest) => call((t) => api.createServiceRequest(t, input)),
      updateServiceRequestStatus: (id: string | number, change: StatusChange) =>
        call((t) => api.updateServiceRequestStatus(t, id, change)),
    };
  }, [token, expire]);
}
