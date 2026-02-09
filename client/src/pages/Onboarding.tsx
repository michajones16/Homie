import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateUserSettings } from "@/hooks/use-user-settings";
import { useGenerateDefaultGoals } from "@/hooks/use-goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronRight } from "lucide-react";
import { insertUserSettingsSchema } from "@shared/schema";

// Step 1: Savings & Targets
const step1Schema = insertUserSettingsSchema.pick({
  currentSavings: true,
  monthlySavingsTarget: true,
  targetPurchaseDate: true,
});

type Step1Data = z.infer<typeof step1Schema>;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const updateSettings = useUpdateUserSettings();
  const generateGoals = useGenerateDefaultGoals();
  const [loading, setLoading] = useState(false);

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      currentSavings: "0",
      monthlySavingsTarget: "500",
    },
  });

  const onSubmitStep1 = async (data: Step1Data) => {
    setLoading(true);
    try {
      await updateSettings.mutateAsync(data);
      setStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Generate default goals for the user
      await generateGoals.mutateAsync();
      // Mark onboarding as complete
      await updateSettings.mutateAsync({ onboardingCompleted: true });
      setLocation("/dashboard");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-xl shadow-primary/20"
          >
            H
          </motion.div>
          <h1 className="text-3xl font-display font-bold">Welcome to Homie</h1>
          <p className="text-muted-foreground mt-2">Let's personalize your home buying plan.</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                  onSubmit={form.handleSubmit(onSubmitStep1)}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentSavings">Current Savings ($)</Label>
                      <Input 
                        id="currentSavings" 
                        type="number" 
                        {...form.register("currentSavings")} 
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlySavingsTarget">Monthly Savings Goal ($)</Label>
                      <div className="flex items-center gap-4">
                        <Slider 
                          defaultValue={[500]} 
                          max={5000} 
                          step={100}
                          onValueChange={(val) => form.setValue("monthlySavingsTarget", val[0].toString())}
                          className="flex-1"
                        />
                        <span className="font-mono font-bold w-16 text-right">
                          ${form.watch("monthlySavingsTarget")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetPurchaseDate">When do you want to buy?</Label>
                      <Input 
                        id="targetPurchaseDate" 
                        type="date" 
                        {...form.register("targetPurchaseDate")} 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={loading}>
                    Next Step <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                    <Check className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold">You're All Set!</h3>
                  <p className="text-muted-foreground">
                    We've created a custom checklist based on successful home buying strategies. 
                    You can edit your goals anytime.
                  </p>
                  
                  <Button 
                    onClick={handleFinish} 
                    className="w-full h-12 text-lg shadow-lg shadow-primary/20"
                    disabled={loading}
                  >
                    {loading ? "Creating Dashboard..." : "Go to Dashboard"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
