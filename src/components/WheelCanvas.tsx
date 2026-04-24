"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Challenge } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface WheelCanvasProps {
  challenges: Challenge[];
  onResult: (challenge: Challenge) => void;
}

const COLORS = [
  '#A91AE5', // Electric Violet
  '#F81FC6', // Vibrant Fuchsia
  '#8A2BE2', // Blue Violet
  '#DA70D6', // Orchid
  '#9400D3', // Dark Violet
  '#EE82EE', // Violet
  '#FF00FF', // Magenta
];

export const WheelCanvas: React.FC<WheelCanvasProps> = ({ challenges, onResult }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const frameRef = useRef(0);

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

    if (challenges.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText('Add challenges to start', centerX, centerY);
      return;
    }

    const sliceAngle = (2 * Math.PI) / challenges.length;

    challenges.forEach((challenge, i) => {
      const startAngle = i * sliceAngle + rotation;
      const endAngle = (i + 1) * sliceAngle + rotation;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Poppins';
      const text = challenge.text.length > 20 ? challenge.text.substring(0, 18) + '...' : challenge.text;
      ctx.fillText(text, radius - 20, 5);
      ctx.restore();
    });

    // Draw center pin
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#A91AE5';
    ctx.stroke();
  };

  const animate = () => {
    if (velocityRef.current > 0.001) {
      rotationRef.current += velocityRef.current;
      velocityRef.current *= 0.985; // Friction
      draw(rotationRef.current);
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setIsSpinning(false);
      velocityRef.current = 0;
      
      // Calculate result
      const sliceAngle = (2 * Math.PI) / challenges.length;
      const normalizedRotation = (rotationRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      // The pointer is at 0 rad (right side). Result slice is opposite to rotation.
      // Adjusting for common expectation (pointer at top is -PI/2)
      const adjustedRotation = (2 * Math.PI - normalizedRotation) % (2 * Math.PI);
      const winningIndex = Math.floor(adjustedRotation / sliceAngle);
      onResult(challenges[winningIndex]);
    }
  };

  const handleSpin = () => {
    if (isSpinning || challenges.length < 2) return;
    setIsSpinning(true);
    velocityRef.current = Math.random() * 0.5 + 0.3; // Random initial speed
    animate();
  };

  useEffect(() => {
    draw(rotationRef.current);
    return () => cancelAnimationFrame(frameRef.current);
  }, [challenges]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative p-4 bg-white rounded-full shadow-2xl border-4 border-white">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-10 bg-accent clip-path-triangle z-10 shadow-lg" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={400} 
          className="max-w-full h-auto rounded-full"
        />
      </div>
      <Button 
        size="lg" 
        onClick={handleSpin} 
        disabled={isSpinning || challenges.length < 2}
        className="bg-primary hover:bg-primary/90 text-white px-12 py-8 text-2xl font-bold rounded-full shadow-xl transition-all active:scale-95"
      >
        <Play className="mr-2 h-6 w-6 fill-current" />
        SPIN NOW
      </Button>
    </div>
  );
};