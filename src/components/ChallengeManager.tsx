"use client";

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Wand2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { generateChallengeIdeas } from '@/ai/flows/generate-challenge-ideas';
import { useToast } from '@/hooks/use-toast';

interface ChallengeManagerProps {
  userId: string;
  wheelId: string;
  wheelName: string;
}

export const ChallengeManager: React.FC<ChallengeManagerProps> = ({ userId, wheelId, wheelName }) => {
  const [newChallenge, setNewChallenge] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const challengesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'users', userId, 'wheels', wheelId, 'challenges');
  }, [db, userId, wheelId]);

  const { data: challenges } = useCollection(challengesQuery);

  const handleAdd = () => {
    if (!newChallenge.trim() || !db) return;
    
    const challengeId = Math.random().toString(36).substr(2, 9);
    const challengeRef = doc(db, 'users', userId, 'wheels', wheelId, 'challenges', challengeId);
    
    const now = new Date().toISOString();
    setDocumentNonBlocking(challengeRef, {
      id: challengeId,
      text: newChallenge.trim(),
      wheelId: wheelId,
      isAI_Generated: false,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    setNewChallenge('');
  };

  const handleRemove = (id: string) => {
    if (!db) return;
    const challengeRef = doc(db, 'users', userId, 'wheels', wheelId, 'challenges', id);
    deleteDocumentNonBlocking(challengeRef);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const theme = wheelName || "gry imprezowe";
      const result = await generateChallengeIdeas({ theme });
      if (result.ideas && result.ideas.length > 0 && db) {
        result.ideas.forEach(idea => {
          const challengeId = Math.random().toString(36).substr(2, 9);
          const challengeRef = doc(db, 'users', userId, 'wheels', wheelId, 'challenges', challengeId);
          const now = new Date().toISOString();
          setDocumentNonBlocking(challengeRef, {
            id: challengeId,
            text: idea,
            wheelId: wheelId,
            isAI_Generated: true,
            createdAt: now,
            updatedAt: now
          }, { merge: true });
        });

        toast({
          title: "Wygenerowano pomysły AI",
          description: `Dodano ${result.ideas.length} nowych wyzwań dla motywu "${theme}".`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Błąd generowania",
        description: "Nie udało się wygenerować pomysłów w tej chwili.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Wyzwania</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Pomysły AI
          </Button>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Dodaj wyzwanie..." 
            value={newChallenge} 
            onChange={(e) => setNewChallenge(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-secondary border-border focus:border-primary text-foreground"
          />
          <Button onClick={handleAdd} className="bg-primary text-primary-foreground shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
        {challenges?.map((challenge) => (
          <div 
            key={challenge.id}
            className="group flex items-center justify-between p-3 bg-secondary rounded-xl border border-border hover:border-primary/20 transition-all shadow-sm"
          >
            <span className="text-sm font-medium text-foreground">{challenge.text}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(challenge.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(!challenges || challenges.length === 0) && (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-card">
            <p className="text-sm text-muted-foreground italic">
              Puste koło. Dodaj wyzwania!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};