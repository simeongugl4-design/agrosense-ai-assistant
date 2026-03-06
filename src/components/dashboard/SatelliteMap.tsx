import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Layers, Navigation, ZoomIn, ZoomOut } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const farmIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function LiveLocationTracker({ onLocationUpdate }: { onLocationUpdate?: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(latlng);
        onLocationUpdate?.(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [map, onLocationUpdate]);

  if (!userPos) return null;

  const userIcon = L.divIcon({
    className: "user-location-marker",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <Marker position={userPos} icon={userIcon}>
      <Popup>📍 Your current location</Popup>
    </Marker>
  );
}

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
  const [layer, setLayer] = useState<MapLayer>("satellite");
  const [zoom, setZoom] = useState(13);
  const center: [number, number] = [latitude, longitude];
  const tileConfig = TILE_LAYERS[layer];

  const cycleLayer = () => {
    const layers: MapLayer[] = ["satellite", "street", "terrain"];
    const nextIndex = (layers.indexOf(layer) + 1) % layers.length;
    setLayer(layers[nextIndex]);
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${height}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ background: "#1a1a2e" }}
      >
        <MapController center={center} zoom={zoom} />
        <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} maxZoom={tileConfig.maxZoom} />
        <Marker position={center} icon={farmIcon}>
          <Popup>
            <div className="text-sm font-medium">{locationName || "Selected Location"}</div>
            <div className="text-xs text-gray-500">{latitude.toFixed(4)}°, {longitude.toFixed(4)}°</div>
          </Popup>
        </Marker>
        {showLiveTracking && <LiveLocationTracker />}
      </MapContainer>

      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
          <Button
            size="icon"
            variant="secondary"
            className="w-8 h-8 bg-card/90 backdrop-blur shadow-md"
            onClick={cycleLayer}
            title={`Switch to ${layer === "satellite" ? "street" : layer === "street" ? "terrain" : "satellite"} view`}
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="w-8 h-8 bg-card/90 backdrop-blur shadow-md"
            onClick={() => setZoom((z) => Math.min(z + 2, 19))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="w-8 h-8 bg-card/90 backdrop-blur shadow-md"
            onClick={() => setZoom((z) => Math.max(z - 2, 3))}
          >
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
