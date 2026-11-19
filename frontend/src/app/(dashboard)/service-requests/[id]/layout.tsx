import { Suspense } from "react";
import { RequestShell } from "./request-shell";

export default function ServiceRequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <RequestShell>{children}</RequestShell>
    </Suspense>
  );
}
