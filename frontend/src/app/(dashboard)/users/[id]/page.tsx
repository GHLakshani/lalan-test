import { Suspense } from "react";
import { EditUser } from "./edit-user";

export default function EditUserPage() {
  return (
    <Suspense>
      <EditUser />
    </Suspense>
  );
}
