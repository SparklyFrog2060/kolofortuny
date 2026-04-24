
"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2, Layers, Maximize2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { kml } from '@tmcw/togeojson';

export const GameMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<maplibregl.LngLatBounds | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Inicjalizacja mapy
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
      center: [21.0122, 52.2297], // Startowo Warszawa, ale zaraz zrobimy fitBounds
      zoom: 12,
      pitch: 45,
      bearing: -17.6
    });

    map.current.on('load', async () => {
      try {
        const response = await fetch('/Chowany.kml');
        if (!response.ok) throw new Error('Nie znaleziono pliku Chowany.kml w folderze /public');
        
        const kmlText = await response.text();
        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(kmlText, 'text/xml');
        const geojson = kml(kmlDom);

        if (geojson.features.length === 0) {
          throw new Error('Plik KML nie zawiera żadnych danych geograficznych.');
        }

        // Dodanie danych do mapy
        map.current?.addSource('game-data', {
          type: 'geojson',
          data: geojson
        });

        // Warstwa linii
        map.current?.addLayer({
          id: 'game-lines',
          type: 'line',
          source: 'game-data',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0ea5e9',
            'line-width': 4,
            'line-opacity': 0.8
          },
          filter: ['==', '$type', 'LineString']
        });

        // Warstwa punktów (jeśli są)
        map.current?.addLayer({
          id: 'game-points',
          type: 'circle',
          source: 'game-data',
          paint: {
            'circle-radius': 6,
            'circle-color': '#f43f5e',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          },
          filter: ['==', '$type', 'Point']
        });

        // Obliczanie granic (bounds) dla automatycznego zoomu
        const currentBounds = new maplibregl.LngLatBounds();
        geojson.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Point') {
            currentBounds.extend(feature.geometry.coordinates);
          } else if (feature.geometry.type === 'LineString') {
            feature.geometry.coordinates.forEach((coord: any) => currentBounds.extend(coord));
          } else if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach((coord: any) => currentBounds.extend(coord));
          }
        });

        if (!currentBounds.isEmpty()) {
          setBounds(currentBounds);
          map.current?.fitBounds(currentBounds, { padding: 50, duration: 2000 });
        }

        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  const resetView = () => {
    if (bounds && map.current) {
      map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card className="relative overflow-hidden bg-card border-border h-[650px] rounded-3xl shadow-2xl border-2">
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-primary font-medium">Wczytywanie danych gry...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-xl font-bold text-destructive mb-2">Błąd mapy</h3>
            <p className="text-muted-foreground max-w-md">{error}</p>
            <p className="text-xs text-muted-foreground mt-4">Upewnij się, że plik <code>Chowany.kml</code> znajduje się w folderze <code>public/</code> projektu.</p>
          </div>
        )}
        
        <div ref={mapContainer} className="w-full h-full" />

        {!error && !loading && (
          <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
            <Button 
              onClick={resetView}
              variant="secondary" 
              className="rounded-full shadow-lg bg-card/90 backdrop-blur hover:bg-card border-border"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Wyśrodkuj na grze
            </Button>
            <div className="bg-card/90 backdrop-blur p-4 rounded-2xl border border-border shadow-lg max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-sm">Dane z KML</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mapa automatycznie wykryła obszar gry. <span className="text-primary">Niebieskie linie</span> to trasy, a <span className="text-destructive">czerwone punkty</span> to cele.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
