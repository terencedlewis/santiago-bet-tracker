"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  mobile?: boolean;
}

export function LogoutButton({ mobile = false }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size={mobile ? "sm" : "default"}
      className={mobile ? "w-full justify-start" : ""}
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
}
