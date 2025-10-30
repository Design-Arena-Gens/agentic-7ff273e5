"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PhoneArrowUpRightIcon,
  PresentationChartLineIcon,
  SparklesIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

const navItems = [
  {
    href: "/",
    label: "Conversations",
    icon: ChatBubbleOvalLeftEllipsisIcon
  },
  {
    href: "/calls",
    label: "Calls",
    icon: PhoneArrowUpRightIcon
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: PresentationChartLineIcon
  },
  {
    href: "/audience",
    label: "Audience",
    icon: UserGroupIcon
  },
  {
    href: "/automation",
    label: "Automation",
    icon: SparklesIcon
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-950/60 p-6 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">
          A
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Agentic
          </p>
          <p className="text-xs text-slate-500">
            Omni-Channel Automation Suite
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-500/20 text-white"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Status
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300">
            Live
          </span>
          <span className="text-xs text-slate-500">Nova Autopilot</span>
        </div>
      </div>
    </aside>
  );
}
