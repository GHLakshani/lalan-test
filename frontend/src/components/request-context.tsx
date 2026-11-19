"use client";

import { createContext, useContext } from "react";
import type { ServiceRequest } from "@/lib/types";

type RequestContextValue = {
  request: ServiceRequest | null;
  replace: (request: ServiceRequest) => void;
};

export const RequestContext = createContext<RequestContextValue | null>(null);

export function useServiceRequest() {
  const context = useContext(RequestContext);

  if (!context) {
    throw new Error("useServiceRequest must be used within a service request page");
  }

  return context;
}
