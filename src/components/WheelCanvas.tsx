"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';

interface WheelCanvasProps {
  wheelId: string;
  onResult: (challenge: { id: string, text: string }) => void;
}

const COLORS = [
  '#0ea5e9', '#2563eb', '#4f46e5', '#7c3aed', '#0284c7', '#3b82f6', '#6366f1'
];

export const WheelCanvas: React.FC<WheelCanvasProps> = ({ wheelId, onResult }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const frameRef = useRef(0);
  const db = useFirestore();

  const challengesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'wheels', wheelId, 'challenges'), orderBy('createdAt', 'asc'));
  }, [db, wheelId]);

  const { data: challenges, isLoading } = useCollection(challengesQuery);

  const draw = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    if (!challenges || challenges.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText('Dodaj wyzwania!', centerX, centerY);
      return;
    }

    const sliceAngle = (2 * Math.PI) / challenges.length;

    challenges.forEach((challenge, i) => {
      const startAngle = i * sliceAngle + rotation;
      const endAngle = (i + 1) * sliceAngle + rotation;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff33';
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      // Zwiększona czcionka z 12px na 16px
      ctx.font = 'bold 16px Poppins';
      const text = challenge.text.length > 15 ? challenge.text.substring(0, 13) + '..' : challenge.text;
      // Przesunięcie tekstu lekko od krawędzi, aby pasował do większej czcionki
      ctx.fillText(text, radius - 25, 6);
      ctx.restore();
    });

    // Środek koła
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const animate = () => {
    if (velocityRef.current > 0.001) {
      rotationRef.current += velocityRef.current;
      velocityRef.current *= 0.985;
      draw(rotationRef.current);
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setIsSpinning(false);
      velocityRef.current = 0;
      if (challenges && challenges.length > 0) {
        const sliceAngle = (2 * Math.PI) / challenges.length;
        const normalizedRotation = (rotationRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const adjustedRotation = (2 * Math.PI - normalizedRotation) % (2 * Math.PI);
        const winningIndex = Math.floor(adjustedRotation / sliceAngle);
        onResult(challenges[winningIndex]);
      }
    }
  };

  const handleSpin = () => {
    if (isSpinning || !challenges || challenges.length < 2) return;
    setIsSpinning(true);
    velocityRef.current = Math.random() * 0.4 + 0.3;
    animate();
  };

  useEffect(() => {
    draw(rotationRef.current);
    return () => cancelAnimationFrame(frameRef.current);
  }, [challenges]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative p-4 bg-card rounded-full shadow-2xl border-4 border-border">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-10 bg-accent z-10 shadow-lg" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
        <canvas ref={canvasRef} width={450} height={450} className="max-w-full h-auto rounded-full" />
      </div>
      <Button 
        size="lg" onClick={handleSpin} disabled={isSpinning || !challenges || challenges.length < 2}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-8 text-2xl font-bold rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        {isSpinning ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Play className="mr-2 h-6 w-6 fill-current" />}
        START!
      </Button>
    </div>
  );
};