import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Avatar, Spin, Alert, Row, Col, Input, Carousel, Divider, Space } from 'antd';
import { getPropertyById } from '../services/property.service';
import { UserOutlined, PhoneOutlined, MessageOutlined, HomeOutlined } from '@ant-design/icons';
import { Property } from '../types';
import { AuthContext } from '../context/AuthContext';
import OptimizedImage from '../components/OptimizedImage';
import { ChatWidget } from '../components/ChatWidget';
import api from '../services/api';
import PropertySingleMapYandex from '../components/PropertySingleMapYandex';
import PropertyDetailsPageClean from './PropertyDetailsPageClean';

const { Title } = Typography;

const statusOptions = [
  { value: 'for_sale', label: 'В продаже', color: 'green' },
  { value: 'in_deal', label: 'На задатке', color: 'orange' },
  { value: 'reserved', label: 'На брони', color: 'blue' },
  { value: 'sold', label: 'Продан', color: 'red' },
];

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
    return ['/uploads', 'objects', 'thumbnails', ...parts.slice(3)].join('/');
  }
  return undefined;
}

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userChats, setUserChats] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  // Получаем id текущего пользователя и агента property
  const currentUserId = authContext?.user?.id;
  const agentId = property?.agent?.id;
  const propertyId = property?.id;

  const images = property ? normalizePhotos(property.photos) || property.images || [] : [];
  const agentName = property?.agent ? `${property.agent.firstName} ${property.agent.lastName}` : '—';
  const statusObj = statusOptions.find(opt => opt.value === property?.status) || statusOptions[0];

  // Обработчик для галереи
  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGalleryImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGalleryImageIndex((prev) => (prev + 1) % images.length);
  };
  const openGallery = (idx: number) => {
    setGalleryImageIndex(idx);
    setIsGalleryOpen(true);
  };
  const closeGallery = () => {
    setIsGalleryOpen(false);
    setGalleryImageIndex(0);
  };

  // useRef для контроля первого mount
  const didScrollToTop = useRef(false);

  // --- Эффекты выбора чата ---
  useEffect(() => {
    setLoading(true);
    setError(null);
    getPropertyById(id as string, authContext?.token || undefined)
      .then(async (data: Property) => {
        setProperty(data);
      })
      .catch((e) => {
        setError(e?.message || 'Ошибка загрузки объекта');
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!authContext?.token) return;
    setChatLoading(true);
    api.get('/api/chats', { headers: { Authorization: `Bearer ${authContext.token}` } })
      .then(res => {
        setUserChats(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setUserChats([]))
      .finally(() => setChatLoading(false));
  }, [authContext?.token]);

  useEffect(() => {
    if (!property || !authContext?.user) return;
    const isAgent = property.agent && authContext.user && property.agent.id === authContext.user.id;
    let foundChat = null;
    if (isAgent && property.agent) {
      foundChat = userChats.find(
        c => c.property?.id === property.id && c.seller?.id === property.agent?.id && c.buyer?.id !== property.agent?.id
      );
    } else if (authContext.user) {
      foundChat = userChats.find(
        c => c.property?.id === property.id && c.buyer?.id === authContext.user?.id
      );
    }
    setSelectedChat(foundChat || null);
  }, [property, userChats, authContext?.user]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // === ВРЕМЕННАЯ ДИАГНОСТИКА СКРОЛЛА С TRACE ===
  useEffect(() => {
    const onWindowScroll = () => {
      console.log('[DIAG] window.scrollY:', window.scrollY);
      console.trace('[DIAG] SCROLL TRACE');
    };
    window.addEventListener('scroll', onWindowScroll);
    // Проверяем scrollTop у всех крупных контейнеров
    setTimeout(() => {
      document.querySelectorAll('*').forEach(el => {
        if (el.scrollTop && el.scrollTop > 0) {
          // eslint-disable-next-line no-console
          console.log('[DIAG] SCROLL_CONTAINER:', el, 'scrollTop:', el.scrollTop);
        }
      });
    }, 300);
    return () => {
      window.removeEventListener('scroll', onWindowScroll);
    };
  }, []);

  // === ЖЁСТКИЙ СБРОС SCROLLY ПОСЛЕ ЗАГРУЗКИ ===
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      console.log('[DIAG] FORCED SCROLL TO TOP');
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  // === ОТКЛЮЧЕНИЕ scrollRestoration БРАУЗЕРА ===
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
      console.log('[DIAG] scrollRestoration set to manual');
    }
  }, []);

  // Форматирование цены с пробелами
  const formatPrice = (price?: number | string) => {
    const num = Number(price);
    if (!num || isNaN(num)) return '—';
    return num.toLocaleString('ru-RU') + ' руб';
  };

  // Обработчик для ChatWidget: если chatId получен, обновить selectedChat
  const handleChatIdResolved = (newChatId: number) => {
    if (!selectedChat && newChatId && authContext?.token) {
      // Перезапрашиваем чаты пользователя и обновляем selectedChat
      api.get('/api/chats', { headers: { Authorization: `Bearer ${authContext.token}` } })
        .then(res => {
          const chats = Array.isArray(res.data) ? res.data : [];
          setUserChats(chats);
          const found = chats.find(c => c.id === newChatId);
          if (found) setSelectedChat(found);
        })
        .catch(() => {});
    }
  };

  // ВРЕМЕННАЯ ЗАГЛУШКА для теста блока юридической чистоты
  if (property && !property.legalCheck) {
    const agencyName = property?.agent?.agency?.name || 'агентством';
    property.legalCheck = {
      status: 'clean',
      details: `Проверка проведена агентством «${agencyName}». Объект не имеет юридических ограничений.`,
      lastCheckedAt: '2024-06-30',
    };
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (error) return <Alert message={error} type="error" style={{ margin: 40 }} />;
  if (!property) return <Alert message="Объект не найден" type="error" style={{ margin: 40 }} />;

  // Если пользователь — агент объекта, показываем информативное сообщение
  const isAgent = property.agent && authContext?.user && property.agent.id === authContext.user.id;

  // Логирование в рендере для диагностики
  console.log('[RENDER] property:', property);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0' }}>
      <Row gutter={[40, 32]}>
        <Col xs={24} md={14} style={{ height: '80vh', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* --- НОВЫЙ ДИЗАЙН ГАЛЕРЕИ И ОПИСАНИЯ --- */}
          <section style={{ width: '100%', maxWidth: 900, margin: '0 auto', marginTop: 24 }}>
            {/* Галерея */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', minHeight: 480, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px #e6eaf1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {images && images.length > 0 && (
                <>
                  <img
                    src={images[galleryImageIndex] || '/placeholder-property.jpg'}
                    alt={property.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22, transition: 'filter 0.2s', filter: isGalleryOpen ? 'brightness(0.7)' : 'none' }}
                  />
                  {/* Кнопки навигации */}
                  {images.length > 1 && (
                    <>
                      <button onClick={handlePrev} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>&lt;</button>
                      <button onClick={handleNext} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>&gt;</button>
                    </>
                  )}
                  {/* Счётчик фото */}
                  <div style={{ position: 'absolute', top: 18, right: 28, background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 10, padding: '3px 14px', fontSize: 16, fontWeight: 600 }}>{galleryImageIndex + 1} / {images.length}</div>
                </>
              )}
            </div>
            {/* Превьюшки под фото с горизонтальным скроллом */}
            {images && images.length > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                margin: '16px 0 0 0',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                padding: '4px 0',
                scrollbarWidth: 'thin',
                msOverflowStyle: 'none',
              }}>
                {images.map((img, idx) => (
                  <img
                    key={img + idx}
                    src={getThumbnail(img) || img}
                    alt={`Фото ${idx + 1}`}
                    style={{
                      width: 80,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: idx === galleryImageIndex ? '3px solid #2563eb' : '2px solid #fff',
                      boxShadow: idx === galleryImageIndex ? '0 0 12px #2563eb55' : '0 2px 8px #0002',
                      cursor: 'pointer',
                      opacity: idx === galleryImageIndex ? 1 : 0.7,
                      transition: 'all 0.2s',
                      marginRight: 0,
                      display: 'inline-block',
                    }}
                    onClick={e => { e.stopPropagation(); setGalleryImageIndex(idx); }}
                  />
                ))}
              </div>
            )}
            {/* Описание */}
            <div style={{ margin: '32px 0 0 0' }}>
              <div style={{ fontWeight: 800, fontSize: 32, marginBottom: 6 }}>{property.title}</div>
              <div style={{ color: '#888', fontSize: 20, marginBottom: 14 }}>{property.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <Tag color={statusObj.color} style={{ fontWeight: 600, fontSize: 16, padding: '4px 18px', borderRadius: 8 }}>{statusObj.label}</Tag>
                <Tag color="purple" style={{ fontWeight: 600, fontSize: 16, borderRadius: 8 }}>Эксклюзивный объект</Tag>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary-color)', marginLeft: 18 }}>
                  {formatPrice(property.price)}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 36, marginBottom: 22, fontSize: 18 }}>
                <div><b>Площадь:</b> {property.area ?? '—'} м²</div>
                <div><b>Спальни:</b> {property.bedrooms ?? '—'}</div>
                <div><b>Ванные:</b> {property.bathrooms ?? '—'}</div>
                <div><b>Тип:</b> {property.type || '—'}</div>
                <div><b>Этаж:</b> {property.floor ?? '—'} из {property.totalFloors ?? '—'}</div>
                <div><b>Цена за м²:</b> {property.pricePerM2 ? `${property.pricePerM2.toLocaleString()} ₽` : '—'}</div>
              </div>
              <div style={{ fontSize: 19, color: '#444', marginBottom: 10, fontWeight: 700 }}>Описание</div>
              <div style={{ fontSize: 17, color: '#555', marginBottom: 0 }}>{property.description || 'Описание отсутствует'}</div>
            </div>
            {/* Юридическая чистота объекта */}
            {property.legalCheck && (
              <div style={{ margin: '28px 0', padding: 18, background: '#f4f6fa', borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <span style={{ fontSize: 32, color: property.legalCheck.status === 'clean' ? '#22c55e' : property.legalCheck.status === 'encumbered' ? '#f59e42' : '#888' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                    {property.legalCheck.status === 'clean' && 'Юридическая чистота подтверждена'}
                    {property.legalCheck.status === 'encumbered' && 'Есть юридические ограничения'}
                    {property.legalCheck.status === 'unknown' && 'Нет данных о юридической чистоте'}
                  </div>
                  {property.legalCheck.details && (
                    <div style={{ color: '#555', fontSize: 16 }}>{property.legalCheck.details}</div>
                  )}
                  {property.legalCheck.lastCheckedAt && (
                    <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Проверено: {property.legalCheck.lastCheckedAt}</div>
                  )}
                </div>
              </div>
            )}
          </section>
          {/* Блок расположения объекта */}
          <Divider style={{ margin: '0 0 18px 0' }} />
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Расположение объекта</div>
          <div style={{ color: '#888', fontSize: 16, marginBottom: 10 }}>{property.address}</div>
          {/* Карта в стиле Авито: aspect-ratio 4/3, maxWidth 900px, minHeight 400px, крупная */}
          {/* ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ТЕСТА СКРОЛЛА */}
          {/*
          {typeof property.lat === 'number' && typeof property.lng === 'number' && !isNaN(property.lat) && !isNaN(property.lng) ? (
            <div
              style={{
                width: '100%',
                maxWidth: 900,
                aspectRatio: '4 / 3',
                minHeight: 400,
                borderRadius: 22,
                overflow: 'hidden',
                boxShadow: '0 8px 32px #e6eaf1',
                margin: '0 0 28px 0',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PropertySingleMapYandex lat={property.lat} lng={property.lng} address={property.address} style={{ width: '100%', height: '100%' }} />
            </div>
          ) : (
            <div style={{ color: 'red', marginBottom: 12, fontWeight: 600 }}>
              Координаты для карты не определены или невалидны
            </div>
          )}
          */}
          <div style={{ width: '100%', maxWidth: 900, aspectRatio: '4 / 3', minHeight: 400, borderRadius: 22, boxShadow: '0 8px 32px #e6eaf1', margin: '0 0 28px 0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 22, fontWeight: 600 }}>
            Карта временно отключена для теста скролла
          </div>
        </Col>
        <Col xs={24} md={10}>
          {/* Блок информации об агенте */}
          {property.agent && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: '#f8fafc',
              borderRadius: 16,
              boxShadow: '0 2px 8px #e6eaf1',
              padding: '18px 24px',
              marginBottom: 18,
            }}>
              {property.agent.photo ? (
                <Avatar size={48} src={property.agent.photo} style={{ background: '#f2f3f5', fontWeight: 700 }} />
              ) : (
                <Avatar size={48} style={{ background: '#f2f3f5', fontWeight: 700 }}>
                  {property.agent.firstName ? property.agent.firstName[0] : 'A'}
                </Avatar>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>
                  {property.agent.lastName} {property.agent.firstName}
                </div>
                <div style={{ color: '#888', fontSize: 15, margin: '2px 0 4px 0' }}>
                  {property.agent.agency?.name || 'Частный агент'}
                </div>
                <div style={{ color: '#2563eb', fontSize: 16, fontWeight: 600 }}>
                  {property.agent.phone || 'Телефон не указан'}
                </div>
              </div>
            </div>
          )}
          <Card style={{
            borderRadius: 22,
            marginBottom: 28,
            boxShadow: '0 8px 32px 0 rgba(40,60,90,0.13)',
            background: 'linear-gradient(120deg, #f8fafc 60%, #e0e7ef 100%)',
            border: 'none',
            backdropFilter: 'blur(6px)',
            padding: 0,
            overflow: 'visible',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, padding: '18px 24px 0 24px' }}>
              <MessageOutlined style={{ fontSize: 28, color: '#2563eb', background: '#e0e7ef', borderRadius: '50%', padding: 6, marginRight: 6, boxShadow: '0 2px 8px #e6eaf1' }} />
              <Title level={4} style={{ margin: 0, color: '#222', fontWeight: 800, fontSize: 22, letterSpacing: -1 }}>Чат по объекту</Title>
              <div style={{ flex: 1 }} />
              <Avatar size={32} src={property.agent?.photo} style={{ background: '#f2f3f5', fontWeight: 700, marginRight: 2 }}>{property.agent?.firstName ? property.agent.firstName[0] : 'A'}</Avatar>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>{property.agent?.firstName}</span>
            </div>
            <div style={{ color: '#555', margin: '0 24px 16px 24px', fontSize: 15, background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 14px', fontWeight: 500, boxShadow: '0 2px 8px #e6eaf1' }}>
              Общайтесь с агентом по этому объекту. Все сообщения приватны и доступны только участникам сделки.
            </div>
            <div style={{ margin: '0 24px 18px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {property.agent?.phone && (
                <a href={`tel:${property.agent.phone}`} style={{ textDecoration: 'none' }}>
                  <Button
                    type="primary"
                    icon={<PhoneOutlined />}
                    style={{
                      background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 16,
                      borderRadius: 10,
                      boxShadow: '0 2px 8px #e6eaf1',
                      height: 44,
                      padding: '0 22px',
                      transition: 'background 0.2s',
                    }}
                  >
                    Позвонить
                  </Button>
                </a>
              )}
            </div>
            <div style={{ margin: '0 0 0 0', maxHeight: 340, minHeight: 220, overflowY: 'auto', borderRadius: 16, background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 8px #e6eaf1' }}>
              <ChatWidget
                chatId={selectedChat?.id}
                userId={authContext?.user?.id || 0}
                jwt={authContext?.token || ''}
                propertyId={property.id}
                sellerId={selectedChat?.seller?.id || property.agent?.id || 0}
                buyerId={selectedChat?.buyer?.id || (!property.agent || property.agent.id !== authContext?.user?.id ? authContext?.user?.id : undefined)}
                onChatIdResolved={handleChatIdResolved}
                limitLastN={5}
              />
            </div>
          </Card>
        </Col>
      </Row>
      {isGalleryOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'background 0.3s',
          }}
          onClick={closeGallery}
        >
          <div
            style={{
              background: 'transparent',
              padding: 0,
              borderRadius: 10,
              maxWidth: Math.min(window.innerWidth * 0.9, 1000),
              maxHeight: '80vh',
              overflow: 'visible',
              position: 'relative',
              boxShadow: '0 8px 32px #000a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={images[galleryImageIndex]}
              alt={property?.title}
              style={{
                width: '100%',
                maxWidth: 800,
                maxHeight: '60vh',
                objectFit: 'contain',
                background: '#222',
                display: 'block',
                borderRadius: 14,
                margin: '0 auto',
                boxShadow: '0 8px 32px #000a',
                transition: 'box-shadow 0.2s',
              }}
            />
            {/* Превью всех фото */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'center' }}>
                {images.map((img, idx) => (
                  <img
                    key={img + idx}
                    src={img}
                    alt={`Фото ${idx + 1}`}
                    style={{
                      width: 70,
                      height: 54,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: idx === galleryImageIndex ? '3px solid #1976d2' : '2px solid #fff',
                      boxShadow: idx === galleryImageIndex ? '0 0 8px #1976d2' : '0 2px 8px #0002',
                      cursor: 'pointer',
                      opacity: idx === galleryImageIndex ? 1 : 0.7,
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setGalleryImageIndex(idx)}
                  />
                ))}
              </div>
            )}
            {/* Стрелки */}
            {images.length > 1 && (
              <>
                <button onClick={handlePrev} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>&lt;</button>
                <button onClick={handleNext} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>&gt;</button>
              </>
            )}
            <div style={{ position: 'absolute', top: 18, right: 32, background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 10, padding: '3px 14px', fontSize: 16, fontWeight: 600 }}>{galleryImageIndex + 1} / {images.length}</div>
            <button onClick={closeGallery} style={{ position: 'absolute', top: 18, left: 32, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: 10, padding: '3px 14px', fontSize: 18, fontWeight: 600, cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsPageClean;