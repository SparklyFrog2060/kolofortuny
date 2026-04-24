"use client";

import React, { useEffect, useState } from 'react';
import { subscribeWheels, Wheel, Challenge } from '@/app/lib/store';
import { WheelCanvas } from '@/components/WheelCanvas';
import { WheelManager } from '@/components/WheelManager';
import { ChallengeManager } from '@/components/ChallengeManager';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Settings2, ListTodo, Trophy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Home() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);
  const [resultChallenge, setResultChallenge] = useState<Challenge | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeWheels((fetchedWheels) => {
      setWheels(fetchedWheels);
      if (fetchedWheels.length > 0 && !activeWheelId) {
        setActiveWheelId(fetchedWheels[0].id);
      }
    });
    return () => unsubscribe();
  }, [activeWheelId]);

  const activeWheel = wheels.find(w => w.id === activeWheelId);

  const handleResult = (challenge: Challenge) => {
    setResultChallenge(challenge);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F2FE] text-[#2D1B3D] font-body pb-12">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">SpinFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm font-medium text-muted-foreground">
              Level up your decision making
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Wheel Selection */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5">
              <WheelManager 
                wheels={wheels} 
                activeWheelId={activeWheelId} 
                onSelect={(w) => setActiveWheelId(w.id)} 
              />
            </div>
          </aside>

          {/* Center: The Wheel */}
          <section className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-primary">
                {activeWheel?.name || "Ready to spin?"}
              </h2>
              <p className="text-muted-foreground">
                Click the spin button to let destiny decide.
              </p>
            </div>
            
            <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center">
              {activeWheel ? (
                <WheelCanvas challenges={activeWheel.challenges} onResult={handleResult} />
              ) : (
                <div className="text-center p-12 bg-white rounded-full shadow-inner border-8 border-dashed border-primary/10">
                  <p className="text-muted-foreground italic">Select or create a wheel to start spinning!</p>
                </div>
              )}
            </div>
          </section>

          {/* Right Panel: Challenge Management */}
          <aside className="lg:col-span-3">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5">
              {activeWheel ? (
                <ChallengeManager activeWheel={activeWheel} />
              ) : (
                <div className="text-center py-12">
                   <ListTodo className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                   <p className="text-sm text-muted-foreground">Select a wheel to manage its challenges</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
          <DialogHeader className="pt-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-4 shadow-xl animate-bounce">
              <Trophy className="text-white w-10 h-10" />
            </div>
            <DialogTitle className="text-3xl font-bold text-primary mb-2">We Have a Winner!</DialogTitle>
            <DialogDescription className="text-lg">
              The wheel has spoken...
            </DialogDescription>
          </DialogHeader>
          <div className="my-8 p-8 bg-secondary rounded-2xl text-center border-2 border-primary/10">
            <p className="text-2xl font-bold text-primary break-words">
              {resultChallenge?.text}
            </p>
          </div>
          <DialogFooter className="sm:justify-center pb-6">
            <Button 
              type="button" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full"
              onClick={() => setShowResult(false)}
            >
              AWESOME!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}