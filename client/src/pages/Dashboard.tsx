import { useDashboardStats } from "@/hooks/use-stats";
import { useMachines } from "@/hooks/use-machines";
import { useMaintenanceRecords } from "@/hooks/use-maintenance";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Calendar, Wrench, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: machines, isLoading: machinesLoading } = useMachines();
  const { data: upcomingMaintenance, isLoading: maintenanceLoading } = useMaintenanceRecords({ range: "upcoming" });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (statsLoading || machinesLoading || maintenanceLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  // Calculate machine status distribution for chart
  const machineStatusData = [
    { name: "Running", value: machines?.filter(m => m.status === "Running").length || 0, color: "#10b981" },
    { name: "Maintenance", value: machines?.filter(m => m.status === "Maintenance").length || 0, color: "#f59e0b" },
    { name: "Stopped", value: machines?.filter(m => m.status === "Stopped").length || 0, color: "#64748b" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Operations Dashboard" 
        description="Real-time overview of facility performance and maintenance." 
      />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Machines</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{stats?.totalMachines}</div>
              <p className="text-xs text-muted-foreground mt-1">Active assets in database</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">In Maintenance</CardTitle>
              <Activity className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{stats?.machinesInMaintenance}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently being serviced</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-red-600">{stats?.overdueTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{stats?.upcomingTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled for next 7 days</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display tracking-wide text-lg">Machine Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineStatusData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" barSize={32} radius={[0, 4, 4, 0]}>
                    {machineStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Next Up
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2">
              {upcomingMaintenance && upcomingMaintenance.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMaintenance.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{record.machineName}</p>
                        <p className="text-xs text-muted-foreground">Due: {format(new Date(record.scheduledDate), "MMM dd, yyyy")}</p>
                        <StatusBadge status={record.status} className="mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-2 opacity-20" />
                  <p>No upcoming tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
