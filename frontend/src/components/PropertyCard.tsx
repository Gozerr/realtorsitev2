import React, { useState, useContext, useRef, useCallback } from 'react';
import { Card, Carousel, Tag, Button, Tooltip, Modal, Form, Select, Space, Typography, Skeleton, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { MessageOutlined, PlusOutlined, HeartOutlined, HeartFilled, EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined, PropertySafetyOutlined } from '@ant-design/icons';
import AddToSelectionModal from './AddToSelectionModal';
import { updatePropertyStatus } from '../services/property.service';
import { AuthContext } from '../context/AuthContext';
import OptimizedImage from './OptimizedImage';
import styles from './GlassCard.module.css';

const { Text, Title } = Typography;

const statusOptions = [
  { value: 'for_sale', label: 'В продаже', color: 'green' },
  { value: 'in_deal', label: 'На задатке', color: 'orange' },
  { value: 'reserved', label: 'На брони', color: 'blue' },
  { value: 'sold', label: 'Продан', color: 'red' },
];

type PropertyCardProps = {
  property: Property;
  onStatusChange?: (id: number, status: string) => void;
  mode?: 'default' | 'compact' | 'avito';
  onFavorite?: (propertyId: number) => void;
  onEdit?: (propertyId: number) => void;
  onDelete?: (propertyId: number) => void;
  isFavorite?: boolean;
  loading?: boolean;
  showActions?: boolean;
};

function normalizePhotos(photos: any): string[] {
  if (Array.isArray(photos)) return photos;
  if (typeof photos === 'string') {
    try {
      const arr = JSON.parse(photos);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getThumbnail(photo: string | undefined): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith('/uploads/objects/')) {
    const parts = photo.split('/');
    // вставляем 'thumbnails' после 'objects'
    return ['/uploads', 'objects', 'thumbnails', ...parts.slice(3)].join('/');
  }
  return undefined;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onStatusChange,
  mode = 'default',
  onFavorite,
  onEdit,
  onDelete,
  isFavorite = false,
  loading = false,
  showActions = true,
}) => {
  const images: string[] = normalizePhotos(property.photos) || property.images || [];
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
  const [imageLoading, setImageLoading] = useState(true);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const currentUserId = auth?.user?.id;
  const agentId = property.agent?.id;
  const propertyId = property.id;
  const roomName = propertyId && currentUserId && agentId && currentUserId !== agentId
    ? `property-${propertyId}-agent-${currentUserId < agentId ? currentUserId + '-' + agentId : agentId + '-' + currentUserId}`
    : '';
  const rocketChatUrl = roomName ? `https://open.rocket.chat/channel/${roomName}` : '';

  // Агент может менять статус только если он привязан к объекту
  const canEditStatus =
    currentUser &&
    currentUser.role === 'agent' &&
    property.agent &&
    property.agent.id === currentUser.id;

  // Проверяем, доступен ли чат для этого объекта (только если агент не сам себе)
  const isChatAvailable = property.agent && currentUser && property.agent.id !== currentUser.id;

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

  const handleCardClick = useCallback(() => {
    navigate(`/properties/${property.id}`);
  }, [navigate, property.id]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(property.id);
  }, [onFavorite, property.id]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(property.id);
  }, [onEdit, property.id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(property.id);
  }, [onDelete, property.id]);

  if (loading) {
    return (
      <Card style={{ width: 300, marginBottom: 16 }}>
        <Skeleton.Image active style={{ width: '100%', height: 200 }} />
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  const mainImage = (property.photos && Array.isArray(property.photos) && property.photos[0])
    || (typeof property.photos === 'string' && (() => { try { const arr = JSON.parse(property.photos); return Array.isArray(arr) && arr[0] ? arr[0] : null; } catch { return null; } })())
    || '/placeholder-property.jpg';

  console.log('PropertyCard property.photos:', property.photos);
  console.log('PropertyCard mainImage:', mainImage);

  // Форматирование цены с пробелами
  const formatPrice = (price?: number | string) => {
    const num = Number(price);
    if (!num || isNaN(num)) return '—';
    return num.toLocaleString('ru-RU') + ' руб';
  };

  // Новый единый стиль карточки:
  const isModalActive = modalOpen || phoneModalOpen;

  if (mode === 'avito') {
    return (
      <div
        className={styles.avitoCard}
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e6eaf1', minHeight: 120, margin: '12px 0', padding: 0, cursor: isModalActive ? 'default' : 'pointer', transition: 'box-shadow 0.18s', width: '100%', maxWidth: '100%' }}
        onClick={() => navigate(`/properties/${property.id}`)}
      >
        <div style={{ width: 100, height: 100, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 14 }}>
          <OptimizedImage
            src={mainImage}
            alt={property.title}
            preview={false}
            width={100}
            height={100}
            style={{ objectFit: 'cover', width: 100, height: 100, borderRadius: 10 }}
            lazy={true}
            fallback="/placeholder-property.jpg"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 18px 16px 0', minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#222', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatPrice(property.price)}</div>
          <div style={{ fontSize: 16, color: '#222', fontWeight: 600, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{property.title}</div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.2 }}>
            <span role="img" aria-label="address">📍</span> {property.address}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8, display: 'flex', gap: 14, lineHeight: 1.2 }}>
            <span>{property.area} м²</span>
            {property.floor && property.floors && (
              <span>{property.floor}/{property.floors} эт.</span>
            )}
            {property.type && <span>{property.type}</span>}
          </div>
          {/* Блок юридической чистоты */}
          {property.legalCheck && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
              <PropertySafetyOutlined style={{ fontSize: 18, color: property.legalCheck.status === 'Проверено' ? '#52c41a' : '#faad14' }} />
              <span style={{ fontWeight: 600, color: property.legalCheck.status === 'Проверено' ? '#52c41a' : '#faad14' }}>{property.legalCheck.status}</span>
              <span style={{ color: '#888', fontSize: 13 }}>{property.legalCheck.details}</span>
              {property.legalCheck.date && <span style={{ color: '#b0b6c3', fontSize: 12, marginLeft: 8 }}>{property.legalCheck.date}</span>}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            {property.agent?.photo ? (
              <img src={property.agent.photo} alt="Агент" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 4px #e6eaf1' }} />
            ) : (
              <UserOutlined style={{ fontSize: 26, color: '#b0b6c3', background: '#f5f7fa', borderRadius: '50%', padding: 2 }} />
            )}
            <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>{property.agent?.firstName} {property.agent?.lastName}</span>
            {property.agent?.phone && (
              <span style={{ fontSize: 14, color: '#1976d2', marginLeft: 8 }}>{property.agent.phone}</span>
            )}
          </div>
        </div>
        <AddToSelectionModal open={modalOpen} propertyId={property.id} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  if (mode === 'compact') {
    return (
      <div
        className={styles.glassCard}
        style={{ margin: 6, boxShadow: '0 2px 8px 0 rgba(10,37,64,0.06)', cursor: isModalActive ? 'default' : 'pointer', minWidth: 0, minHeight: 0, maxWidth: 360 }}
        {...(!isModalActive ? { onClick: handleCardClick } : {})}
      >
        <div className={styles.cardImage} style={{ height: 90, borderRadius: 10 }}>
          <OptimizedImage
            src={mainImage}
            alt={property.title}
            preview={false}
            width="100%"
            height={90}
            style={{ objectFit: 'cover', borderRadius: 10 }}
            lazy={true}
            fallback="/placeholder-property.jpg"
          />
        </div>
        <div className={styles.cardContent} style={{ padding: '10px 12px 8px 12px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.title}</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.address}</div>
          <div style={{ fontSize: 15, color: '#1976d2', fontWeight: 600, marginBottom: 2 }}>{formatPrice(property.price)}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>{property.area} м²</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.glassCard}
      style={{ margin: 12, boxShadow: '0 4px 24px 0 rgba(10,37,64,0.08)', cursor: isModalActive ? 'default' : 'pointer' }}
      {...(!isModalActive ? { onClick: handleCardClick } : {})}
    >
      <div className={styles.cardImage}>
        <OptimizedImage
          src={mainImage}
          alt={property.title}
          preview={false}
          width="100%"
          height={220}
          style={{ objectFit: 'cover', borderRadius: 16 }}
          lazy={true}
          fallback="/placeholder-property.jpg"
        />
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', gap: 8 }}>
          {canEditStatus ? (
            <Select
              size="small"
              value={property.status}
              style={{ minWidth: 110 }}
              onChange={val => onStatusChange && onStatusChange(property.id, val)}
              options={statusOptions}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <Tag color={currentStatus.color} style={{ fontWeight: 600, fontSize: 13 }}>{currentStatus.label}</Tag>
          )}
          {/* Плашка эксклюзивный объект всегда */}
          <Tag color="purple" style={{ fontWeight: 600, fontSize: 13 }}>Эксклюзивный объект</Tag>
        </div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardTitle}>{property.title}</div>
        <div className={styles.cardMeta}>{property.address}</div>
        <div className={styles.cardMeta}>{formatPrice(property.price)}</div>
        <div className={styles.cardMeta}>{property.area} м²</div>
        {/* Блок юридической чистоты */}
        {property.legalCheck && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
            <PropertySafetyOutlined style={{ fontSize: 20, color: property.legalCheck.status === 'Проверено' ? '#52c41a' : '#faad14' }} />
            <span style={{ fontWeight: 600, color: property.legalCheck.status === 'Проверено' ? '#52c41a' : '#faad14' }}>{property.legalCheck.status}</span>
            <span style={{ color: '#888', fontSize: 13 }}>{property.legalCheck.details}</span>
            {property.legalCheck.date && <span style={{ color: '#b0b6c3', fontSize: 12, marginLeft: 8 }}>{property.legalCheck.date}</span>}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          {property.agent?.photo ? (
            <img src={property.agent.photo} alt="Агент" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px #e6eaf1' }} />
          ) : (
            <UserOutlined style={{ fontSize: 32, color: '#b0b6c3', background: '#f5f7fa', borderRadius: '50%', padding: 4 }} />
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{property.agent?.firstName} {property.agent?.lastName}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{property.agent?.agency?.name || 'Частный агент'}</div>
            {property.agent?.phone && (
              <div style={{ fontSize: 14, color: '#1976d2', marginTop: 2 }}>{property.agent.phone}</div>
            )}
          </div>
        </div>
        <div className={styles.cardActions} style={{ justifyContent: 'flex-end', marginTop: 18 }}>
          <Tooltip title="Добавить в подбор">
            <Button
              shape="circle"
              icon={<PlusOutlined />}
              size="large"
              style={{ marginRight: 8 }}
              onClick={e => { e.stopPropagation(); setModalOpen(true); }}
            />
          </Tooltip>
          <Tooltip title="Позвонить агенту">
            <Button
              shape="circle"
              icon={<PhoneIcon />}
              size="large"
              onClick={e => { e.stopPropagation(); setPhoneModalOpen(true); }}
            />
          </Tooltip>
        </div>
      </div>
      <AddToSelectionModal open={modalOpen} propertyId={property.id} onClose={() => setModalOpen(false)} />
      <Modal
        open={phoneModalOpen}
        onCancel={(e: React.MouseEvent) => { e.stopPropagation(); setPhoneModalOpen(false); }}
        footer={null}
        title="Контакт агента"
        afterClose={() => {}}
        maskClosable={true}
        destroyOnClose
      >
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {property.agent?.firstName} {property.agent?.lastName}
        </div>
        <div style={{ fontSize: 16 }}>
          {property.agent?.phone || property.phone || 'Телефон не указан'}
        </div>
      </Modal>
    </div>
  );
};

const PhoneIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default PropertyCard;