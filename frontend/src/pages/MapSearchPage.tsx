import React, { useEffect, useState, useRef } from 'react';
import { List, Card, Spin, Input, Button, InputNumber, Select } from 'antd';
import { Property, PropertyStatus } from '../types';
import UniversalMapYandex from '../components/UniversalMapYandex';
import { useLocation, useNavigate } from 'react-router-dom';
import { CloseOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { geocodeAddress, getCityByIP } from '../utils/geocode';

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 11;

const statusOptions = [
  { value: 'for_sale', label: 'В продаже' },
  { value: 'in_deal', label: 'На задатке' },
  { value: 'reserved', label: 'На брони' },
  { value: 'sold', label: 'Продан' },
];
const typeOptions = [
  { value: 'apartment', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'commercial', label: 'Коммерция' },
  { value: 'land', label: 'Участок' },
];

const MapSearchPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [minArea, setMinArea] = useState<number | undefined>();
  const [maxArea, setMaxArea] = useState<number | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [rooms, setRooms] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [selectedPOITypes, setSelectedPOITypes] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = React.useContext(AuthContext);
  const [initialCenter, setInitialCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Получение объектов по bbox и фильтрам
  const fetchProperties = async (bounds: any) => {
    setLoading(true);
    const bbox = [
      bounds.getWest ? bounds.getWest() : bounds[0],
      bounds.getSouth ? bounds.getSouth() : bounds[1],
      bounds.getEast ? bounds.getEast() : bounds[2],
      bounds.getNorth ? bounds.getNorth() : bounds[3],
    ].join(',');
    let url = `/api/properties/map?bbox=${bbox}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (minPrice) url += `&minPrice=${minPrice}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;
    if (status) url += `&status=${status}`;
    if (minArea) url += `&minArea=${minArea}`;
    if (maxArea) url += `&maxArea=${maxArea}`;
    if (type) url += `&type=${type}`;
    if (rooms) url += `&rooms=${rooms}`;
    if (activeTab) url += `&tab=${activeTab}`;
    if (selectedPOITypes.length > 0) url += `&poi=${selectedPOITypes.join(',')}`;
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
    // Чтение query-параметров при первом рендере
    const params = new URLSearchParams(location.search);
    if (params.get('search')) setSearch(params.get('search') || '');
    if (params.get('minPrice')) setMinPrice(Number(params.get('minPrice')));
    if (params.get('maxPrice')) setMaxPrice(Number(params.get('maxPrice')));
    if (params.get('status')) setStatus(params.get('status') || undefined);
    if (params.get('minArea')) setMinArea(Number(params.get('minArea')));
    if (params.get('maxArea')) setMaxArea(Number(params.get('maxArea')));
    if (params.get('type')) setType(params.get('type') || undefined);
    if (params.get('rooms')) setRooms(Number(params.get('rooms')));
    if (params.get('tab')) setActiveTab(params.get('tab') as 'active' | 'archive');
    const poiParam = params.get('poi');
    if (poiParam) setSelectedPOITypes(poiParam.split(','));
    
    // Определение города для центрирования карты
    const determineCity = async () => {
      // Если нет фильтров — определяем город
      if (!params.get('search') && !params.get('minPrice') && !params.get('maxPrice') && !params.get('status') && !params.get('minArea') && !params.get('maxArea') && !params.get('type') && !params.get('rooms')) {
        // Сначала пытаемся определить по IP
        let city = await getCityByIP();
        
        // Если по IP не получилось — берем из профиля пользователя
        if (!city && auth?.user?.city) {
          city = auth.user.city;
        }
        
        // Если город найден — геокодируем и центрируем карту
        if (city) {
          const coords = await geocodeAddress(city);
          if (coords) {
            setInitialCenter([coords.lat, coords.lng]);
          }
        }
      }
    };
    
    determineCity();
    
    handleBoundsChange({
      getWest: () => initialCenter[1] - 0.2,
      getSouth: () => initialCenter[0] - 0.2,
      getEast: () => initialCenter[1] + 0.2,
      getNorth: () => initialCenter[0] + 0.2,
    });
    // eslint-disable-next-line
  }, [location.search]);

  // Обновлять список при изменении фильтров
  useEffect(() => {
    if (mapBounds) fetchProperties(mapBounds);
    // eslint-disable-next-line
  }, [search, minPrice, maxPrice, status, minArea, maxArea, type, rooms, activeTab, selectedPOITypes]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', position: 'relative' }}>
      {/* Кнопка закрытия */}
      <Button
        type="text"
        icon={<CloseOutlined style={{ fontSize: 28 }} />}
        onClick={() => navigate(-1)}
        style={{ position: 'absolute', top: 24, right: 24, zIndex: 1000, background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(40,60,90,0.10)' }}
        aria-label="Закрыть карту"
      />
      {/* Список объектов слева */}
      <div style={{ width: 420, overflowY: 'auto', background: '#fff', borderRight: '1px solid #eee', padding: 18, display: 'flex', flexDirection: 'column' }}>
        {/* Фильтры */}
        <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input.Search
            placeholder="Поиск по адресу или названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onSearch={() => mapBounds && fetchProperties(mapBounds)}
            allowClear
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <InputNumber placeholder="Цена от" min={0} value={minPrice} onChange={v => setMinPrice(v === null ? undefined : v)} style={{ width: 100 }} />
            <InputNumber placeholder="до" min={0} value={maxPrice} onChange={v => setMaxPrice(v === null ? undefined : v)} style={{ width: 100 }} />
            <InputNumber placeholder="Площадь от" min={0} value={minArea} onChange={v => setMinArea(v === null ? undefined : v)} style={{ width: 100 }} />
            <InputNumber placeholder="до" min={0} value={maxArea} onChange={v => setMaxArea(v === null ? undefined : v)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              placeholder="Статус"
              allowClear
              value={status}
              onChange={setStatus}
              options={statusOptions}
              style={{ width: 120 }}
            />
            <Select
              placeholder="Тип"
              allowClear
              value={type}
              onChange={setType}
              options={typeOptions}
              style={{ width: 120 }}
            />
          </div>
        </div>
        {/* Список объектов */}
        {loading ? <Spin /> : (
          <List
            dataSource={properties}
            renderItem={item => (
              <Card
                key={item.id}
                style={{ marginBottom: 12, cursor: 'pointer', border: selectedId === item.id ? '2px solid #1890ff' : undefined }}
                onClick={() => setSelectedId(item.id)}
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
        <UniversalMapYandex
          properties={properties}
          selectedId={selectedId}
          onSelect={setSelectedId}
          initialCenter={initialCenter}
          initialZoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
};

export default MapSearchPage; 