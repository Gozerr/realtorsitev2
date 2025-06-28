import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Avatar, Spin, Alert, Row, Col, Input, Carousel, Divider, Space, Modal, message } from 'antd';
import { getPropertyById } from '../services/property.service';
import { UserOutlined, PhoneOutlined, MessageOutlined, HomeOutlined } from '@ant-design/icons';
import { Property } from '../types';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { createOrGetConversation } from '../services/chat.service';

const { Title } = Typography;

const statusOptions = [
  { value: 'for_sale', label: 'В продаже', color: 'green' },
  { value: 'in_deal', label: 'На задатке', color: 'orange' },
  { value: 'reserved', label: 'На брони', color: 'blue' },
  { value: 'sold', label: 'Продан', color: 'red' },
];

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const chatContext = useContext(ChatContext);
  const authContext = useContext(AuthContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Автоматически выбрать/создать чат с агентом
  useEffect(() => {
    setLoading(true);
    setError(null);
    getPropertyById(id as string, authContext?.token || undefined)
      .then(async (data: Property) => {
        setProperty(data);
        // Только если пользователь НЕ агент — инициируем чат
        if (data.agent && authContext?.user && data.agent.id !== authContext.user.id) {
          try {
            const conv = await createOrGetConversation(data.agent.id, data.id);
            chatContext.selectConversation(conv);
            // Гарантированно подгружаем сообщения после создания чата
            const msgs = await import('../services/chat.service').then(m => m.getMessages(conv.id));
            console.log('[PropertyDetailsPage] messages after chat creation:', msgs);
          } catch (chatErr) {
            console.error('Ошибка при инициализации чата:', chatErr);
            chatContext.selectConversation(null);
          }
        } else {
          // Для агента не инициируем чат!
          chatContext.selectConversation(null);
        }
      })
      .catch((e) => {
        setError(e?.message || 'Ошибка загрузки объекта');
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatContext.messages.length, chatContext.selectedConversation?.id]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    chatContext.sendMessage(chatInput);
    setChatInput('');
  };

  const handleStartChat = async () => {
    if (property && property.agent && authContext?.user && property.agent.id !== authContext.user.id) {
      const conv = await createOrGetConversation(property.agent.id, property.id);
      chatContext.selectConversation(conv);
    }
  };

  const images = property?.photos || property?.images || [];
  const agentName = property?.agent ? `${property.agent.firstName} ${property.agent.lastName}` : '—';
  const statusObj = statusOptions.find(opt => opt.value === property?.status) || statusOptions[0];
  // Кнопка и чат доступны для любого пользователя, кроме самого агента этого объекта
  const isChatAvailable = property?.agent && authContext?.user && property.agent.id !== authContext.user.id;

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };
  const openGallery = (idx: number) => {
    setCurrentImage(idx);
    setIsGalleryOpen(true);
  };
  const closeGallery = () => setIsGalleryOpen(false);

  // Если пользователь — агент, и появился чат по этому объекту, автоматически выбираем его
  useEffect(() => {
    if (
      property &&
      property.agent &&
      authContext?.user &&
      property.agent.id === authContext.user.id
    ) {
      const conv = chatContext.conversations.find(
        c => c.property && String(c.property.id) === String(property.id)
      );
      console.log('[PropertyDetailsPage] conversations:', chatContext.conversations);
      console.log('[PropertyDetailsPage] property:', property);
      console.log('[PropertyDetailsPage] selectedConversation:', chatContext.selectedConversation);
      if (
        conv &&
        (!chatContext.selectedConversation ||
          chatContext.selectedConversation.id !== conv.id ||
          String(chatContext.selectedConversation.property.id) !== String(property.id))
      ) {
        console.log('[PropertyDetailsPage] Автовыбор чата:', conv);
        chatContext.selectConversation(conv);
      }
    }
  }, [chatContext.conversations, property, authContext?.user]);

  // Автовыбор чата по propertyId при появлении нового чата
  useEffect(() => {
    if (
      property &&
      chatContext.conversations.length > 0 &&
      !chatContext.selectedConversation
    ) {
      const conv = chatContext.conversations.find(
        c => c.property && String(c.property.id) === String(property.id)
      );
      if (conv) {
        chatContext.selectConversation(conv);
      }
    }
  }, [chatContext.conversations, property, chatContext.selectedConversation]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (error) return <Alert message={error} type="error" style={{ margin: 40 }} />;
  if (!property) return <Alert message="Объект не найден" type="error" style={{ margin: 40 }} />;

  // Если пользователь — агент объекта, показываем информативное сообщение
  const isAgent = property.agent && authContext?.user && property.agent.id === authContext.user.id;

  // Логирование в рендере для диагностики
  console.log('[RENDER] selectedConversation:', chatContext.selectedConversation);
  console.log('[RENDER] property:', property);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0' }}>
      <Row gutter={[40, 32]}>
        <Col xs={24} md={14}>
          <Card
            style={{ borderRadius: 18, boxShadow: '0 4px 32px rgba(40,60,90,0.10)', marginBottom: 32, padding: 0 }}
            bodyStyle={{ padding: 0 }}
          >
            {images.length > 0 ? (
              <div style={{ position: 'relative', width: '100%', height: 380, overflow: 'hidden', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={images[currentImage]}
                  alt={property.title}
                  style={{ width: '100%', height: 380, objectFit: 'cover', borderRadius: 18, cursor: 'pointer', transition: 'filter 0.2s', filter: isGalleryOpen ? 'brightness(0.7)' : 'none' }}
                  onClick={() => openGallery(currentImage)}
                />
                {images.length > 1 && (
                  <>
                    <button onClick={handlePrev} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.65)')} onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}>&lt;</button>
                    <button onClick={handleNext} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.65)')} onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}>&gt;</button>
                  </>
                )}
                <div style={{ position: 'absolute', bottom: 12, right: 18, background: 'rgba(0,0,0,0.45)', color: '#fff', borderRadius: 12, padding: '2px 14px', fontSize: 15, fontWeight: 500 }}>{currentImage + 1} / {images.length}</div>
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: 380,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18
              }}>
                <HomeOutlined style={{ fontSize: 64, color: '#ccc' }} />
              </div>
            )}
          </Card>
          <Card style={{ borderRadius: 18, marginBottom: 24, boxShadow: '0 2px 12px rgba(40,60,90,0.06)' }}>
            <Title level={2} style={{ marginBottom: 0 }}>{property.title}</Title>
            <div style={{ color: '#888', marginBottom: 8, fontSize: 17 }}>{property.address}</div>
            <Space size="large" style={{ marginBottom: 16, marginTop: 8 }}>
              <Tag color={statusObj.color} style={{ fontWeight: 600, fontSize: 16, padding: '4px 18px', borderRadius: 8 }}>{statusObj.label}</Tag>
              {property.isExclusive && <Tag color="purple" style={{ fontWeight: 600, fontSize: 16, borderRadius: 8 }}>Эксклюзив</Tag>}
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-color)', marginLeft: 12 }}>
                {property.price?.toLocaleString()} ₽
              </span>
            </Space>
            <Divider />
            <Row gutter={32}>
              <Col span={12}>
                <div style={{ fontSize: 17, marginBottom: 8 }}><b>Площадь:</b> {property.area ?? '—'} м²</div>
                <div style={{ fontSize: 17, marginBottom: 8 }}><b>Тип:</b> {property.type || '—'}</div>
                <div style={{ fontSize: 17, marginBottom: 8 }}><b>Этаж:</b> {property.floor ?? '—'} из {property.totalFloors ?? '—'}</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 17, marginBottom: 8 }}><b>Спальни:</b> {property.bedrooms ?? '—'}</div>
                <div style={{ fontSize: 17, marginBottom: 8 }}><b>Ванные:</b> {property.bathrooms ?? '—'}</div>
                <div style={{ fontSize: 17, marginBottom: 8 }}><b>Цена за м²:</b> {property.pricePerM2 ? `${property.pricePerM2.toLocaleString()} ₽` : '—'}</div>
              </Col>
            </Row>
            <Divider />
            <div style={{ fontSize: 17, color: '#444', marginBottom: 8 }}><b>Описание:</b></div>
            <div style={{ fontSize: 16, color: '#555', marginBottom: 0 }}>{property.description || 'Описание отсутствует'}</div>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card style={{ borderRadius: 18, marginBottom: 24, boxShadow: '0 2px 12px rgba(40,60,90,0.06)' }}>
            <Title level={4} style={{ marginBottom: 18 }}>Агент по недвижимости</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Avatar
                size={64}
                src={property.agent?.photo}
                icon={<UserOutlined />}
                style={{ boxShadow: '0 2px 8px #e6eaf1' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{agentName}</div>
                {property.agent?.phone && (
                  <div style={{ color: '#1976d2', fontSize: 17, margin: '4px 0', fontWeight: 500 }}><PhoneOutlined /> {property.agent.phone}</div>
                )}
                <div style={{ color: '#888', fontSize: 15 }}>{property.agent?.email || '—'}</div>
              </div>
            </div>
            <Button type="primary" icon={<PhoneOutlined />} style={{ marginBottom: 12, width: '100%', fontWeight: 600, fontSize: 17, height: 48, borderRadius: 10 }}>Позвонить</Button>
          </Card>
          {isAgent ? (
            chatContext.selectedConversation && property.agent && chatContext.selectedConversation.property && String(chatContext.selectedConversation.property.id) === String(property.id) ? (
              <Card title="Чат с клиентом" style={{ borderRadius: 18, boxShadow: '0 2px 12px rgba(40,60,90,0.06)' }}>
                <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
                  {chatContext.messages.map((msg, idx) => (
                    <div key={msg.id || idx} style={{ textAlign: msg.author?.id === authContext?.user?.id ? 'right' : 'left', marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-block',
                        background: msg.author?.id === authContext?.user?.id ? '#e6f7ff' : '#f5f5f5',
                        borderRadius: 8,
                        padding: '6px 12px',
                        maxWidth: 220
                      }}>
                        {msg.content}
                      </span>
                      <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>{msg.author?.firstName} {msg.author?.lastName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {(() => {
                  // Поле для ввода всегда активно, но если агент пишет сам себе — будет ошибка
                  return (
                    <Input.Search
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onSearch={handleSendMessage}
                      enterButton
                      placeholder="Введите сообщение..."
                    />
                  );
                })()}
              </Card>
            ) : (
              <Card style={{ borderRadius: 18, boxShadow: '0 2px 12px rgba(40,60,90,0.06)' }}>
                <div style={{ fontSize: 17, color: '#888', textAlign: 'center', padding: '32px 0' }}>
                  Чат появится здесь, когда кто-то напишет вам по этому объекту.
                </div>
              </Card>
            )
          ) : (
            chatContext.selectedConversation && property.agent && chatContext.selectedConversation.property && String(chatContext.selectedConversation.property.id) === String(property.id) && (
              <Card title="Чат с агентом" style={{ borderRadius: 18, boxShadow: '0 2px 12px rgba(40,60,90,0.06)' }}>
                <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
                  {chatContext.messages.map((msg, idx) => (
                    <div key={msg.id || idx} style={{ textAlign: msg.author?.id === authContext?.user?.id ? 'right' : 'left', marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-block',
                        background: msg.author?.id === authContext?.user?.id ? '#e6f7ff' : '#f5f5f5',
                        borderRadius: 8,
                        padding: '6px 12px',
                        maxWidth: 220
                      }}>
                        {msg.content}
                      </span>
                      <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>{msg.author?.firstName} {msg.author?.lastName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {(() => {
                  // Поле для ввода всегда активно, но если агент пишет сам себе — будет ошибка
                  return (
                    <Input.Search
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onSearch={handleSendMessage}
                      enterButton
                      placeholder="Введите сообщение..."
                    />
                  );
                })()}
              </Card>
            )
          )}
        </Col>
      </Row>
      {/* Модальное окно-галерея */}
      <Modal
        open={isGalleryOpen}
        onCancel={closeGallery}
        footer={null}
        centered
        width={Math.min(window.innerWidth * 0.8, 900)}
        bodyStyle={{
          background: '#111',
          padding: 0,
          borderRadius: 18,
          textAlign: 'center',
          height: '70vh',
          overflow: 'hidden'
        }}
        style={{ top: 40, left: 0, margin: 0, padding: 0 }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111'
        }}>
          <img
            src={images[currentImage]}
            alt={property?.title}
            style={{
              width: 'calc(100% - 64px)',
              height: 'calc(100% - 64px)',
              objectFit: 'contain',
              background: '#222',
              display: 'block',
              borderRadius: 14,
              margin: '0 auto',
              boxShadow: '0 8px 32px #000a'
            }}
          />
          {images.length > 1 && (
            <>
              <button onClick={handlePrev} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 22, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>&lt;</button>
              <button onClick={handleNext} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 22, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 16px #0006', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>&gt;</button>
            </>
          )}
          <div style={{ position: 'absolute', bottom: 18, right: 32, background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 10, padding: '3px 14px', fontSize: 16, fontWeight: 600 }}>{currentImage + 1} / {images.length}</div>
        </div>
      </Modal>
    </div>
  );
};

export default PropertyDetailsPage;