import { Link, useLocation } from "wouter";
import { LayoutDashboard, Wrench, Calendar, FileText, Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/machines", label: "Machines", icon: Wrench },
    { href: "/maintenance", label: "Schedule", icon: Calendar },
    { href: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 shadow-xl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="h-8 w-8 bg-accent rounded flex items-center justify-center">
          <Activity className="h-5 w-5 text-accent-foreground" />
        </div>
        <span className="font-display font-bold text-xl tracking-wider">MAINT.OS</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer group",
                location === item.href
                  ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-1"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", location === item.href ? "text-white" : "text-slate-500 group-hover:text-white")} />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <Settings className="h-5 w-5" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <div className="mt-4 px-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 font-mono">SYSTEM STATUS</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-500">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
