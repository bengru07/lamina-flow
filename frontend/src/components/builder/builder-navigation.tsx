"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Workflow,
  LucideIcon,
} from "lucide-react";
import { useAppSelector } from "@/api/appDispatcher";

interface SidebarItem {
  icon: LucideIcon;
  url: string;
  label: string;
}
export default function BuilderNavigation({
  mainItems = [],
  footerItems = [],
}: {
  mainItems?: SidebarItem[];
  footerItems?: SidebarItem[];
}) {
  const pathname = usePathname();

  return (
    <aside className="w-16 bg-white border-r flex flex-col items-center py-4 gap-6 shrink-0 z-10 h-screen">
      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 border border-primary-200 shadow-sm">
        <Workflow size={24} />
      </div>

      <nav className="flex flex-col gap-4">
        {mainItems.map((item) => (
          <ActivityLink
            key={item.url}
            item={item}
            active={pathname === item.url}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {footerItems.map((item) => (
          <ActivityLink
            key={item.url}
            item={item}
            active={pathname === item.url}
          />
        ))}
      </div>
    </aside>
  );
}

function ActivityLink({ item, active }: { item: SidebarItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.url}
      title={item.label}
      className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
        active
          ? "bg-primary-50 text-primary-600 border border-primary-100 shadow-sm"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      }`}
    >
      <Icon size={20} />
    </Link>
  );
}