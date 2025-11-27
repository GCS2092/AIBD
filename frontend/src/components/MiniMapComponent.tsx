import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MiniMapComponentProps {
  pickupLocation?: {
    lat: number;
    lng: number;
  };
  dropoffLocation?: {
    lat: number;
    lng: number;
  };
  height?: string;
  className?: string;
}

function MiniMapComponent({ 
  pickupLocation, 
  dropoffLocation, 
  height = '200px',
  className = ''
}: MiniMapComponentProps) {
  const mapRef = useRef<L.Map>(null);

  // Déterminer le centre de la carte
  const getCenter = (): [number, number] => {
    if (pickupLocation && dropoffLocation) {
      // Centrer entre les deux points
      return [
        (pickupLocation.lat + dropoffLocation.lat) / 2,
        (pickupLocation.lng + dropoffLocation.lng) / 2,
      ];
    }
    if (pickupLocation) {
      return [pickupLocation.lat, pickupLocation.lng];
    }
    if (dropoffLocation) {
      return [dropoffLocation.lat, dropoffLocation.lng];
    }
    // Par défaut: Dakar
    return [14.7167, -17.4677];
  };

  // Calculer le zoom approprié
  const getZoom = (): number => {
    if (pickupLocation && dropoffLocation) {
      // Calculer la distance pour ajuster le zoom
      const latDiff = Math.abs(pickupLocation.lat - dropoffLocation.lat);
      const lngDiff = Math.abs(pickupLocation.lng - dropoffLocation.lng);
      const maxDiff = Math.max(latDiff, lngDiff);
      
      if (maxDiff > 0.1) return 11;
      if (maxDiff > 0.05) return 12;
      if (maxDiff > 0.01) return 13;
      return 14;
    }
    return 13;
  };

  useEffect(() => {
    if (mapRef.current) {
      const center = getCenter();
      const zoom = getZoom();
      mapRef.current.setView(center, zoom);
    }
  }, [pickupLocation, dropoffLocation]);

  // Ne pas afficher la carte si aucune coordonnée n'est disponible
  if (!pickupLocation && !dropoffLocation) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">Carte non disponible</p>
      </div>
    );
  }

  const center = getCenter();
  const zoom = getZoom();

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {pickupLocation && (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
            <Popup>Point de départ</Popup>
          </Marker>
        )}

        {dropoffLocation && (
          <Marker position={[dropoffLocation.lat, dropoffLocation.lng]}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {pickupLocation && dropoffLocation && (
          <Polyline
            positions={[
              [pickupLocation.lat, pickupLocation.lng],
              [dropoffLocation.lat, dropoffLocation.lng],
            ]}
            color="#3b82f6"
            weight={3}
            dashArray="5, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MiniMapComponent;

