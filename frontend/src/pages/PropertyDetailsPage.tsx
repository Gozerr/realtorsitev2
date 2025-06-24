import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Tag, Button, Avatar, Spin, Alert, Row, Col, Input } from 'antd';
import { getPropertyById } from '../services/property.service';
import { UserOutlined } from '@ant-design/icons';
import { Property } from '../types';

const { Title } = Typography;

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    setLoading(true);
    getPropertyById(id as string)
      .then((data: Property) => setProperty(data))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
    // Здесь можно подгрузить историю чата, если нужно
  }, [id]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages([
      ...chatMessages,
      { from: 'user', text: chatInput, time: new Date().toLocaleTimeString() }
    ]);
    setChatInput('');
    // Здесь можно отправить сообщение на сервер
  };

  if (loading) return <Spin />;
  if (!property) return <Alert message="Объект не найден" type="error" />;

  const images = property.photos || property.images || [];
  const agentName = property.agent ? `${property.agent.firstName} ${property.agent.lastName}` : '—';

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>{property.title}</Title>
      <div style={{ color: '#888', marginBottom: 8 }}>{property.address}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Tag color="blue">{property.status}</Tag>
        {property.isExclusive && <Tag color="purple">Эксклюзив</Tag>}
        <span style={{ fontSize: 22, fontWeight: 700, marginLeft: 12 }}>
          {property.price?.toLocaleString()} ₽
        </span>
      </div>
      <Row gutter={32}>
        <Col span={14}>
          <Card style={{ minHeight: 300, marginBottom: 24 }}>
            {images.length > 0 ? (
              <img src={images[0]} alt={property.title} style={{ width: '100%', borderRadius: 8 }} />
            ) : (
              <div style={{
                width: '100%',
                height: 220,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8
              }}>
                <UserOutlined style={{ fontSize: 64, color: '#ccc' }} />
              </div>
            )}
          </Card>
          <Card title="Описание" style={{ marginBottom: 16 }}>
            {property.description || 'Описание отсутствует'}
          </Card>
          <Card title="Характеристики">
            <div>Тип: {property.type || '—'}</div>
            <div>Площадь: {property.area ?? '—'} м²</div>
            <div>Спальни: {property.bedrooms ?? '—'}</div>
            <div>Ванные: {property.bathrooms ?? '—'}</div>
            <div>Этаж: {property.floor ?? '—'} из {property.totalFloors ?? '—'}</div>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Агент по недвижимости" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                size={48}
                src={property.agent?.photo}
                icon={<UserOutlined />}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{agentName}</div>
                <div style={{ color: '#888' }}>{property.agency || '—'}</div>
                <div>{property.agent?.phone || '—'}</div>
                <div>{property.agent?.email || '—'}</div>
              </div>
            </div>
            <Button type="primary" style={{ marginTop: 16, width: '100%' }}>Позвонить</Button>
          </Card>
          <Card title="Чат с агентом">
            <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ textAlign: msg.from === 'user' ? 'right' : 'left', marginBottom: 4 }}>
                  <span style={{
                    display: 'inline-block',
                    background: msg.from === 'user' ? '#e6f7ff' : '#f5f5f5',
                    borderRadius: 8,
                    padding: '6px 12px',
                    maxWidth: 220
                  }}>
                    {msg.text}
                  </span>
                  <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>{msg.time}</span>
                </div>
              ))}
            </div>
            <Input.Search
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onSearch={handleSendMessage}
              enterButton
              placeholder="Введите сообщение..."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PropertyDetailsPage;