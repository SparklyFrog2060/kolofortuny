"use client";

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, orderBy, query } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface ChallengeManagerProps {
  wheelId: string;
}

export const ChallengeManager: React.FC<ChallengeManagerProps> = ({ wheelId }) => {
  const [newChallenge, setNewChallenge] = useState('');
  const db = useFirestore();

  const challengesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'wheels', wheelId, 'challenges'),
      orderBy('createdAt', 'asc')
    );
  }, [db, wheelId]);

  const { data: challenges } = useCollection(challengesQuery);

  const handleAdd = () => {
    if (!newChallenge.trim() || !db) return;
    
    const challengeId = Math.random().toString(36).substr(2, 9);
    const challengeRef = doc(db, 'wheels', wheelId, 'challenges', challengeId);
    
    const now = new Date().toISOString();
    setDocumentNonBlocking(challengeRef, {
      id: challengeId,
      text: newChallenge.trim(),
      wheelId: wheelId,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    setNewChallenge('');
  };

  const handleRemove = (id: string) => {
    if (!db) return;
    const challengeRef = doc(db, 'wheels', wheelId, 'challenges', id);
    deleteDocumentNonBlocking(challengeRef);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <h2 className="text-xl font-bold text-primary mb-4">Wyzwania</h2>
        <div className="flex gap-2">
          <Input 
            placeholder="Wpisz wyzwanie..." 
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
          <p className="text-sm text-muted-foreground text-center py-8 italic">
            Brak wyzwań. Dodaj coś!
          </p>
        )}
      </CardContent>
    </Card>
  );
};