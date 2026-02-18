import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useGoals } from "@/hooks/use-goals";
import { useUserSettings } from "@/hooks/use-user-settings";
import { GoalCard } from "@/components/GoalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, PiggyBank, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const [, setLocation] = useLocation();

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (settings && settings.onboardingCompleted === false) {
      setLocation("/onboarding");
    }
  }, [settings, setLocation]);

  if (goalsLoading || settingsLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <Skeleton className="h-12 w-48" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Layout>
    );
  }

  // Calculate Progress
  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter(g => g.isCompleted).length || 0;
  const progressPercentage = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  // Group goals for display
  const nextGoals = goals?.filter(g => !g.isCompleted).slice(0, 3) || [];
  
  const savingsGoal = settings?.monthlySavingsTarget || 0;
  const currentSavings = settings?.currentSavings || 0;
  const targetDate = settings?.targetPurchaseDate ? new Date(settings.targetPurchaseDate) : null;

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Welcome back, {user?.firstName || 'Homie'}
            </h1>
            <p className="text-muted-foreground mt-2">Here's where you stand on your journey.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary font-medium">
             <AlertCircle className="w-4 h-4" />
             {totalGoals - completedGoals} tasks remaining
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">{progressPercentage}%</div>
                <Progress value={progressPercentage} className="mt-3 h-2" />
                <p className="text-xs text-muted-foreground mt-2">{completedGoals} of {totalGoals} goals completed</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-green-500" /> Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">${currentSavings}</div>
                <p className="text-sm font-medium mt-1 text-green-600">Goal: ${savingsGoal}/mo</p>
                <p className="text-xs text-muted-foreground mt-2">Keep up the good work!</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">
                  {targetDate ? formatDistanceToNow(targetDate, { addSuffix: true }) : 'Not set'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Target purchase date</p>
                {targetDate && <p className="text-sm font-medium mt-1">{targetDate.toLocaleDateString()}</p>}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Up Next Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Up Next</h2>
              <Link href="/checklist" className="text-sm text-primary hover:underline font-medium">View All Tasks</Link>
            </div>
            
            <div className="space-y-4">
              {nextGoals.length > 0 ? (
                nextGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))
              ) : (
                <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed">
                  <p className="text-muted-foreground">All caught up! Check your full checklist.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
             <h2 className="text-xl font-bold">Homie Tools</h2>
             <div className="space-y-3">
               {[
                 { title: "Affordability Calculator", color: "bg-blue-100 text-blue-700" },
                 { title: "Mortgage Rates", color: "bg-green-100 text-green-700" },
                 { title: "Find an Agent", color: "bg-orange-100 text-orange-700" },
               ].map((tool, i) => (
                 <div key={i} className="block group cursor-pointer">
                   <div className="bg-card p-4 rounded-xl shadow-sm border border-border/50 hover:border-primary/50 transition-all flex items-center justify-between">
                      <span className="font-medium">{tool.title}</span>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tool.color}`}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="bg-gradient-to-br from-primary to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-primary/25 mt-8">
               <h3 className="font-bold text-lg mb-2">Need Help?</h3>
               <p className="text-primary-foreground/90 text-sm mb-4">Our resource library has everything you need to know.</p>
               <Link href="/resources">
                 <Button variant="secondary" className="w-full font-semibold text-primary hover:text-primary">
                    Browse Resources
                 </Button>
               </Link>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
