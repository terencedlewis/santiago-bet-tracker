"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Clock, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/add-bet", label: "Add Bet", icon: PlusCircle },
  { href: "/pending", label: "Pending", icon: Clock },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-gray-200 bg-white">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-400")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
