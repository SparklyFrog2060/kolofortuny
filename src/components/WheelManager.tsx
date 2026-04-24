"use client";

import React, { useState } from 'react';
import { Wheel, createWheel, deleteWheel } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WheelManagerProps {
  wheels: Wheel[];
  activeWheelId: string | null;
  onSelect: (wheel: Wheel) => void;
}

export const WheelManager: React.FC<WheelManagerProps> = ({ wheels, activeWheelId, onSelect }) => {
  const [newWheelName, setNewWheelName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newWheelName.trim()) return;
    await createWheel(newWheelName);
    setNewWheelName('');
    setIsAdding(false);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Your Wheels</h2>
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
              placeholder="Wheel name..." 
              value={newWheelName} 
              onChange={(e) => setNewWheelName(e.target.value)}
              className="bg-white border-primary/20 focus:border-primary"
            />
            <Button onClick={handleAdd} className="bg-primary text-white">
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
                ? "bg-primary text-white border-primary shadow-md" 
                : "bg-white text-foreground border-transparent hover:border-primary/20 hover:bg-primary/5"
            )}
          >
            <span className="font-medium truncate">{wheel.name}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="icon" 
                variant="ghost" 
                className={cn("h-7 w-7", activeWheelId === wheel.id ? "text-white hover:bg-white/20" : "text-muted-foreground hover:text-destructive")}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWheel(wheel.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {wheels.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-8 italic">
            No wheels yet. Create one to get started!
          </p>
        )}
      </CardContent>
    </Card>
  );
};