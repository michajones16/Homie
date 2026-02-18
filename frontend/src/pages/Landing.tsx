import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Shield, Home as HomeIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <header className="absolute top-0 w-full z-10 px-6 py-4 md:px-12 md:py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
              H
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">Homie</span>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
               <Link href="/dashboard">
                <Button variant="outline" className="font-semibold">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="font-semibold px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] mb-6">
              Your path to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                home ownership
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              We guide you through every step of the home buying process. From credit building to closing day, Homie is by your side.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                    Go to Checklist <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                    Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl border-2">
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* Hero Image / Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-[2.5rem] blur-3xl opacity-50" />
            
            {/* Scenic house image from Unsplash */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 aspect-[4/3]">
              {/* home buying scenic landscape */}
              <img 
                src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=900&fit=crop" 
                alt="Beautiful home"
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
              />
              
              {/* Floating Cards */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Step 3 Completed</h4>
                    <p className="text-sm text-gray-600">Credit Score Goal Reached!</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything you need to buy with confidence</h2>
            <p className="text-muted-foreground text-lg">Homie breaks down the complex home buying process into manageable, actionable steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: CheckCircle2, 
                title: "Smart Checklists", 
                desc: "Never miss a step with our tailored task lists for credit, savings, and tours." 
              },
              { 
                icon: Shield, 
                title: "Resource Library", 
                desc: "Expert guides on loans, government assistance programs, and market trends." 
              },
              { 
                icon: HomeIcon, 
                title: "Tour Tracker", 
                desc: "Keep notes and photos of every home you visit in one organized place." 
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background p-8 rounded-2xl shadow-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">H</div>
            <span className="font-display font-bold text-lg">Homie</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 Homie App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
