"use client";

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WheelManagerProps {
  wheels: any[];
  activeWheelId: string | null;
  onSelect: (wheel: any) => void;
}

export const WheelManager: React.FC<WheelManagerProps> = ({ wheels, activeWheelId, onSelect }) => {
  const [newWheelName, setNewWheelName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const db = useFirestore();

  const handleAdd = () => {
    if (!newWheelName.trim() || !db) return;
    
    const wheelId = Math.random().toString(36).substr(2, 9);
    const wheelRef = doc(db, 'wheels', wheelId);
    
    const now = new Date().toISOString();
    setDocumentNonBlocking(wheelRef, {
      id: wheelId,
      name: newWheelName.trim(),
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    setNewWheelName('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    const wheelRef = doc(db, 'wheels', id);
    deleteDocumentNonBlocking(wheelRef);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Wszystkie Koła</h2>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setIsAdding(!isAdding)}
            className="text-primary hover:bg-primary/10"
          >
            {isAdding ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </Button>
        </div>
        {isAdding && (
          <div className="flex gap-2 mb-4 animate-in slide-in-from-top duration-300">
            <Input 
              placeholder="Nazwa koła..." 
              value={newWheelName} 
              onChange={(e) => setNewWheelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="bg-secondary border-border focus:border-primary text-foreground"
            />
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-0 space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {wheels.map((wheel) => (
          <div
            key={wheel.id}
            onClick={() => onSelect(wheel)}
            className={cn(
              "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
              activeWheelId === wheel.id 
                ? "bg-primary text-primary-foreground border-primary shadow-md" 
                : "bg-secondary text-foreground border-border hover:border-primary/20 hover:bg-primary/5"
            )}
          >
            <span className="font-medium truncate">{wheel.name}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className={cn("h-7 w-7 opacity-0 group-hover:opacity-100", activeWheelId === wheel.id ? "text-primary-foreground hover:bg-white/20" : "text-muted-foreground hover:text-destructive")}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(wheel.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};