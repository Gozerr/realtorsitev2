import React, { useEffect, useState } from 'react';
import { Row, Col, Input, InputNumber, Select, Button, Typography, Spin, Alert } from 'antd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PropertyCard from '../components/PropertyCard';
import { Property } from '../types';
import { getRecentProperties } from '../services/property.service';

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

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Фильтры
  const [searchText, setSearchText] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);
    setError('');
    getRecentProperties()
      .then(setProperties)
      .catch(() => setError('Не удалось загрузить объекты'))
      .finally(() => setLoading(false));
  }, []);

  // Фильтрация
  const filteredProperties = properties.filter(p => {
    const matchesText =
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.address.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchText.toLowerCase()));
    const matchesMinPrice = minPrice === undefined || p.price >= minPrice;
    const matchesMaxPrice = maxPrice === undefined || p.price <= maxPrice;
    const matchesStatus = !status || p.status === status;
    return matchesText && matchesMinPrice && matchesMaxPrice && matchesStatus;
  });

  const resetFilters = () => {
    setSearchText('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setStatus(undefined);
  };

  // Центр карты — если есть объекты, берем первый, иначе дефолт
  const mapCenter: [number, number] =
    filteredProperties.length > 0 && filteredProperties[0].lat && filteredProperties[0].lng
      ? [filteredProperties[0].lat, filteredProperties[0].lng]
      : [57.6261, 39.8845];

  return (
    <div>
      <Title level={2}>Объекты недвижимости</Title>

      {/* Фильтры */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Input
            placeholder="Поиск по адресу или описанию"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 220 }}
          />
        </Col>
        <Col>
          <InputNumber
            placeholder="Цена от"
            min={0}
            value={minPrice}
            onChange={value => setMinPrice(value === null ? undefined : value)}
            style={{ width: 120 }}
          />
        </Col>
        <Col>
          <InputNumber
            placeholder="Цена до"
            min={0}
            value={maxPrice}
            onChange={value => setMaxPrice(value === null ? undefined : value)}
            style={{ width: 120 }}
          />
        </Col>
        <Col>
          <Select
            placeholder="Статус"
            allowClear
            value={status}
            onChange={setStatus}
            options={statusOptions}
            style={{ width: 140 }}
          />
        </Col>
        <Col>
          <Button onClick={resetFilters}>Сбросить</Button>
        </Col>
      </Row>

      {/* Карта */}
      <div style={{ marginBottom: 24 }}>
        <MapContainer center={mapCenter} zoom={12} style={{ height: 350, width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredProperties.map(property => (
            property.lat && property.lng && (
              <Marker key={property.id} position={[property.lat, property.lng]}>
                <Popup>
                  <b>{property.title}</b><br />
                  {property.address}<br />
                  <a href={`/properties/${property.id}`}>Подробнее</a>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Список объектов */}
      <Spin spinning={loading}>
        {error && <Alert message="Ошибка" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
        <Row gutter={[16, 16]}>
          {filteredProperties.length > 0 ? (
            filteredProperties.map(property => (
              <Col xs={24} sm={12} md={8} key={property.id}>
                <PropertyCard property={property} />
              </Col>
            ))
          ) : (
            !loading && <Col span={24}><Alert message="Нет объектов" type="info" /></Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default PropertiesPage;