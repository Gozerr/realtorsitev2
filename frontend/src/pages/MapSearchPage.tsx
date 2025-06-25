import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { List, Card, Spin, Input, Button } from 'antd';
import { Property } from '../types';

// Кастомный маркер (иконка)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const DEFAULT_CENTER = [55.751244, 37.618423]; // Москва
const DEFAULT_ZOOM = 11;

function MapEvents({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    },
    zoomend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    },
  });
  return null;
}

const MapSearchPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [search, setSearch] = useState('');
  const mapRef = useRef<any>(null);

  // Получение объектов по bbox
  const fetchProperties = async (bounds: any) => {
    setLoading(true);
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ].join(',');
    let url = `/api/properties/map?bbox=${bbox}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const data = await res.json();
    setProperties(data);
    setLoading(false);
  };

  // При изменении границ карты
  const handleBoundsChange = (bounds: any) => {
    setMapBounds(bounds);
    fetchProperties(bounds);
  };

  // Первый рендер — получить объекты в дефолтных границах
  useEffect(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      handleBoundsChange(bounds);
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
      {/* Список объектов слева */}
      <div style={{ width: 400, overflowY: 'auto', background: '#fff', borderRight: '1px solid #eee', padding: 16 }}>
        <Input.Search
          placeholder="Поиск по адресу или названию..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onSearch={() => mapBounds && fetchProperties(mapBounds)}
          style={{ marginBottom: 16 }}
        />
        {loading ? <Spin /> : (
          <List
            dataSource={properties}
            renderItem={item => (
              <Card
                key={item.id}
                style={{ marginBottom: 12, cursor: 'pointer', border: selectedId === item.id ? '2px solid #1890ff' : undefined }}
                onClick={() => {
                  setSelectedId(item.id);
                  if (mapRef.current) {
                    mapRef.current.setView([item.lat, item.lng], mapRef.current.getZoom(), { animate: true });
                  }
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ color: '#888', fontSize: 14 }}>{item.address}</div>
                <div style={{ color: '#1890ff', fontWeight: 500 }}>{item.price.toLocaleString()} ₽</div>
              </Card>
            )}
          />
        )}
      </div>
      {/* Карта */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onBoundsChange={handleBoundsChange} />
          {properties.map(item => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              eventHandlers={{
                click: () => setSelectedId(item.id),
              }}
            >
              <Popup>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ color: '#888', fontSize: 14 }}>{item.address}</div>
                <div style={{ color: '#1890ff', fontWeight: 500 }}>{item.price.toLocaleString()} ₽</div>
                <Button type="link" href={`/properties/${item.id}`}>Подробнее</Button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapSearchPage; 