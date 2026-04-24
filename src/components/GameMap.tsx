"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Globe, MapPin } from 'lucide-react';

export const GameMap: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <Card className="relative overflow-hidden bg-secondary/30 border-dashed border-2 border-primary/20 aspect-video flex flex-col items-center justify-center p-12 text-center group">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/1200/800')] opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30">
            <Globe className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">Podgląd Google Earth</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Wizualizacja terenu gry na podstawie pliku <code className="bg-primary/10 px-2 py-1 rounded text-primary text-sm font-mono">src/Chowany.kml</code>.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
            <div className="p-4 bg-card rounded-2xl border border-border flex items-center gap-3">
              <MapPin className="text-accent w-5 h-5" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status Pliku</p>
                <p className="text-sm font-medium">Chowany.kml wczytany</p>
              </div>
            </div>
            <div className="p-4 bg-card rounded-2xl border border-border flex items-center gap-3">
              <Globe className="text-accent w-5 h-5" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Silnik</p>
                <p className="text-sm font-medium">Google Earth Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 relative z-10">
          <Button variant="outline" className="rounded-full px-8 py-6 border-primary/20 hover:bg-primary/10 text-primary">
            Otwórz w pełnym oknie
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card p-6 rounded-3xl border border-border">
          <h4 className="font-bold text-primary mb-2">Instrukcja mapy</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Plik KML zawiera granice obszaru gry oraz kluczowe punkty orientacyjne. Pamiętaj, aby nie wychodzić poza wyznaczony teren błękitnej strefy.
          </p>
        </Card>
        <Card className="bg-card p-6 rounded-3xl border border-border">
          <h4 className="font-bold text-primary mb-2">Zasady terenu</h4>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
            <li>Baza (Safe Zone) jest oznaczona kolorem zielonym</li>
            <li>Punkty ukrycia są rozmieszczone losowo</li>
            <li>Strefa zakazana (Out of bounds) miga na czerwono</li>
          </ul>
        </Card>
        <Card className="bg-card p-6 rounded-3xl border border-border">
          <h4 className="font-bold text-primary mb-2">Aktualizacja</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mapa jest synchronizowana z Firebase. Zmiany w pliku KML zostaną odświeżone u wszystkich graczy po ponownym wczytaniu zakładki.
          </p>
        </Card>
      </div>
    </div>
  );
};

import { Button } from '@/components/ui/button';
