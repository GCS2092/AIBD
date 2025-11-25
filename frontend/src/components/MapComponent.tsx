import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  driverLocation?: {
    lat: number;
    lng: number;
    timestamp?: string;
  };
  pickupLocation?: {
    lat: number;
    lng: number;
  };
  dropoffLocation?: {
    lat: number;
    lng: number;
  };
}

function MapComponent({ driverLocation, pickupLocation, dropoffLocation }: MapComponentProps) {
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (mapRef.current && driverLocation) {
      mapRef.current.setView([driverLocation.lat, driverLocation.lng], 13);
    }
  }, [driverLocation]);

  const center = driverLocation || pickupLocation || { lat: 14.7167, lng: -17.4677 }; // Dakar par défaut

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
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

      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]}>
          <Popup>Chauffeur</Popup>
        </Marker>
      )}

      {pickupLocation && dropoffLocation && (
        <Polyline
          positions={[
            [pickupLocation.lat, pickupLocation.lng],
            [dropoffLocation.lat, dropoffLocation.lng],
          ]}
          color="blue"
          dashArray="5, 10"
        />
      )}
    </MapContainer>
  );
}

export default MapComponent;

