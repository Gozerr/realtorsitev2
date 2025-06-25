import React, { useEffect, useState, useContext, useRef } from 'react';
import { Row, Col, Input, InputNumber, Select, Button, Typography, Spin, Alert, Tabs } from 'antd';
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L, { Map as LeafletMap } from 'leaflet';
import PropertyCard from '../components/PropertyCard';
import { Property, PropertyStatus } from '../types';
import { getRecentProperties, updatePropertyStatus } from '../services/property.service';
import { AuthContext } from '../context/AuthContext';
import { SearchOutlined, HomeOutlined, AppstoreOutlined, NumberOutlined, ExpandOutlined, HighlightOutlined, CloseCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import 'leaflet-geometryutil';
import UniversalMapYandex from '../components/UniversalMapYandex';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

// Исправление для маркеров leaflet (иначе не отображаются стандартные иконки)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const statusOptions = [
  { value: 'for_sale', label: 'В продаже' },
  { value: 'in_deal', label: 'На задатке' },
  { value: 'reserved', label: 'На брони' },
  { value: 'sold', label: 'Продан' },
];

const poiTypes = [
  { key: 'school', name: 'Школа', icon: '🏫', query: 'amenity=school' },
  { key: 'kindergarten', name: 'Детский сад', icon: '🧸', query: 'amenity=kindergarten' },
  { key: 'shop', name: 'Магазин', icon: '🛒', query: 'shop' },
  { key: 'pharmacy', name: 'Аптека', icon: '💊', query: 'amenity=pharmacy' },
  { key: 'bus_stop', name: 'Остановка', icon: '🚌', query: 'highway=bus_stop' },
];

function fetchPOIs(bounds: any, cb: (elements: any[]) => void, filterKeys: string[]) {
  const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
  const queries = poiTypes.filter(t => filterKeys.includes(t.key)).map(type => `node[${type.query}](${bbox});`);
  if (queries.length === 0) return cb([]);
  const overpassQuery = `[out:json][timeout:15];(${queries.join('')});out body;`;
  fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: overpassQuery,
  })
    .then(res => res.json())
    .then(data => {
      cb(data.elements);
    });
}

const InfrastructureLayer = ({ bounds, filterKeys }: { bounds: any, filterKeys: string[] }) => {
  const [pois, setPois] = React.useState<any[]>([]);
  useEffect(() => {
    if (!bounds) return;
    fetchPOIs(bounds, setPois, filterKeys);
  }, [bounds, filterKeys]);
  return (
    <>
      {pois.map((poi: any, i: number) => {
        const type = poiTypes.find(t => t.key && filterKeys.includes(t.key) && (
          poi.tags && (poi.tags.amenity === t.key || poi.tags.shop === t.key || poi.tags.highway === t.key)
        ));
        if (!type) return null;
        return (
          <Marker key={i} position={[poi.lat, poi.lon]} icon={L.divIcon({ html: `<span style='font-size:22px;'>${type.icon}</span>`, className: '', iconSize: [24, 24] })}>
            <Popup>{type.name}<br/>{poi.tags && poi.tags.name ? poi.tags.name : ''}</Popup>
          </Marker>
        );
      })}
    </>
  );
};

