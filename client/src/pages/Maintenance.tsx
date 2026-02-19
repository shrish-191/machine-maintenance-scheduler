import { useState } from "react";
import { useMaintenanceRecords, useCreateMaintenance, useCompleteMaintenance } from "@/hooks/use-maintenance";
import { useMachines } from "@/hooks/use-machines";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, CheckCircle, Clock, AlertTriangle, Plus } from "lucide-react";
import { format, isPast, isToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Schemas
const scheduleSchema = z.object({
  machineId: z.coerce.number().min(1, "Select a machine"),
  scheduledDate: z.date({ required_error: "Date is required" }),
  technicianName: z.string().optional(),
  remarks: z.string().optional(),
});

const completeSchema = z.object({
  technicianName: z.string().min(2, "Technician name required"),
  remarks: z.string().optional(),
});

export default function Maintenance() {
  const { data: records, isLoading } = useMaintenanceRecords();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [completeId, setCompleteId] = useState<number | null>(null);

  const upcoming = records?.filter(r => r.status === "Pending" && !isPast(new Date(r.scheduledDate)));
  const overdue = records?.filter(r => r.status === "Pending" && isPast(new Date(r.scheduledDate)) && !isToday(new Date(r.scheduledDate)));
  const completed = records?.filter(r => r.status === "Completed");

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Maintenance Schedule" 
        description="Track upcoming tasks and log completed maintenance."
        action={
          <Button onClick={() => setScheduleOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Schedule Task
          </Button>
        }
      />

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-red-50">Overdue</TabsTrigger>
          <TabsTrigger value="completed">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming?.length === 0 ? (
            <EmptyState message="No upcoming tasks scheduled." />
          ) : (
            upcoming?.map(record => (
              <MaintenanceCard 
                key={record.id} 
                record={record} 
                onComplete={() => setCompleteId(record.id)} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdue?.length === 0 ? (
            <EmptyState message="No overdue tasks! Good job." />
          ) : (
            overdue?.map(record => (
              <MaintenanceCard 
                key={record.id} 
                record={record} 
                isOverdue 
                onComplete={() => setCompleteId(record.id)} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed?.length === 0 ? (
            <EmptyState message="No maintenance history found." />
          ) : (
            completed?.map(record => (
              <MaintenanceCard key={record.id} record={record} isCompleted />
            ))
          )}
        </TabsContent>
      </Tabs>

      <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
      <CompleteDialog open={!!completeId} onOpenChange={(v) => !v && setCompleteId(null)} recordId={completeId} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed">
      <CheckCircle className="h-10 w-10 mb-3 opacity-20" />
      <p>{message}</p>
    </div>
  );
}

function MaintenanceCard({ record, isOverdue, isCompleted, onComplete }: any) {
  return (
    <Card className={cn("transition-all hover:shadow-md border-l-4", 
      isOverdue ? "border-l-red-500 bg-red-50/10" : 
      isCompleted ? "border-l-emerald-500 opacity-80" : "border-l-blue-500"
    )}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-full mt-1", 
            isOverdue ? "bg-red-100 text-red-600" : 
            isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
          )}>
            {isOverdue ? <AlertTriangle className="h-5 w-5" /> : 
             isCompleted ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{record.machineName}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(record.scheduledDate), "MMMM dd, yyyy")}
              </span>
              {record.technicianName && (
                <span className="font-medium text-foreground/80">Tech: {record.technicianName}</span>
              )}
            </div>
            {record.remarks && (
              <p className="text-sm text-muted-foreground mt-2 italic">"{record.remarks}"</p>
            )}
          </div>
        </div>
        
        {!isCompleted && onComplete && (
          <Button onClick={onComplete} variant={isOverdue ? "destructive" : "secondary"} size="sm">
            Complete Task
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const { data: machines } = useMachines();
  const createMutation = useCreateMaintenance();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
  });

  const onSubmit = (data: z.infer<typeof scheduleSchema>) => {
    createMutation.mutate({
      ...data,
      status: "Pending"
    }, {
      onSuccess: () => {
        toast({ title: "Maintenance scheduled" });
        onOpenChange(false);
        form.reset();
      },
      onError: () => toast({ title: "Failed to schedule", variant: "destructive" })
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="machineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {machines?.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Scheduling..." : "Schedule Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CompleteDialog({ open, onOpenChange, recordId }: { open: boolean, onOpenChange: (v: boolean) => void, recordId: number | null }) {
  const completeMutation = useCompleteMaintenance();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof completeSchema>>({
    resolver: zodResolver(completeSchema),
  });

  const onSubmit = (data: z.infer<typeof completeSchema>) => {
    if (!recordId) return;
    completeMutation.mutate({ id: recordId, ...data }, {
      onSuccess: () => {
        toast({ title: "Task completed" });
        onOpenChange(false);
        form.reset();
      },
      onError: () => toast({ title: "Failed to complete", variant: "destructive" })
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Complete Maintenance Task</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="technicianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks / Notes</FormLabel>
                  <FormControl><Textarea placeholder="Maintenance details..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={completeMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {completeMutation.isPending ? "Completing..." : "Mark as Complete"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
