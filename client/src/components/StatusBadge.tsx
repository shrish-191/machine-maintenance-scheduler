import { cn } from "@/lib/utils";

type Status = "Running" | "Stopped" | "Maintenance" | "Pending" | "Completed" | "Overdue";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalizedStatus = status as Status;
  
  const styles: Record<string, string> = {
    Running: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Stopped: "bg-slate-100 text-slate-800 border-slate-200",
    Maintenance: "bg-amber-100 text-amber-800 border-amber-200",
    Pending: "bg-blue-100 text-blue-800 border-blue-200",
    Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Overdue: "bg-red-100 text-red-800 border-red-200",
  };

  const defaultStyle = "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border",
        styles[normalizedStatus] || defaultStyle,
        className
      )}
    >
      {status}
    </span>
  );
}