// Проверка попадания точки в полигон (ray-casting)
function pointInPolygon(point: L.LatLng, polygon: L.LatLng[]): boolean {
  let x = point.lng, y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].lng, yi = polygon[i].lat;
    let xj = polygon[j].lng, yj = polygon[j].lat;
    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const PropertiesPage: React.FC = () => {
  const authContext = useContext(AuthContext);
  const isAgent = authContext?.user?.role === 'agent';
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Фильтры
  const [searchText, setSearchText] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [drawnArea, setDrawnArea] = useState<L.LatLng[] | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selectedPOITypes, setSelectedPOITypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [minArea, setMinArea] = useState<number | undefined>();
  const [maxArea, setMaxArea] = useState<number | undefined>();
  const [rooms, setRooms] = useState<number | undefined>();
  const [propertyType, setPropertyType] = useState<string | undefined>();
  const propertyTypeOptions = [
    { value: 'apartment', label: 'Квартира' },
    { value: 'house', label: 'Дом' },
    { value: 'commercial', label: 'Коммерция' },
    { value: 'land', label: 'Участок' },
  ];
  const [drawMode, setDrawMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    getRecentProperties()
      .then(setProperties)
      .catch(() => setError('Не удалось загрузить объекты'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      setMapBounds(mapRef.current.getBounds());
      mapRef.current.on('moveend', () => setMapBounds(mapRef.current!.getBounds()));
    }
  }, [mapRef.current]);

  // Фильтрация
  const activeProperties = properties.filter(p => p.status !== 'sold');
  const archiveProperties = properties.filter(p => p.status === 'sold');
  const filteredProperties = (activeTab === 'active' ? activeProperties : archiveProperties).filter(p => {
    const matchesText =
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.address.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchText.toLowerCase()));
    const matchesMinPrice = minPrice === undefined || p.price >= minPrice;
    const matchesMaxPrice = maxPrice === undefined || p.price <= maxPrice;
    const matchesStatus = !status || p.status === status;
    const matchesMinArea = minArea === undefined || (p.area ?? 0) >= minArea;
    const matchesMaxArea = maxArea === undefined || (p.area ?? 0) <= maxArea;
    const matchesRooms = rooms === undefined || (p.rooms ?? 0) === rooms;
    const matchesType = !propertyType || p.type === propertyType;
    return matchesText && matchesMinPrice && matchesMaxPrice && matchesStatus && matchesMinArea && matchesMaxArea && matchesRooms && matchesType;
  });

  const resetFilters = () => {
    setSearchText('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setStatus(undefined);
    setMinArea(undefined);
    setMaxArea(undefined);
    setRooms(undefined);
    setPropertyType(undefined);
  };

  // Центр карты — если есть объекты, берем первый, иначе дефолт
  const mapCenter: [number, number] =
    filteredProperties.length > 0 && filteredProperties[0].lat && filteredProperties[0].lng
      ? [filteredProperties[0].lat, filteredProperties[0].lng]
      : [57.6261, 39.8845];

  // Обработчик смены статуса (заглушка)
  const handleStatusChange = async (id: number, status: string) => {
    await updatePropertyStatus(id, status);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: status as PropertyStatus } : p));
  };

  const areaFilteredProperties = drawnArea
    ? filteredProperties.filter(p => {
        if (p.lat === undefined || p.lng === undefined) return false;
        const point = L.latLng(p.lat, p.lng);
        const poly = (drawnArea as L.LatLng[]).map((latlng: any) => L.latLng(latlng.lat, latlng.lng));
        return pointInPolygon(point, poly);
      })
    : filteredProperties;

  // Функция для перехода на большую карту с фильтрами
  const handleOpenBigMap = () => {
    const params = new URLSearchParams();
    if (searchText) params.set('search', searchText);
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    if (status) params.set('status', status);
    if (minArea !== undefined) params.set('minArea', String(minArea));
    if (maxArea !== undefined) params.set('maxArea', String(maxArea));
    if (propertyType) params.set('type', propertyType);
    if (rooms !== undefined) params.set('rooms', String(rooms));
    if (activeTab) params.set('tab', activeTab);
    if (selectedPOITypes.length > 0) params.set('poi', selectedPOITypes.join(','));
    navigate(`/map?${params.toString()}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #f8fafc 0%, #e9f0fb 100%)', padding: '32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
        <Title level={2} style={{ marginBottom: 32, fontWeight: 800, letterSpacing: -1 }}>Объекты недвижимости</Title>
        <Button
          type="primary"
          size="large"
          icon={<EnvironmentOutlined />}
          style={{ marginLeft: 24, fontWeight: 600, fontSize: 18, height: 48, borderRadius: 12 }}
          onClick={handleOpenBigMap}
        >
          Открыть большую карту
        </Button>
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'active' | 'archive')}
          style={{ marginBottom: 24 }}
          items={[
            { key: 'active', label: 'Активные объекты' },
            { key: 'archive', label: 'Архив (Продано)' },
          ]}
        />

        {/* Фильтры */}
        <div style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(40,60,90,0.07)',
          padding: 24,
          marginBottom: 32,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #e6eaf1',
          flexDirection: 'row',
          flexFlow: 'row wrap',
          rowGap: 18,
          columnGap: 18,
          minHeight: 80
        }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Поиск по адресу, названию или описанию"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 240, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
            allowClear
          />
          <InputNumber
            prefix={<HomeOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Цена от"
            min={0}
            value={minPrice}
            onChange={value => setMinPrice(value === null ? undefined : value)}
            style={{ width: 120, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            placeholder="Цена до"
            min={0}
            value={maxPrice}
            onChange={value => setMaxPrice(value === null ? undefined : value)}
            style={{ width: 120, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            prefix={<ExpandOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Площадь от"
            min={0}
            value={minArea}
            onChange={value => setMinArea(value === null ? undefined : value)}
            style={{ width: 110, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            placeholder="Площадь до"
            min={0}
            value={maxArea}
            onChange={value => setMaxArea(value === null ? undefined : value)}
            style={{ width: 110, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            prefix={<NumberOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Комнат"
            min={1}
            max={10}
            value={rooms}
            onChange={value => setRooms(value === null ? undefined : value)}
            style={{ width: 90, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <Select
            placeholder="Тип недвижимости"
            allowClear
            value={propertyType}
            onChange={setPropertyType}
            options={propertyTypeOptions}
            style={{ width: 150, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <Select
            placeholder="Статус"
            allowClear
            value={status}
            onChange={setStatus}
            options={[
              { value: 'for_sale', label: 'В продаже' },
              { value: 'in_deal', label: 'На задатке' },
              { value: 'reserved', label: 'На брони' },
              { value: 'sold', label: 'Продан' },
            ]}
            style={{ width: 140, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <Button
            type={drawMode ? 'primary' : 'default'}
            icon={<HighlightOutlined />}
            onClick={() => setDrawMode(true)}
            style={{ borderRadius: 10, fontWeight: 500 }}
            disabled={drawMode}
          >
            Поиск по области
          </Button>
          {drawnArea && (
            <Button
              type="default"
              icon={<CloseCircleOutlined style={{ color: '#d32f2f' }} />}
              onClick={() => { setDrawnArea(null); setDrawMode(false); }}
              style={{ borderRadius: 10, fontWeight: 500 }}
            >
              Сбросить область
            </Button>
          )}
          <Select
            mode="multiple"
            allowClear
            style={{ minWidth: 220 }}
            value={selectedPOITypes}
            onChange={setSelectedPOITypes}
            options={poiTypes.map(t => ({ value: t.key, label: <span>{t.icon} {t.name}</span> }))}
            placeholder="Показать инфраструктуру..."
            maxTagCount={2}
          />
          <Button onClick={resetFilters} style={{ borderRadius: 12, fontWeight: 500, height: 38 }}>Сбросить</Button>
        </div>

        {/* Карта */}
        <div style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(40,60,90,0.07)',
          padding: 0,
          marginBottom: 40,
          overflow: 'hidden',
          border: '1px solid #e6eaf1'
        }}>
          <UniversalMapYandex
            properties={filteredProperties}
            initialCenter={mapCenter}
            initialZoom={12}
            style={{ height: 350, width: '100%', borderRadius: 18 }}
          />
        </div>

        {/* Список объектов */}
        <Spin spinning={loading}>
          {error && <Alert message="Ошибка" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
          <Row gutter={[24, 32]}>
            {areaFilteredProperties.length > 0 ? (
              areaFilteredProperties.map((property, idx) => (
                <Col xs={24} sm={12} md={8} key={property.id}>
                  <div style={{
                    animation: 'fadeInUp 0.6s',
                    animationDelay: `${idx * 0.07}s`,
                    animationFillMode: 'both'
                  }}>
                    <PropertyCard 
                      property={property} 
                      isAgent={isAgent}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                </Col>
              ))
            ) : (
              !loading && <Col span={24}><Alert message="Нет объектов" type="info" /></Col>
            )}
          </Row>
        </Spin>
      </div>
      {/* Анимация */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 40px, 0); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
};

export default PropertiesPage;