
"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2, Layers, Maximize2, AlertTriangle, User, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { kml } from '@tmcw/togeojson';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

// Funkcja sprawdzająca czy punkt (lat, lng) znajduje się wewnątrz poligonu (Ray Casting Algorithm)
function isPointInPolygon(point: [number, number], polygon: [number, number][][]) {
  const x = point[0], y = point[1];
  let inside = false;
  
  // Zakładamy, że sprawdzamy zewnętrzny pierścień poligonu
  const coords = polygon[0];
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0], yi = coords[i][1];
    const xj = coords[j][0], yj = coords[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const GameMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<maplibregl.LngLatBounds | null>(null);
  const [gamePolygon, setGamePolygon] = useState<any>(null);
  const [playerName, setPlayerName] = useState(`Gracz ${user?.uid?.slice(-4) || '???'}`);

  // Subskrypcja graczy
  const playersQuery = useMemoFirebase(() => {
    return query(collection(db, 'players'));
  }, [db]);
  const { data: players } = useCollection(playersQuery);

  // Efekt dla lokalizacji użytkownika
  useEffect(() => {
    if (!user || !db) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let isOutside = false;

        if (gamePolygon) {
          // gamePolygon.geometry.coordinates to [ [ [lng, lat], ... ] ]
          isOutside = !isPointInPolygon([longitude, latitude], gamePolygon.geometry.coordinates);
        }

        const playerRef = doc(db, 'players', user.uid);
        setDocumentNonBlocking(playerRef, {
          id: user.uid,
          name: playerName,
          lat: latitude,
          lng: longitude,
          isOutside: isOutside,
          lastSeen: new Date().toISOString()
        }, { merge: true });
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, db, gamePolygon, playerName]);

  // Efekt powiadomień o wyjściu
  const alertedPlayers = useRef<Set<string>>(new Set());
  useEffect(() => {
    players?.forEach(player => {
      if (player.isOutside && !alertedPlayers.current.has(player.id)) {
        toast({
          title: "UWAGA! WYJŚCIE ZE STREFY",
          description: `${player.name} opuścił teren gry!`,
          variant: "destructive"
        });
        alertedPlayers.current.add(player.id);
      } else if (!player.isOutside && alertedPlayers.current.has(player.id)) {
        alertedPlayers.current.delete(player.id);
      }
    });
  }, [players, toast]);

  useEffect(() => {
    if (!mapContainer.current) return;

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
      center: [20.04, 49.94],
      zoom: 14,
      pitch: 45
    });

    map.current.on('load', async () => {
      try {
        const response = await fetch('/Chowany.kml');
        if (!response.ok) throw new Error('Nie znaleziono pliku Chowany.kml w /public');
        
        const kmlText = await response.text();
        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(kmlText, 'text/xml');
        const geojson = kml(kmlDom);

        if (geojson.features.length === 0) throw new Error('KML bez danych.');

        const poly = geojson.features.find((f: any) => f.geometry.type === 'Polygon');
        if (poly) setGamePolygon(poly);

        map.current?.addSource('game-data', { type: 'geojson', data: geojson });
        map.current?.addLayer({
          id: 'game-fill',
          type: 'fill',
          source: 'game-data',
          paint: { 'fill-color': '#0ea5e9', 'fill-opacity': 0.15 },
          filter: ['==', '$type', 'Polygon']
        });
        map.current?.addLayer({
          id: 'game-lines',
          type: 'line',
          source: 'game-data',
          paint: { 'line-color': '#0ea5e9', 'line-width': 4 },
          filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']]
        });

        const currentBounds = new maplibregl.LngLatBounds();
        geojson.features.forEach((f: any) => {
          if (f.geometry.type === 'Point') currentBounds.extend(f.geometry.coordinates);
          else if (f.geometry.type === 'Polygon') f.geometry.coordinates[0].forEach((c: any) => currentBounds.extend(c));
        });

        if (!currentBounds.isEmpty()) {
          setBounds(currentBounds);
          map.current?.fitBounds(currentBounds, { padding: 50 });
        }

        // Warstwa graczy (uproszczone wyświetlanie przez MapLibre)
        map.current?.addSource('players-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });

        map.current?.addLayer({
          id: 'players-circles',
          type: 'circle',
          source: 'players-source',
          paint: {
            'circle-radius': 8,
            'circle-color': ['case', ['get', 'isOutside'], '#ef4444', '#3b82f6'],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    });

    return () => map.current?.remove();
  }, []);

  // Aktualizacja pozycji graczy na mapie
  useEffect(() => {
    if (!map.current || !players || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('players-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: players.map(p => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: { name: p.name, isOutside: p.isOutside }
        }))
      });
    }
  }, [players]);

  const resetView = () => bounds && map.current?.fitBounds(bounds, { padding: 50 });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <User className="text-primary w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Twoja nazwa</p>
            <p className="font-bold text-foreground">{playerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {players?.map(p => (
            <div key={p.id} title={p.name} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${p.isOutside ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-green-500/10 border-green-500 text-green-500'}`}>
              {p.isOutside ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
              {p.name}
            </div>
          ))}
        </div>
      </div>

      <Card className="relative overflow-hidden bg-card border-border h-[600px] rounded-3xl shadow-2xl border-2">
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-primary font-medium">Inicjalizacja GPS i mapy...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-xl font-bold text-destructive mb-2">Błąd mapy</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}
        
        <div ref={mapContainer} className="w-full h-full" />

        {!error && !loading && (
          <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col md:flex-row justify-between gap-4 pointer-events-none">
            <div className="pointer-events-auto">
              <Button 
                onClick={resetView}
                variant="secondary" 
                className="rounded-full shadow-lg bg-card/90 backdrop-blur hover:bg-card border-border border-2"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Powrót do strefy
              </Button>
            </div>
            
            <div className="bg-card/90 backdrop-blur p-4 rounded-2xl border-2 border-border shadow-lg max-w-xs pointer-events-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <h4 className="font-bold text-sm text-primary">System Geofencing</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mapa monitoruje Twoją pozycję względem obszaru <span className="text-primary font-bold">Chowany</span>. Wyjście ze strefy zostanie zgłoszone wszystkim graczom.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
