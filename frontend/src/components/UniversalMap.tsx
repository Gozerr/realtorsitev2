import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L, { Map as LeafletMap, LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MarkerClusterGroup } from 'leaflet.markercluster';
import { Property } from '../types';

// Кастомный маркер (иконка)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface UniversalMapProps {
  properties: Property[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: React.CSSProperties;
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 11;

function MapEvents({ onBoundsChange }: { onBoundsChange?: (bounds: L.LatLngBounds) => void }) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      onBoundsChange && onBoundsChange(bounds);
    },
    zoomend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      onBoundsChange && onBoundsChange(bounds);
    },
  });
  return null;
}

export const UniversalMap: React.FC<UniversalMapProps> = ({
  properties,
  selectedId,
  onSelect,
  onBoundsChange,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  style = { height: 400, width: '100%' },
}) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<MarkerClusterGroup | null>(null);

  // Центрируем карту на выбранном объекте
  useEffect(() => {
    if (selectedId && mapRef.current) {
      const selected = properties.find(p => p.id === selectedId && typeof p.lat === 'number' && typeof p.lng === 'number');
      if (selected) {
        mapRef.current.setView([selected.lat as number, selected.lng as number], mapRef.current.getZoom(), { animate: true });
      }
    }
  }, [selectedId, properties]);

  // Кластеризация маркеров
  useEffect(() => {
    if (!mapRef.current) return;
    const markerLayer = markerLayerRef.current;
    if (markerLayer) {
      markerLayer.clearLayers?.();
      if (mapRef.current.hasLayer(markerLayer)) {
        mapRef.current.removeLayer(markerLayer);
      }
    }
    markerLayerRef.current = new MarkerClusterGroup();
    properties.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number').forEach(p => {
      const marker = L.marker([p.lat as number, p.lng as number]);
      marker.on('click', () => onSelect && onSelect(p.id));
      marker.bindPopup(`<b>${p.title}</b><br/>${p.address}<br/><a href='/properties/${p.id}'>Подробнее</a>`);
      markerLayerRef.current!.addLayer(marker);
    });
    const newLayer = markerLayerRef.current;
    if (newLayer) {
      newLayer.addTo(mapRef.current);
    }
  }, [properties, onSelect]);

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      style={style}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
};

export default UniversalMap; 