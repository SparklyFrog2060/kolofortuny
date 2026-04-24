"use client";

import React, { useEffect, useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy, getFirestore } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { WheelCanvas } from '@/components/WheelCanvas';
import { WheelManager } from '@/components/WheelManager';
import { ChallengeManager } from '@/components/ChallengeManager';
import { GameMap } from '@/components/GameMap';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Settings2, ListTodo, Trophy, Loader2, Map as MapIcon, Disc } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);
  const [resultChallenge, setResultChallenge] = useState<{ id: string, text: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const wheelsQuery = useMemoFirebase(() => {
    return query(collection(getFirestore(), 'wheels'), orderBy('createdAt', 'desc'));
  }, []);

  const { data: wheels, isLoading: isWheelsLoading } = useCollection(wheelsQuery);

  const activeWheel = wheels?.find(w => w.id === activeWheelId);

  const handleResult = (challenge: { id: string, text: string }) => {
    setResultChallenge(challenge);
    setShowResult(true);
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-primary font-medium">Łączenie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-12">
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-primary-foreground w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">SpinFlow</h1>
          </div>
          <div className="hidden md:block text-sm font-medium text-muted-foreground">
            Wspólne wyzwania w czasie rzeczywistym
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="wheel" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-card border border-border p-1 rounded-2xl">
              <TabsTrigger value="wheel" className="rounded-xl px-6 py-2 flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Disc className="w-4 h-4" />
                Koło Fortuny
              </TabsTrigger>
              <TabsTrigger value="map" className="rounded-xl px-6 py-2 flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapIcon className="w-4 h-4" />
                Mapa Gry
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="wheel" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              <aside className="lg:col-span-3 space-y-6">
                <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
                  <WheelManager 
                    wheels={wheels || []} 
                    activeWheelId={activeWheelId} 
                    onSelect={(w) => setActiveWheelId(w.id)} 
                  />
                </div>
              </aside>

              <section className="lg:col-span-6 flex flex-col items-center">
                <div className="w-full text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2 text-primary">
                    {activeWheel?.name || "Wybierz koło"}
                  </h2>
                  <p className="text-muted-foreground">
                    Wszyscy gracze widzą to samo koło.
                  </p>
                </div>
                
                <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center">
                  {activeWheelId ? (
                    <WheelCanvas wheelId={activeWheelId} onResult={handleResult} />
                  ) : (
                    <div className="text-center p-12 bg-card rounded-full shadow-inner border-8 border-dashed border-primary/10">
                      <p className="text-muted-foreground italic">Wybierz lub stwórz koło z listy obok!</p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="lg:col-span-3">
                <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
                  {activeWheelId ? (
                    <ChallengeManager wheelId={activeWheelId} />
                  ) : (
                    <div className="text-center py-12">
                       <ListTodo className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                       <p className="text-sm text-muted-foreground">Tutaj pojawią się opcje losowania</p>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-primary mb-2">Mapa Gry</h2>
                <p className="text-muted-foreground">Podgląd terenu gry z pliku Chowany.kml</p>
              </div>
              <GameMap />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md bg-card rounded-3xl overflow-hidden border-border shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
          <DialogHeader className="pt-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-4 shadow-xl animate-bounce">
              <Trophy className="text-accent-foreground w-10 h-10" />
            </div>
            <DialogTitle className="text-3xl font-bold text-primary mb-2">Wynik!</DialogTitle>
          </DialogHeader>
          <div className="my-8 p-8 bg-secondary rounded-2xl text-center border-2 border-primary/10">
            <p className="text-2xl font-bold text-primary break-words">
              {resultChallenge?.text}
            </p>
          </div>
          <DialogFooter className="sm:justify-center pb-6">
            <Button 
              type="button" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full"
              onClick={() => setShowResult(false)}
            >
              SUPER!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
