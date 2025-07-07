import React, { useState, useContext, useEffect } from 'react';
import { Tabs, Input, Button, Avatar, Row, Col, Typography, Upload, message, Card, Select } from 'antd';
import { UserOutlined, HomeOutlined, FileTextOutlined, CreditCardOutlined, UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { updateProfile, getProfile } from '../services/auth.service';
import { uploadAvatar } from '../services/upload.service';
import InputMask from 'react-input-mask';

const { Title, Text } = Typography;

const subscriptionMock = {
  plan: 'Бизнес',
  price: '5000 ₽/месяц',
  nextPayment: '15.06.2023',
  features: [
    { text: 'Неограниченное количество объектов', ok: true },
    { text: 'Доступ к базе клиентов', ok: true },
    { text: 'Интеграция с порталами недвижимости', ok: true },
    { text: 'Аналитика и отчеты', ok: true },
    { text: 'Приоритетная поддержка', ok: true },
    { text: 'API для интеграции', ok: false },
  ],
  plans: [
    { name: 'Базовый', price: '2 000 ₽ / месяц', features: ['До 50 объектов', 'Базовая аналитика', 'Интеграция с порталами (нет)'], current: false },
    { name: 'Бизнес', price: '5 000 ₽ / месяц', features: ['Неограниченное количество объектов', 'Расширенная аналитика', 'Интеграция с порталами'], current: true },
    { name: 'Премиум', price: '10 000 ₽ / месяц', features: ['Все функции Бизнес-плана', 'Приоритетная поддержка 24/7', 'API для интеграции'], current: false },
  ],
};

const offerText = `
1. Общие положения\n1.1. Настоящий документ является публичной офертой (далее — «Оферта») ООО «РиэлтиПро» (далее — «Компания») и содержит все существенные условия использования программного обеспечения «РиэлтиПро» (далее — «Сервис»).\n1.2. В соответствии с пунктом 2 статьи 437 Гражданского Кодекса Российской Федерации (ГК РФ), в случае принятия изложенных ниже условий и оплаты услуг юридическое или физическое лицо, производящее акцепт этой оферты, становится Пользователем (в соответствии с пунктом 3 статьи 438 ГК РФ акцепт оферты равносилен заключению договора на условиях, изложенных в оферте).\n\n2. Предмет оферты\n2.1. Предметом настоящей Оферты является предоставление Пользователю доступа к использованию Сервиса на условиях, изложенных в настоящей Оферте.\n2.2. Сервис представляет собой программное обеспечение для автоматизации работы агентств недвижимости и риэлторов.\n\n3. Условия использования\n3.1. Пользователь обязуется использовать Сервис только в соответствии с условиями настоящей Оферты и не нарушать права других пользователей.\n3.2. Пользователь несет ответственность за сохранность своих учетных данных и за все действия, совершенные с использованием его учетной записи.\n\n4. Стоимость услуг и порядок расчетов\n...`;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', telegramUsername: '' });
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const agency = user?.agency || null;
  const [avatarHover, setAvatarHover] = useState(false);

  useEffect(() => {
    if (user) {
      setEditValues({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        telegramUsername: user.telegramUsername || '',
      });
    }
  }, [user]);

  if (authContext && authContext.user === undefined) {
    return <div style={{ padding: 32 }}>Загрузка...</div>;
  }
  if (!user) {
    return <div style={{ padding: 32 }}>Ошибка загрузки профиля. Попробуйте перезайти.</div>;
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user || !authContext?.token) return false;
    setUploading(true);
    try {
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Файл должен быть меньше 2MB!');
        return false;
      }
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Можно загружать только изображения!');
        return false;
      }
      const photoUrl = await uploadAvatar(file);
      await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        telegramUsername: user.telegramUsername,
        photo: photoUrl,
      });
      const freshProfile = await getProfile(authContext.token);
      authContext.setAuthData(authContext.token, freshProfile);
      localStorage.setItem('user', JSON.stringify(freshProfile));
      message.success({
        content: 'Аватар успешно обновлён!',
        duration: 3,
        icon: React.createElement(CheckCircleOutlined, { style: { color: '#52c41a' } }),
      });
    } catch (error) {
      console.error('Upload error:', error);
      message.error({
        content: 'Ошибка при обновлении аватара',
        duration: 4,
        icon: React.createElement(CloseCircleOutlined, { style: { color: '#ff4d4f' } }),
      });
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    if (user) {
      setEditValues({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        telegramUsername: user.telegramUsername || '',
      });
    }
    setIsEditing(false);
  };
  const handleChange = (field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };
  const handleSave = async () => {
    // Валидация телефона
    const phone = editValues.phone.replace(/[^\d]/g, '');
    if (editValues.phone && (phone.length !== 11 || editValues.phone.includes('_'))) {
      message.error('Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX');
      return;
    }
    try {
      await updateProfile({
        firstName: editValues.firstName,
        lastName: editValues.lastName,
        email: editValues.email,
        phone: editValues.phone,
        telegramUsername: editValues.telegramUsername,
        photo: user?.photo,
      });
      if (authContext?.token) {
        const freshProfile = await getProfile(authContext.token);
        authContext.setAuthData(authContext.token, freshProfile);
        localStorage.setItem('user', JSON.stringify(freshProfile));
      }
      message.success({
        content: 'Профиль обновлён!',
        duration: 3,
        icon: React.createElement(CheckCircleOutlined, { style: { color: '#52c41a' } }),
      });
      setIsEditing(false);
    } catch (error) {
      message.error({
        content: 'Ошибка при обновлении профиля',
        duration: 4,
        icon: React.createElement(CloseCircleOutlined, { style: { color: '#ff4d4f' } }),
      });
    }
  };

  // Вычисляем src для аватара: если есть thumbnail, используем его, иначе пробуем получить из photo
  let avatarSrc = user?.photo || user?.avatar || undefined;
  if (avatarSrc && typeof avatarSrc === 'string' && avatarSrc.includes('/avatars/') && !avatarSrc.includes('/thumbnails/')) {
    const thumb = avatarSrc.replace('/avatars/', '/avatars/thumbnails/');
    avatarSrc = thumb;
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>Мой профиль</h1>
      <style>{`
        @media (max-width: 767px) {
          .profile-main {
            flex-direction: column !important;
            gap: 16px !important;
            padding: 12px !important;
          }
          .ant-btn, .ant-input, .ant-select {
            font-size: 18px !important;
            height: 48px !important;
          }
          .ant-tabs-nav {
            flex-wrap: wrap !important;
          }
        }
      `}</style>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ background: 'transparent' }}
      >
        <Tabs.TabPane
          tab={<span><UserOutlined /> Мой профиль</span>}
          key="profile"
        >
          <div style={{ width: '100%', marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 32 }}>
              <div style={{
                width: 400,
                background: 'linear-gradient(135deg, #f7faff 60%, #e3f0ff 100%)',
                borderRadius: 32,
                boxShadow: '0 4px 32px #e6eaf1',
                padding: 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'box-shadow 0.3s',
              }}>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <Upload
                    name="file"
                    showUploadList={false}
                    beforeUpload={file => { handleAvatarUpload(file); return false; }}
                    accept="image/*"
                    disabled={uploading}
                  >
                    <div
                      style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}
                      onMouseEnter={() => setAvatarHover(true)}
                      onMouseLeave={() => setAvatarHover(false)}
                    >
                      <Avatar
                        size={180}
                        src={avatarSrc}
                        style={{ borderRadius: 24, width: 180, height: 180, objectFit: 'cover', boxShadow: '0 4px 24px #b3c6e0', background: '#f5f7fa' }}
                        shape="square"
                      >
                        {(!user?.photo && !user?.avatar && user?.firstName && user?.lastName) ? `${user.firstName[0]}${user.lastName[0]}` : null}
                      </Avatar>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 12,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}>
                        <span style={{
                          background: 'rgba(44,62,80,0.85)',
                          color: '#fff',
                          fontSize: 15,
                          fontWeight: 400,
                          borderRadius: 12,
                          padding: '4px 16px',
                          opacity: avatarHover ? 1 : 0,
                          transition: 'opacity 0.2s',
                          boxShadow: '0 2px 8px #2222',
                          pointerEvents: 'none',
                        }}>
                          Обновить фотографию
                        </span>
                      </div>
                    </div>
                  </Upload>
                </div>
                {isEditing ? (
                  <>
                    <Input
                      value={editValues.firstName}
                      onChange={e => handleChange('firstName', e.target.value)}
                      placeholder="Имя"
                      style={{ marginTop: 24, fontSize: 18, borderRadius: 10 }}
                      size="large"
                    />
                    <Input
                      value={editValues.lastName}
                      onChange={e => handleChange('lastName', e.target.value)}
                      placeholder="Фамилия"
                      style={{ marginTop: 12, fontSize: 18, borderRadius: 10 }}
                      size="large"
                    />
                    <InputMask
                      mask="+7 (999) 999-99-99"
                      maskChar={null}
                      value={editValues.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
                    >
                      {(inputProps: any) => (
                        <Input
                          {...inputProps}
                          placeholder="Телефон"
                          style={{ marginTop: 12, fontSize: 18, borderRadius: 10 }}
                          size="large"
                        />
                      )}
                    </InputMask>
                    <Input
                      value={editValues.telegramUsername}
                      onChange={e => handleChange('telegramUsername', e.target.value)}
                      placeholder="Telegram username (без @)"
                      style={{ marginTop: 12, fontSize: 18, borderRadius: 10 }}
                      size="large"
                    />
                    <Input
                      value={editValues.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder="Email"
                      style={{ marginTop: 12, fontSize: 18, borderRadius: 10 }}
                      size="large"
                    />
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                      <Button type="primary" onClick={handleSave} style={{ borderRadius: 10, fontWeight: 600 }}>Сохранить</Button>
                      <Button onClick={handleCancel} style={{ borderRadius: 10 }}>Отмена</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Title level={3} style={{ margin: '32px 0 8px 0', fontWeight: 700, letterSpacing: 0.5, textAlign: 'center' }}>
                      {user?.firstName} {user?.lastName}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 20, fontWeight: 500, marginBottom: 24, textAlign: 'center', display: 'block' }}>
                      {user?.role === 'director' ? 'Директор' : 'Агент'}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '8px 0 8px 0' }}>
                      {user?.telegramUsername && (
                        <a href={`https://t.me/${user.telegramUsername.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">
                          <img src="/telegram-icon.svg" alt="Telegram" style={{ width: 28, height: 28 }} />
                        </a>
                      )}
                      {user?.whatsappNumber && (
                        <a href={`https://wa.me/${user.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                          <img src="/whatsapp-icon.svg" alt="WhatsApp" style={{ width: 28, height: 28 }} />
                        </a>
                      )}
                    </div>
                    <div style={{ width: '100%', margin: '24px 0 0 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 8, color: '#222' }}>{user?.phone || <span style={{ color: '#bbb' }}>Телефон не указан</span>}</div>
                      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 8, color: '#222' }}>{user?.email}</div>
                    </div>
                    <Button
                      type="primary"
                      icon={<UserOutlined />}
                      style={{ marginTop: 32, minWidth: 220, height: 48, fontSize: 18, borderRadius: 14, fontWeight: 600, boxShadow: '0 2px 12px #b3c6e0', transition: 'box-shadow 0.3s', overflow: 'hidden', padding: '0 18px', whiteSpace: 'nowrap' }}
                      onClick={handleEdit}
                      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 24px #296fff44'}
                      onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px #b3c6e0'}
                    >
                      Редактировать профиль
                    </Button>
                  </>
                )}
              </div>
              <div style={{
                minWidth: 260,
                maxWidth: 320,
                background: '#fff',
                borderRadius: 24,
                boxShadow: '0 4px 24px #e6eaf1',
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                marginLeft: 0,
                marginTop: 0,
                height: 'fit-content',
              }}>
                <Title level={4} style={{ color: '#296fff', marginBottom: 12 }}>Агентство</Title>
                {agency ? (
                  <>
                    <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{agency.name}</div>
                    <div style={{ color: '#888', fontSize: 16 }}>ID: {agency.id}</div>
                  </>
                ) : (
                  <div style={{ color: '#888', fontSize: 16 }}>Частный агент</div>
                )}
              </div>
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={<span><CreditCardOutlined /> Подписка</span>}
          key="subscription"
        >
          <div style={{ width: '100%', marginTop: 24 }}>
            <Title level={4}>Управление подпиской</Title>
            <Text type="secondary">Информация о вашей текущей подписке и доступных планах</Text>
            <div style={{ marginTop: 24, marginBottom: 16 }}>
              <b>Текущий план: {subscriptionMock.plan}</b> <span style={{ color: '#888' }}>{subscriptionMock.price}</span><br />
              Следующее списание: {subscriptionMock.nextPayment}
            </div>
            <ul>
              {subscriptionMock.features.map((f, i) => (
                <li key={i} style={{ color: f.ok ? '#4caf50' : '#f44336' }}>{f.ok ? '✓' : '✗'} {f.text}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
              {subscriptionMock.plans.map((plan, i) => (
                <div key={i} style={{ border: plan.current ? '2px solid #296fff' : '1px solid #eee', minWidth: 220, flex: 1, padding: 16, borderRadius: 12 }}>
                  <b>{plan.name}</b><br />
                  <span style={{ color: '#888' }}>{plan.price}</span>
                  <ul style={{ marginTop: 8 }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ color: f.includes('нет') ? '#f44336' : '#222' }}>{f}</li>
                    ))}
                  </ul>
                  {plan.current ? <Button type="primary" disabled style={{ marginTop: 8 }}>Текущий план</Button> : <Button style={{ marginTop: 8 }}>Выбрать план</Button>}
                </div>
              ))}
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={<span><FileTextOutlined /> Оферта</span>}
          key="offer"
        >
          <div style={{ width: '100%', marginTop: 24 }}>
            <Title level={4}>Договор оферты</Title>
            <Text type="secondary">Ознакомьтесь с условиями использования платформы</Text>
            <pre style={{ marginTop: 24, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 16 }}>{offerText}</pre>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
} 