import React, { useState, useContext, useRef } from 'react';
import { Card, Carousel, Tag, Button, Tooltip, Modal, Form, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { MessageOutlined, PlusOutlined } from '@ant-design/icons';
import AddToSelectionModal from './AddToSelectionModal';
import { updatePropertyStatus } from '../services/property.service';
import { AuthContext } from '../context/AuthContext';

const statusOptions = [
  { value: 'for_sale', label: 'В продаже', color: 'green' },
  { value: 'in_deal', label: 'На задатке', color: 'orange' },
  { value: 'reserved', label: 'На брони', color: 'blue' },
  { value: 'sold', label: 'Продан', color: 'red' },
];

type PropertyCardProps = {
  property: Property;
  onStatusChange?: (id: number, status: string) => void;
  mode?: 'default' | 'compact';
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onStatusChange, mode = 'default' }) => {
  const images: string[] = property.photos || property.images || [];
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(property.status);
  const auth = useContext(AuthContext);
  const currentUser = auth?.user;
  const carouselRef = useRef<any>(null);
  const [lastDirection, setLastDirection] = useState<'left' | 'right' | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragLastX, setDragLastX] = useState<number | null>(null);
  const [lastSegment, setLastSegment] = useState<number | null>(null);

  // Агент может менять статус только если он привязан к объекту
  const canEditStatus =
    currentUser &&
    currentUser.role === 'agent' &&
    property.agent &&
    property.agent.id === currentUser.id;

  const currentStatus = statusOptions.find(opt => opt.value === property.status) || statusOptions[0];

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStatus(property.status);
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    setStatusModalOpen(false);
    if (selectedStatus !== property.status) {
      await updatePropertyStatus(property.id, selectedStatus);
      onStatusChange && onStatusChange(property.id, selectedStatus);
    }
  };

  // --- Логика для mouse move: листаем по сегментам ширины ---
  const handleMouseMoveSlider = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, images: string[]) => {
    if (!images.length || !carouselRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const segmentCount = images.length;
    const segmentWidth = rect.width / segmentCount;
    const currentSegment = Math.floor(x / segmentWidth);
    if (lastSegment === null) {
      setLastSegment(currentSegment);
      setDragLastX(x);
      return;
    }
    if (currentSegment > lastSegment) {
      carouselRef.current.next();
      setLastSegment(currentSegment);
    } else if (currentSegment < lastSegment) {
      carouselRef.current.prev();
      setLastSegment(currentSegment);
    }
    setDragLastX(x);
  };
  const handleMouseLeaveSlider = () => {
    setDragStartX(null);
    setDragLastX(null);
    setLastSegment(null);
    setLastDirection(null);
    setHovered(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Не переходить, если клик по кнопке внутри
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"]')) return;
    // navigate(`/properties/${property.id}`); // отключаю клик по всей карточке
  };

  if (mode === 'compact') {
    return (
      <Card
        style={{
          width: '100%',
          marginBottom: 16,
          position: 'relative',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px var(--shadow-light)'
        }}
        cover={
          <div
            style={{ position: 'relative', padding: 12, cursor: images.length > 1 ? 'pointer' : 'default' }}
            onMouseMove={e => handleMouseMoveSlider(e, images)}
            onMouseLeave={handleMouseLeaveSlider}
          >
            {images.length > 0 ? (
              <Carousel ref={carouselRef} dots={true} style={{ width: '100%', height: 170 }}>
                {images.map((url: string, i: number) => (
                  <div key={i}>
                    <img
                      src={url}
                      alt={property.title}
                      style={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 8 }}
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                ))}
              </Carousel>
            ) : (
              <div style={{
                width: '100%',
                height: 170,
                background: 'var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                color: 'var(--text-muted)'
              }}>
                Нет фото
              </div>
            )}
          </div>
        }
        bodyStyle={{ padding: 16 }}
        onClick={handleCardClick}
        hoverable
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: 'var(--text-primary)' }}>{property.title}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>{property.address}</div>
        <div style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: 16 }}>{property.price?.toLocaleString()} ₽</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{property.area} м²</div>
        <Tag color="purple" style={{ fontWeight: 600, fontSize: 13, marginTop: 8 }}>Эксклюзивный объект</Tag>
        <Tag color={currentStatus.color} style={{ fontWeight: 500, marginLeft: 8 }}>{currentStatus.label}</Tag>
      </Card>
    );
  }

  return (
    <Card
      title={property.title}
      style={{
        width: '100%',
        marginBottom: 16,
        position: 'relative',
        background: 'var(--card-background)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 8px var(--shadow-light)'
      }}
      cover={
        <div
          style={{ position: 'relative', padding: 12, cursor: images.length > 1 ? 'pointer' : 'default' }}
          onMouseMove={e => handleMouseMoveSlider(e, images)}
          onMouseLeave={handleMouseLeaveSlider}
        >
          {images.length > 0 ? (
            <Carousel ref={carouselRef} dots={true} style={{ width: '100%', height: 170 }}>
              {images.map((url: string, i: number) => (
                <div key={i}>
                  <img
                    src={url}
                    alt={property.title}
                    style={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 8 }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <div style={{
              width: '100%',
              height: 170,
              background: 'var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              color: 'var(--text-muted)'
            }}>
              Нет фото
            </div>
          )}
        </div>
      }
      onClick={handleCardClick}
      hoverable
    >
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Tag color="purple" style={{ fontWeight: 600, fontSize: 14 }}>
          Эксклюзивный объект
        </Tag>
        {canEditStatus ? (
          <>
            <Tag
              color={currentStatus.color}
              style={{ fontWeight: 500, cursor: 'pointer', minWidth: 90, textAlign: 'center', fontSize: 13, border: '1.5px solid #e6eaf1', boxShadow: '0 2px 8px #f0f1f3', borderRadius: 8, padding: '2px 10px', lineHeight: 1.2, letterSpacing: 0.1 }}
              onClick={handleTagClick}
            >
              {currentStatus.label}
            </Tag>
            <Modal
              open={statusModalOpen}
              onCancel={() => setStatusModalOpen(false)}
              title="Изменить статус объекта"
              footer={null}
              destroyOnHidden
            >
              <Form layout="vertical" onFinish={handleSaveStatus}>
                <Form.Item label="Статус">
                  <Select
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    style={{ width: '100%' }}
                    options={statusOptions.map(opt => ({
                      value: opt.value,
                      label: <Tag color={opt.color} style={{ minWidth: 70, textAlign: 'center', fontWeight: 500, fontSize: 13, borderRadius: 8, padding: '2px 10px', lineHeight: 1.2, letterSpacing: 0.1 }}>{opt.label}</Tag>
                    }))}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" style={{ float: 'right' }}>
                    Сохранить
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </>
        ) : (
          <Tag color={currentStatus.color} style={{ fontWeight: 500 }}>
            {currentStatus.label}
          </Tag>
        )}
      </div>
      <p style={{ color: 'var(--text-primary)' }}><b>Адрес:</b> {property.address}</p>
      <p style={{ color: 'var(--text-primary)' }}><b>Цена:</b> {property.price} ₽</p>
      <p style={{ color: 'var(--text-primary)' }}><b>Площадь:</b> {property.area} м²</p>
      <p style={{ color: 'var(--text-secondary)' }}><b>Описание:</b> {property.description}</p>
      {property.agent && (
        <div style={{ marginTop: 12, marginBottom: 8, padding: 8, background: '#f6f6fa', borderRadius: 8 }}>
          <b>Агент:</b> {property.agent.firstName} {property.agent.lastName}<br/>
          <b>Телефон:</b> {property.agent.phone || '—'}<br/>
          <b>Email:</b> {property.agent.email}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <Button type="default" onClick={() => { console.log('navigate to property', property.id); navigate(`/properties/${property.id}`); }}>
          Подробнее
        </Button>
        <Tooltip title="Чат с агентом">
          <Button
            shape="circle"
            icon={<MessageOutlined />}
            onClick={e => { e.stopPropagation(); navigate(`/chats?user=${property.agent?.id}`); }}
          />
        </Tooltip>
        <Tooltip title="Добавить в подбор">
          <Button
            shape="circle"
            icon={<PlusOutlined />}
            onClick={e => { e.stopPropagation(); setModalOpen(true); }}
          />
        </Tooltip>
      </div>
      <AddToSelectionModal open={modalOpen} propertyId={property.id} onClose={() => setModalOpen(false)} />
    </Card>
  );
};

export default PropertyCard;