
"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2, Layers, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const GameMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Inicjalizacja mapy 3D
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [21.0122, 52.2297], // Domyślnie Warszawa
      zoom: 14,
      pitch: 45, // Nachylenie 3D
      bearing: -17.6 // Obrót mapy
    });

    map.current.on('load', () => {
      setLoading(false);
      
      // Próba wczytania pliku KML z folderu public
      // Uwaga: Plik musi być w /public/Chowany.kml
      fetch('/Chowany.kml')
        .then(res => {
          if (!res.ok) throw new Error('KML not found');
          return res.text();
        })
        .then(kmlText => {
          console.log('KML wczytany pomyślnie');
          // Tutaj można dodać logikę parsowania KML do GeoJSON i wyświetlenia na mapie
        })
        .catch(() => {
          console.warn('Nie znaleziono pliku /public/Chowany.kml - upewnij enawiguj plik do folderu public.');
        });
    });

    // Kontrolki nawigacji
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  const resetView = () => {
    map.current?.flyTo({
      center: [21.0122, 52.2297],
      zoom: 14,
      pitch: 45,
      bearing: -17.6
    });
  };

  return (
    <div className="w-full space-y-4">
      <Card className="relative overflow-hidden bg-card border-border h-[650px] rounded-3xl shadow-2xl border-2">
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-primary font-medium">Inicjalizacja mapy 3D...</p>
          </div>
        )}
        
        <div ref={mapContainer} className="w-full h-full" />

        {/* Nakładka UI na mapie */}
        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
          <Button 
            onClick={resetView}
            variant="secondary" 
            className="rounded-full shadow-lg bg-card/90 backdrop-blur hover:bg-card border-border"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Resetuj widok
          </Button>
          <div className="bg-card/90 backdrop-blur p-4 rounded-2xl border border-border shadow-lg max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm">Warstwa Terenu</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Widok 3D OpenStreetMap zsynchronizowany z danymi z pliku <code className="text-primary">Chowany.kml</code>. Użyj prawego przycisku myszy, aby obracać widok.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
