"use client";

import React, { useState } from 'react';
import { Challenge, Wheel, updateWheelChallenges } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Wand2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateChallengeIdeas } from '@/ai/flows/generate-challenge-ideas';
import { useToast } from '@/hooks/use-toast';

interface ChallengeManagerProps {
  activeWheel: Wheel;
}

export const ChallengeManager: React.FC<ChallengeManagerProps> = ({ activeWheel }) => {
  const [newChallenge, setNewChallenge] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!newChallenge.trim()) return;
    const updatedChallenges = [
      ...activeWheel.challenges,
      { id: Math.random().toString(36).substr(2, 9), text: newChallenge.trim() }
    ];
    await updateWheelChallenges(activeWheel.id, updatedChallenges);
    setNewChallenge('');
  };

  const handleRemove = async (id: string) => {
    const updatedChallenges = activeWheel.challenges.filter(c => c.id !== id);
    await updateWheelChallenges(activeWheel.id, updatedChallenges);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const theme = activeWheel.name || "party games";
      const result = await generateChallengeIdeas({ theme });
      if (result.ideas && result.ideas.length > 0) {
        const newIdeas = result.ideas.map(idea => ({
          id: Math.random().toString(36).substr(2, 9),
          text: idea
        }));
        await updateWheelChallenges(activeWheel.id, [...activeWheel.challenges, ...newIdeas]);
        toast({
          title: "AI Ideas Generated",
          description: `Added ${result.ideas.length} new challenges inspired by "${theme}".`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate ideas right now.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Challenges</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            AI Ideas
          </Button>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Add new challenge..." 
            value={newChallenge} 
            onChange={(e) => setNewChallenge(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-white border-primary/20 focus:border-primary"
          />
          <Button onClick={handleAdd} className="bg-primary text-white shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
        {activeWheel.challenges.map((challenge) => (
          <div 
            key={challenge.id}
            className="group flex items-center justify-between p-3 bg-white rounded-xl border border-primary/5 hover:border-primary/20 transition-all shadow-sm"
          >
            <span className="text-sm font-medium">{challenge.text}</span>
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
        {activeWheel.challenges.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-primary/10 rounded-2xl bg-white/50">
            <p className="text-sm text-muted-foreground italic">
              Empty wheel. Add some challenges!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};