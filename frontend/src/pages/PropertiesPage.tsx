import React, { useState, useEffect } from 'react';
import { Typography, Tag, Input, Button, Space, Row, Col, Card } from 'antd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { Title, Text } = Typography;
const { Search } = Input;

// --- Типы для мок-данных ---
enum PropertyStatus {
  FOR_SALE = 'FOR_SALE',
  IN_DEAL = 'IN_DEAL',
  SOLD = 'SOLD',
}

type Property = {
  id: number;
  title: string;
  address: string;
  price: number;
  status: PropertyStatus;
  isExclusive: boolean;
  type: string;
};

type PropertyWithMock = Property & {
  image: string;
  link: string;
  lat: number;
  lng: number;
};

// --- Мок-данные с координатами ---
const mockProperties: PropertyWithMock[] = [
  {
    id: 308217614,
    title: "1-комн. квартира, 36 м², 5/9 эт.",
    address: "Ярославль, ул. Батова, 10",
    price: 17000,
    status: PropertyStatus.FOR_SALE,
    isExclusive: true,
    image: "https://cdn.cian.site/images/preview/308217614-1.jpg",
    type: "flat",
    link: "https://yaroslavl.cian.ru/rent/flat/308217614/",
    lat: 57.6261,
    lng: 39.8845
  },
  {
    id: 318822922,
    title: "2-комн. квартира, 54 м², 3/5 эт.",
    address: "Ярославль, ул. Салтыкова-Щедрина, 34",
    price: 22000,
    status: PropertyStatus.FOR_SALE,
    isExclusive: false,
    image: "https://cdn.cian.site/images/preview/318822922-1.jpg",
    type: "flat",
    link: "https://yaroslavl.cian.ru/rent/flat/318822922/",
    lat: 57.6292,
    lng: 39.8736
  },
  {
    id: 316910099,
    title: "Дом, 120 м², 10 сот.",
    address: "Ярославская обл., Ярославский р-н, д. Кузнечиха",
    price: 6500000,
    status: PropertyStatus.FOR_SALE,
    isExclusive: true,
    image: "https://cdn.cian.site/images/preview/316910099-1.jpg",
    type: "house",
    link: "https://yaroslavl.cian.ru/sale/suburban/316910099/",
    lat: 57.6902,
    lng: 39.7842
  },
  {
    id: 318127453,
    title: "3-комн. квартира, 78 м², 7/10 эт.",
    address: "Ярославль, ул. Панина, 25",
    price: 7200000,
    status: PropertyStatus.FOR_SALE,
    isExclusive: false,
    image: "https://cdn.cian.site/images/preview/318127453-1.jpg",
    type: "flat",
    link: "https://yaroslavl.cian.ru/sale/flat/318127453/",
    lat: 57.6267,
    lng: 39.8857
  }
];

// --- Цвета и текст статусов ---
const statusColors = {
  [PropertyStatus.FOR_SALE]: 'green',
  [PropertyStatus.IN_DEAL]: 'gold',
  [PropertyStatus.SOLD]: 'red',
};

const statusText = {
  [PropertyStatus.FOR_SALE]: 'В продаже',
  [PropertyStatus.IN_DEAL]: 'В сделке',
  [PropertyStatus.SOLD]: 'Продано',
};

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<PropertyWithMock[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setProperties(mockProperties);
  }, []);

  const filteredProperties = properties
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p =>
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.address.toLowerCase().includes(searchText.toLowerCase())
    );

  // Центр карты — Ярославль
  const mapCenter: [number, number] = [57.6261, 39.8845];

  // Исправление для маркеров leaflet (иначе не отображаются стандартные иконки)
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });

  return (
    <div>
      <Title level={2}>Объекты недвижимости</Title>
      {/* Карта */}
      <MapContainer center={mapCenter} zoom={12} style={{ height: 300, width: '100%', marginBottom: 32, borderRadius: 16 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredProperties.map((property) => (
          <Marker key={property.id} position={[property.lat, property.lng]}>
            <Popup>
              <b>{property.title}</b><br />
              {property.address}<br />
              <a href={property.link} target="_blank" rel="noopener noreferrer">Подробнее</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button type={statusFilter === 'all' ? 'primary' : 'default'} onClick={() => setStatusFilter('all')}>Все</Button>
            <Button type={statusFilter === PropertyStatus.FOR_SALE ? 'primary' : 'default'} onClick={() => setStatusFilter(PropertyStatus.FOR_SALE)}>В продаже</Button>
            <Button type={statusFilter === PropertyStatus.IN_DEAL ? 'primary' : 'default'} onClick={() => setStatusFilter(PropertyStatus.IN_DEAL)}>В сделке</Button>
            <Button type={statusFilter === PropertyStatus.SOLD ? 'primary' : 'default'} onClick={() => setStatusFilter(PropertyStatus.SOLD)}>Продано</Button>
            <Button onClick={() => setShowFilters(f => !f)}>Показать фильтры</Button>
          </Space>
        </Col>
        <Col>
          <Search
            placeholder="Поиск по названию или адресу"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </Col>
      </Row>

      {showFilters && (
        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">Здесь будут дополнительные фильтры...</Text>
        </div>
      )}

      <Row gutter={[24, 24]}>
        {filteredProperties.map((property) => (
          <Col xs={24} md={12} key={property.id}>
            <Card
              style={{ borderRadius: 16, minHeight: 220 }}
              bodyStyle={{ padding: 24 }}
              bordered={false}
            >
              <Space style={{ marginBottom: 8 }}>
                {property.isExclusive && (
                  <Tag color="purple" style={{ fontWeight: 500 }}>Эксклюзив</Tag>
                )}
                <Tag color={statusColors[property.status]} style={{ fontWeight: 500 }}>
                  {statusText[property.status]}
                </Tag>
              </Space>
              <div style={{ minHeight: 80, marginBottom: 16, background: '#f7f7f7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {property.image ? (
                  <img src={property.image} alt={property.title} style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 8 }} />
                ) : (
                  <Text type="secondary">Нет фото</Text>
                )}
              </div>
              <Title level={4} style={{ margin: 0 }}>{property.title}</Title>
              <Text type="secondary">{property.address}</Text>
              <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>
                {property.price.toLocaleString('ru-RU')} ₽
              </div>
              <Space>
                <Button type="primary" href={property.link} target="_blank">Подробнее</Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PropertiesPage;