import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenanceRecords } from "@/hooks/use-maintenance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

export default function Reports() {
  const { data: records, isLoading } = useMaintenanceRecords();

  if (isLoading) return <div>Loading reports...</div>;

  // Process data for charts
  const techPerformance: Record<string, number> = {};
  records?.forEach(r => {
    if (r.status === "Completed" && r.technicianName) {
      techPerformance[r.technicianName] = (techPerformance[r.technicianName] || 0) + 1;
    }
  });

  const techData = Object.entries(techPerformance).map(([name, value]) => ({ name, value }));

  const statusCounts = {
    Completed: records?.filter(r => r.status === "Completed").length || 0,
    Overdue: records?.filter(r => r.status === "Overdue").length || 0,
    Pending: records?.filter(r => r.status === "Pending").length || 0,
  };

  const statusData = [
    { name: "Completed", value: statusCounts.Completed, color: "#10b981" },
    { name: "Overdue", value: statusCounts.Overdue, color: "#ef4444" },
    { name: "Pending", value: statusCounts.Pending, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics Reports" description="Performance metrics and maintenance history analysis." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display tracking-wide text-lg">Tasks by Technician</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display tracking-wide text-lg">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={statusData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
