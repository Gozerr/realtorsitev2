import React from 'react';
import { List, Card, Spin, Input, Button, InputNumber, Select } from 'antd';
import UniversalMapYandex from '../components/UniversalMapYandex';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { usePropertiesContext } from '../context/PropertiesContext';

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

export default function MapSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = React.useContext(AuthContext);
  const {
    filters,
    updateFilters,
    resetFilters,
    bbox,
    setBbox,
    properties,
    loading,
    selectedId,
    setSelectedId,
    center,
    setCenter
  } = usePropertiesContext();
  const [activeTab, setActiveTab] = React.useState<'active' | 'archive'>(
    new URLSearchParams(location.search).get('tab') === 'archive' ? 'archive' : 'active'
  );
  const [show, setShow] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = React.useRef(false);
  const [delayedLoading, setDelayedLoading] = React.useState(false);
  const loadingTimeout = React.useRef<any>(null);
  const minShowTimeout = React.useRef<any>(null);

  React.useEffect(() => {
    setTimeout(() => setShow(true), 10); // для плавной анимации
  }, []);

  // Инициализация состояния из URL
  React.useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const bboxParam = searchParams.get('bbox');
    const selectedIdParam = searchParams.get('selectedId');
    const filtersParam = searchParams.get('filters');
    if (bboxParam) {
      const arr = bboxParam.split(',').map(Number);
      if (arr.length === 4 && arr.every(x => !isNaN(x))) setBbox(arr as any);
    }
    if (selectedIdParam) setSelectedId(Number(selectedIdParam));
    if (filtersParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(filtersParam));
        updateFilters(parsed);
      } catch {}
    }
  }, [searchParams, setBbox, setSelectedId, updateFilters]);

  // Сохранять состояние в URL при изменении
  React.useEffect(() => {
    const params: any = {};
    if (bbox) params.bbox = bbox.join(',');
    if (selectedId) params.selectedId = selectedId;
    if (Object.keys(filters).length > 0) params.filters = encodeURIComponent(JSON.stringify(filters));
    setSearchParams(params);
  }, [bbox, selectedId, filters]);

  // Фильтрация по табу (активные/архив)
  const filteredProperties = properties.filter(p =>
    activeTab === 'active' ? p.status !== 'sold' : p.status === 'sold'
  );

  // При изменении границ карты обновлять bbox
  const handleBoundsChange = (bboxArr: [number, number, number, number]) => {
    setBbox(bboxArr);
  };

  React.useEffect(() => {
    if (loading) {
      // Показываем спиннер только если загрузка дольше 250мс
      loadingTimeout.current = setTimeout(() => {
        setDelayedLoading(true);
        // После появления держим минимум 400мс
        minShowTimeout.current = setTimeout(() => {}, 400);
      }, 250);
    } else {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (delayedLoading) {
        // Если спиннер уже показан, держим его минимум 400мс
        if (minShowTimeout.current) {
          setTimeout(() => setDelayedLoading(false), 400);
          clearTimeout(minShowTimeout.current);
        } else {
          setDelayedLoading(false);
        }
      }
    }
    return () => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (minShowTimeout.current) clearTimeout(minShowTimeout.current);
    };
  }, [loading]);

  return (
    <div className={`big-map-page${show ? ' big-map-page--show' : ''}`} style={{ display: 'flex', height: 'calc(100vh - 80px)', position: 'relative', transition: 'background 0.5s' }}>
      {/* Список объектов слева */}
      <div style={{ width: 420, overflowY: 'auto', background: '#fff', borderRight: '1px solid #eee', padding: 18, display: 'flex', flexDirection: 'column', transition: 'transform 0.5s', transform: show ? 'translateX(0)' : 'translateX(-100%)', opacity: show ? 1 : 0 }}>
        {/* Фильтры */}
        <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input.Search
            placeholder="Поиск по адресу или названию..."
            value={filters.search || ''}
            onChange={e => updateFilters({ search: e.target.value })}
            allowClear
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <InputNumber placeholder="Цена от" min={0} value={filters.minPrice} onChange={v => updateFilters({ minPrice: v === null ? undefined : v })} style={{ width: 100 }} />
            <InputNumber placeholder="до" min={0} value={filters.maxPrice} onChange={v => updateFilters({ maxPrice: v === null ? undefined : v })} style={{ width: 100 }} />
            <InputNumber placeholder="Площадь от" min={0} value={filters.minArea} onChange={v => updateFilters({ minArea: v === null ? undefined : v })} style={{ width: 100 }} />
            <InputNumber placeholder="до" min={0} value={filters.maxArea} onChange={v => updateFilters({ maxArea: v === null ? undefined : v })} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              placeholder="Статус"
              allowClear
              value={filters.status}
              onChange={v => updateFilters({ status: v })}
              options={statusOptions}
              style={{ width: 120 }}
            />
            <Select
              placeholder="Тип"
              allowClear
              value={filters.type}
              onChange={v => updateFilters({ type: v })}
              options={typeOptions}
              style={{ width: 120 }}
            />
          </div>
          <Button onClick={resetFilters} style={{ borderRadius: 8, fontWeight: 500, marginTop: 8 }}>Сбросить</Button>
        </div>
        {/* Список объектов */}
        {delayedLoading ? <Spin /> : (
          <List
            dataSource={filteredProperties}
            renderItem={item => (
              <Card
                key={item.id}
                style={{
                  marginBottom: 12,
                  cursor: 'pointer',
                  border: selectedId === item.id ? '2px solid #1890ff' : undefined,
                  boxShadow: selectedId === item.id ? '0 0 0 4px #e6f7ff, 0 2px 8px rgba(40,60,90,0.10)' : undefined,
                  transition: 'border 0.3s, box-shadow 0.3s',
                }}
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
      <div style={{ flex: 1, transition: 'all 0.5s', opacity: show ? 1 : 0, position: 'relative' }}>
        {/* Кнопка возврата теперь на самой карте */}
        <Button
          type="default"
          icon={<ArrowLeftOutlined style={{ fontSize: 22 }} />}
          onClick={() => navigate('/properties')}
          style={{ position: 'absolute', top: 24, right: 24, zIndex: 1000, background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(40,60,90,0.10)', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Вернуться к списку"
        />
        {/* Спиннер только на карте */}
        {delayedLoading && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 1001, transform: 'translate(-50%, -50%)' }}>
            <Spin size="large" />
          </div>
        )}
        <UniversalMapYandex
          properties={filteredProperties}
          selectedId={selectedId}
          onSelect={setSelectedId}
          initialCenter={center}
          initialZoom={12}
          onBoundsChange={handleBoundsChange}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
      <style>{`
        .big-map-page {
          background: #f8fafc;
        }
        .big-map-page--show {
          background: #e9f0fb;
        }
      `}</style>
    </div>
  );
} 