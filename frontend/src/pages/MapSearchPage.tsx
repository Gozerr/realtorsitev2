import React from 'react';
import { List, Card, Spin, Input, Button, InputNumber, Select, Carousel } from 'antd';
import UniversalMapYandex from '../components/UniversalMapYandex';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CloseOutlined, ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { usePropertiesContext } from '../context/PropertiesContext';
import { FixedSizeList as VirtualList } from 'react-window';
import { Skeleton } from 'antd';
import { useState } from 'react';
import AddToSelectionModal from '../components/AddToSelectionModal';

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
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [addToSelectionId, setAddToSelectionId] = useState<number | null>(null);

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

  // Определяем, показывать windowing или обычный список
  const maxListCount = 300;
  const isFullCity = !bbox || (bbox && Math.abs(bbox[2] - bbox[0]) > 0.5 && Math.abs(bbox[3] - bbox[1]) > 0.5); // bbox > ~0.5 градуса — весь город
  const listToShow = isFullCity ? filteredProperties : filteredProperties.slice(0, maxListCount);
  const tooMany = listToShow.length > maxListCount;

  return (
    <div className={`big-map-page${show ? ' big-map-page--show' : ''}`} style={{ display: 'flex', height: 'calc(100vh - 80px)', position: 'relative', transition: 'background 0.5s' }}>
      {/* Список объектов слева */}
      <div style={{ width: 420, overflowY: 'auto', background: '#fff', borderRight: '1px solid #eee', padding: 18, display: 'flex', flexDirection: 'column', transition: 'transform 0.5s', transform: show ? 'translateX(0)' : 'translateX(-100%)', opacity: show ? 1 : 0 }}>
        {/* Фильтры */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 340 }}>
          <Button type="default" size="small" style={{ marginBottom: 8 }} onClick={() => setFiltersOpen(v => !v)}>
            {filtersOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
          </Button>
          <div style={{ transition: 'max-height 0.3s, opacity 0.3s', overflow: 'hidden', maxHeight: filtersOpen ? 400 : 0, opacity: filtersOpen ? 1 : 0 }}>
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
          </div>
        </div>
        {/* Список объектов */}
        <div style={{ background: '#fafbfc', padding: '18px 0', borderRadius: 18, minHeight: 600 }}>
          {tooMany && (
            <div style={{ color: '#ff9800', fontWeight: 500, textAlign: 'center', marginBottom: 12 }}>
              Показаны только первые {maxListCount} объектов для ускорения работы
            </div>
          )}
          {listToShow.map((item, index) => (
            <React.Fragment key={item.id}>
              <div style={{ display: 'flex', alignItems: 'stretch', padding: '0 16px', boxSizing: 'border-box', width: '100%', maxWidth: '100%', marginBottom: 36 }}>
                {/* Вертикальный акцент */}
                <div style={{ width: 6, borderRadius: 8, background: 'linear-gradient(180deg, #6fa8ff 0%, #e6eaff 100%)', marginRight: 18, marginTop: 18, marginBottom: 18, minHeight: 180, alignSelf: 'stretch' }} />
                <Card
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    background: '#fcfcff',
                    border: '1.5px solid #f0f0f0',
                    borderRadius: 18,
                    boxShadow: selectedId === item.id ? '0 0 0 4px #e6f7ff, 0 4px 18px rgba(40,60,90,0.13)' : '0 2px 12px rgba(40,60,90,0.07)',
                    transition: 'box-shadow 0.25s, border 0.25s',
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 240,
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setSelectedId(item.id)}
                  bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1 }}
                  hoverable
                >
                  <div style={{ width: '100%', height: 140, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
                    {item.photos && item.photos.length > 0 ? (
                      <Carousel dots={item.photos.length > 1} style={{ width: '100%', height: 140 }}>
                        {item.photos.map((photo: string, idx: number) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={item.title}
                            style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '18px 18px 0 0' }}
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        ))}
                      </Carousel>
                    ) : (
                      <div style={{ width: '100%', height: 140, background: '#eee', borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>Нет фото</div>
                    )}
                  </div>
                  <div style={{ padding: '18px 22px 10px 22px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 80 }}>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ color: '#888', fontSize: 15, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.address}</div>
                    <div style={{ color: '#1890ff', fontWeight: 600, fontSize: 19, marginBottom: 10 }}>{item.price?.toLocaleString()} ₽</div>
                    <div style={{ color: '#666', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description || ''}</div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ borderRadius: 8, marginTop: 12, alignSelf: 'flex-start', fontWeight: 500 }}
                      onClick={e => { e.stopPropagation(); setAddToSelectionId(item.id); }}
                    >
                      Добавить в подбор
                    </Button>
                  </div>
                </Card>
              </div>
              {index < listToShow.length - 1 && (
                <div style={{ width: '100%', height: 1, background: '#e6e6e6', margin: '0 0 36px 0', borderRadius: 1 }} />
              )}
            </React.Fragment>
          ))}
        </div>
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
      <AddToSelectionModal open={!!addToSelectionId} propertyId={addToSelectionId || undefined} onClose={() => setAddToSelectionId(null)} />
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