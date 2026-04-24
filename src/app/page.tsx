
"use client";

import React, { useEffect, useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
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
import { Sparkles, Settings2, ListTodo, Trophy, Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);
  const [resultChallenge, setResultChallenge] = useState<{ id: string, text: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Automatyczne logowanie anonimowe jeśli nie ma użytkownika
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const wheelsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(getFirestore(), 'users', user.uid, 'wheels'), orderBy('createdAt', 'desc'));
  }, [user]);

  const { data: wheels, isLoading: isWheelsLoading } = useCollection(wheelsQuery);

  const activeWheel = wheels?.find(w => w.id === activeWheelId);

  const handleResult = (challenge: { id: string, text: string }) => {
    setResultChallenge(challenge);
    setShowResult(true);
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F2FE]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-primary font-medium">Łączenie z SpinFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F2FE] text-[#2D1B3D] font-body pb-12">
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
          
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5">
              <WheelManager 
                userId={user.uid}
                wheels={wheels || []} 
                activeWheelId={activeWheelId} 
                onSelect={(w) => setActiveWheelId(w.id)} 
              />
            </div>
          </aside>

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
              {activeWheelId ? (
                <WheelCanvas userId={user.uid} wheelId={activeWheelId} onResult={handleResult} />
              ) : (
                <div className="text-center p-12 bg-white rounded-full shadow-inner border-8 border-dashed border-primary/10">
                  <p className="text-muted-foreground italic">Select or create a wheel to start spinning!</p>
                </div>
              )}
            </div>
          </section>

          <aside className="lg:col-span-3">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/5">
              {activeWheelId ? (
                <ChallengeManager userId={user.uid} wheelId={activeWheelId} wheelName={activeWheel?.name || ""} />
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

// Import dynamiczny firestore dla useMemoFirebase
import { getFirestore } from 'firebase/firestore';
