import { type Goal } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateGoal, useDeleteGoal } from "@/hooks/use-goals";
import { Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface GoalCardProps {
  goal: Goal;
  compact?: boolean;
}

export function GoalCard({ goal, compact = false }: GoalCardProps) {
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const handleToggle = () => {
    updateGoal.mutate({
      id: goal.id,
      isCompleted: !goal.isCompleted,
      completedAt: !goal.isCompleted ? new Date() : null,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteGoal.mutate(goal.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className={cn(
        "group hover:shadow-md transition-all duration-200 border-border/50",
        goal.isCompleted && "bg-muted/30 border-transparent opacity-80"
      )}>
        <CardContent className={cn("flex items-start gap-4", compact ? "p-4" : "p-6")}>
          <div className="pt-1">
            <Checkbox 
              checked={goal.isCompleted || false} 
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start">
              <h4 className={cn(
                "font-semibold text-foreground leading-none",
                goal.isCompleted && "line-through text-muted-foreground"
              )}>
                {goal.title}
              </h4>
              {!compact && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {!compact && goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}

            {goal.targetDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                <span>Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {/* Category Tag */}
            {!compact && (
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {goal.category}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
