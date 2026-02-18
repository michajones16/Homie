import { Layout } from "@/components/Layout";
import { useGoals } from "@/hooks/use-goals";
import { GoalCard } from "@/components/GoalCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type InsertGoal } from "@shared/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateGoal } from "@/hooks/use-goals";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const categories = ["Credit", "Savings", "Govt Assistance", "Location Research", "Tour Homes", "Other"];

export default function Checklist() {
  const { data: goals, isLoading } = useGoals();
  const [activeCategory, setActiveCategory] = useState("all");

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full md:w-1/2" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  const filteredGoals = activeCategory === "all" 
    ? goals 
    : goals?.filter(g => g.category === activeCategory);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Checklist</h1>
            <p className="text-muted-foreground">Your step-by-step guide to home ownership.</p>
          </div>
          <CreateGoalDialog />
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full flex overflow-x-auto justify-start h-auto p-1 bg-transparent border-b rounded-none mb-6 gap-2">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2 border border-transparent data-[state=active]:border-primary/20"
            >
              All
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2 border border-transparent data-[state=active]:border-primary/20 whitespace-nowrap"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="space-y-4 mt-0">
            {filteredGoals?.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-muted-foreground mb-4">No tasks in this category yet.</p>
                <CreateGoalDialog defaultCategory={activeCategory !== 'all' ? activeCategory : undefined} />
              </div>
            ) : (
              filteredGoals?.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function CreateGoalDialog({ defaultCategory }: { defaultCategory?: string }) {
  const [open, setOpen] = useState(false);
  const createGoal = useCreateGoal();
  const { user } = useAuth();

  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: defaultCategory || "Other",
      userId: user?.id || "", // Will be overwritten by backend anyway usually, but schema requires it
    }
  });

  // Ensure userId is set before submit
  const onSubmit = async (data: InsertGoal) => {
    if (!user?.id) return;
    try {
      await createGoal.mutateAsync({ ...data, userId: user.id });
      setOpen(false);
      form.reset();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} placeholder="e.g. Call mortgage broker" />
          </div>
          
          <div className="space-y-2">
             <Label htmlFor="category">Category</Label>
             <Select 
               onValueChange={(val) => form.setValue("category", val)} 
               defaultValue={defaultCategory || "Other"}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Select category" />
               </SelectTrigger>
               <SelectContent>
                 {categories.map(cat => (
                   <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" {...form.register("description")} placeholder="Add details..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date (Optional)</Label>
            <Input id="targetDate" type="date" {...form.register("targetDate")} />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={createGoal.isPending}>
            {createGoal.isPending ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
