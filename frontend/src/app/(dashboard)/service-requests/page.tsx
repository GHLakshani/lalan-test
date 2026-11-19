import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiceRequestList } from "./service-request-list";

export const metadata: Metadata = {
  title: "Service Requests",
};

export default function ServiceRequestsPage() {
  return (
    <Suspense>
      <ServiceRequestList />
    </Suspense>
  );
}
