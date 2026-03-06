import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Layers, ZoomIn, ZoomOut } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type MapLayer = "satellite" | "street" | "terrain";

const TILE_LAYERS: Record<MapLayer, { url: string; attribution: string; maxZoom: number }> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap",
    maxZoom: 17,
  },
};

interface SatelliteMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  height?: string;
  showControls?: boolean;
  showLiveTracking?: boolean;
}

export function SatelliteMap({
  latitude,
  longitude,
  locationName,
  height = "h-56 lg:h-72",
  showControls = true,
  showLiveTracking = true,
}: SatelliteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layer, setLayer] = useState<MapLayer>("satellite");
  const watchRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 13,
      zoomControl: false,
    });

    const tileConfig = TILE_LAYERS[layer];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);

    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(
      `<div style="font-size:13px;font-weight:600">${locationName || "Selected Location"}</div><div style="font-size:11px;color:#666">${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</div>`
    );

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    markerRef.current = marker;

    // Live GPS tracking
    if (showLiveTracking && navigator.geolocation) {
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(latlng);
          } else if (mapRef.current) {
            userMarkerRef.current = L.marker(latlng, { icon: userIcon })
              .addTo(mapRef.current)
              .bindPopup("📍 Your current location");
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }

    // Resize fix
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update center when coordinates change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.setView([latitude, longitude], 13, { animate: true });
    markerRef.current.setLatLng([latitude, longitude]);
    markerRef.current.setPopupContent(
      `<div style="font-size:13px;font-weight:600">${locationName || "Selected Location"}</div><div style="font-size:11px;color:#666">${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</div>`
    );
  }, [latitude, longitude, locationName]);

  // Switch tile layer
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const tileConfig = TILE_LAYERS[layer];
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [layer]);

  const cycleLayer = () => {
    const layers: MapLayer[] = ["satellite", "street", "terrain"];
    setLayer(layers[(layers.indexOf(layer) + 1) % layers.length]);
  };

  const zoomIn = () => mapRef.current?.zoomIn(2);
  const zoomOut = () => mapRef.current?.zoomOut(2);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${height}`}>
      <div ref={containerRef} className="w-full h-full" style={{ background: "#1a1a2e" }} />

      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
          <Button
            size="icon"
            variant="secondary"
            className="w-8 h-8 bg-card/90 backdrop-blur shadow-md"
            onClick={cycleLayer}
            title={`Switch view`}
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" className="w-8 h-8 bg-card/90 backdrop-blur shadow-md" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" className="w-8 h-8 bg-card/90 backdrop-blur shadow-md" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-[1000] px-2 py-1 bg-card/80 backdrop-blur rounded text-[10px] text-muted-foreground">
        {layer === "satellite" ? "🛰️ Satellite" : layer === "terrain" ? "🏔️ Terrain" : "🗺️ Street"} · {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
      </div>
    </div>
  );
}
