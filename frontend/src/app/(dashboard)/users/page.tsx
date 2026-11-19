import type { Metadata } from "next";
import { Suspense } from "react";
import { UserList } from "./user-list";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <Suspense>
      <UserList />
    </Suspense>
  );
}
