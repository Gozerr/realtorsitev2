import React from 'react';
import { Row, Col, Input, InputNumber, Select, Button, Typography, Spin, Alert, Tabs, Badge } from 'antd';
import { SearchOutlined, HomeOutlined, NumberOutlined, ExpandOutlined, HighlightOutlined, CloseCircleOutlined, EnvironmentOutlined, MessageOutlined } from '@ant-design/icons';
import PropertyCard from '../components/PropertyCard';
import UniversalMapYandex from '../components/UniversalMapYandex';
import { useNavigate } from 'react-router-dom';
import { usePropertiesContext } from '../context/PropertiesContext';
import { AuthContext } from '../context/AuthContext';

const { Title } = Typography;

const propertyTypeOptions = [
  { value: 'apartment', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'commercial', label: 'Коммерция' },
  { value: 'land', label: 'Участок' },
];

const statusOptions = [
  { value: 'for_sale', label: 'В продаже' },
  { value: 'in_deal', label: 'На задатке' },
  { value: 'reserved', label: 'На брони' },
  { value: 'sold', label: 'Продан' },
];

export default function PropertiesPage() {
  const auth = React.useContext(AuthContext);
  const navigate = useNavigate();
  const {
    filters,
    updateFilters,
    resetFilters,
    properties,
    loading,
    selectedId,
    setSelectedId,
    bbox,
    setBbox,
    center,
    setCenter
  } = usePropertiesContext();
  const [activeTab, setActiveTab] = React.useState<'active' | 'archive' | 'my'>('active');

  // Фильтрация по табу (активные/архив/мои) и по всем данным
  const filteredProperties = properties
    .filter(p => !!p.id && typeof p.id === 'number')
    .filter(p => {
      const status = (p.status || '').toString().toLowerCase();
      if (activeTab === 'my') {
        if (auth?.user?.role === 'agent') {
          return p.agent?.id === auth.user.id || p.agentId === auth.user.id;
        } else if (auth?.user?.role === 'director') {
          if (auth.user.agencyId) {
            return (p.agencyId && p.agencyId === auth.user.agencyId) || (p.agent && 'agencyId' in p.agent && p.agent.agencyId === auth.user.agencyId);
          }
          return true;
        }
      }
      return activeTab === 'active' ? status !== 'sold' : status === 'sold';
    })
    .filter(p => {
      if (!filters.search) return true;
      const search = filters.search.toLowerCase();
      // Проверяем все основные поля
      return (
        (p.title && p.title.toLowerCase().includes(search)) ||
        (p.address && p.address.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.agent && ((p.agent.firstName && p.agent.firstName.toLowerCase().includes(search)) || (p.agent.lastName && p.agent.lastName.toLowerCase().includes(search)) || (p.agent.email && p.agent.email.toLowerCase().includes(search)))) ||
        (p.price && String(p.price).includes(search)) ||
        (p.area && String(p.area).includes(search)) ||
        (p.status && p.status.toLowerCase().includes(search))
      );
    });

  // Открыть большую карту с текущими фильтрами
  const handleOpenBigMap = () => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters.status) params.set('status', filters.status);
    if (filters.minArea !== undefined) params.set('minArea', String(filters.minArea));
    if (filters.maxArea !== undefined) params.set('maxArea', String(filters.maxArea));
    if (filters.type) params.set('type', filters.type);
    if (filters.rooms !== undefined) params.set('rooms', String(filters.rooms));
    if (activeTab) params.set('tab', activeTab);
    navigate(`/map?${params.toString()}`);
  };

  // Для карты: только объекты с координатами
  const propertiesWithCoords = filteredProperties.filter(p => p.lat && p.lng);

  console.log('properties:', properties);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #f8fafc 0%, #e9f0fb 100%)', padding: '32px 0' }}>
      <div className="property-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={2} className="property-title-mobile" style={{ marginBottom: 32, fontWeight: 800, letterSpacing: -1 }}>
            Объекты недвижимости
          </Title>
        </div>
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
          onChange={key => setActiveTab(key as 'active' | 'archive' | 'my')}
          style={{ marginBottom: 24 }}
          items={[
            { key: 'active', label: 'Активные объекты' },
            { key: 'my', label: 'Мои объекты' },
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
            placeholder="Поиск по всем данным (адрес, название, описание, агент, и др.)"
            value={filters.search || ''}
            onChange={e => updateFilters({ search: e.target.value })}
            style={{ width: 320, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
            allowClear
          />
          <InputNumber
            prefix={<HomeOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Цена от"
            min={0}
            value={filters.minPrice}
            onChange={value => updateFilters({ minPrice: value === null ? undefined : value })}
            style={{ width: 120, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            placeholder="Цена до"
            min={0}
            value={filters.maxPrice}
            onChange={value => updateFilters({ maxPrice: value === null ? undefined : value })}
            style={{ width: 120, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            prefix={<ExpandOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Площадь от"
            min={0}
            value={filters.minArea}
            onChange={value => updateFilters({ minArea: value === null ? undefined : value })}
            style={{ width: 110, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            placeholder="Площадь до"
            min={0}
            value={filters.maxArea}
            onChange={value => updateFilters({ maxArea: value === null ? undefined : value })}
            style={{ width: 110, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <InputNumber
            prefix={<NumberOutlined style={{ color: '#b0b6c3' }} />}
            placeholder="Комнат"
            min={1}
            max={10}
            value={filters.rooms}
            onChange={value => updateFilters({ rooms: value === null ? undefined : value })}
            style={{ width: 90, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <Select
            placeholder="Тип недвижимости"
            allowClear
            value={filters.type}
            onChange={value => updateFilters({ type: value })}
            options={propertyTypeOptions}
            style={{ width: 150, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
          />
          <Select
            placeholder="Статус"
            allowClear
            value={filters.status}
            onChange={value => updateFilters({ status: value })}
            options={statusOptions}
            style={{ width: 140, borderRadius: 12, background: '#f7f9fc', border: '1px solid #e6eaf1' }}
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
            properties={propertiesWithCoords}
            selectedId={selectedId}
            onSelect={setSelectedId}
            initialCenter={center}
            initialZoom={12}
            style={{ height: 350, width: '100%', borderRadius: 18 }}
            onBoundsChange={setBbox}
          />
        </div>
        {/* Список объектов */}
        <Spin spinning={loading}>
          <Row gutter={[24, 24]} style={{ margin: 0 }}>
            {filteredProperties.map(property => (
              <Col xs={24} sm={12} md={8} lg={8} key={property.id} style={{ display: 'flex' }}>
                <PropertyCard property={property} />
              </Col>
            ))}
          </Row>
        </Spin>
      </div>
      {/* Анимация */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 40px, 0); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 767px) {
          .property-title-mobile {
            writing-mode: initial !important;
            text-align: left !important;
            font-size: 22px !important;
            letter-spacing: 0 !important;
            margin-bottom: 16px !important;
            margin-top: 0 !important;
            font-weight: 700 !important;
            width: 100% !important;
            white-space: normal !important;
          }
          .property-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            padding: 0 !important;
          }
          .property-filters {
            flex-direction: column !important;
            gap: 8px !important;
            padding: 12px !important;
            width: 100% !important;
          }
          .property-card-col {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
        }
        @media (max-width: 991px) and (min-width: 768px) {
          .property-card-col {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
        }
      `}</style>
    </div>
  );
}