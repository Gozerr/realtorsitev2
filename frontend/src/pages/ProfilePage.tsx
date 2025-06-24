import React, { useState, useContext, useEffect } from 'react';
import { Tabs, Input, Button, Avatar, Row, Col, Typography, Upload, message, Card, Select } from 'antd';
import { UserOutlined, HomeOutlined, FileTextOutlined, CreditCardOutlined, UploadOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { updateProfile } from '../services/auth.service';
import { uploadAvatar } from '../services/upload.service';

const { Title, Text } = Typography;

export const userMock = {
  firstName: 'Иван',
  lastName: 'Иванов',
  phone: '+7 (999) 123-45-67',
  email: 'ivanov@realty.ru',
  about: 'Риэлтор с 5-летним опытом работы. Специализируюсь на продаже жилой недвижимости в центральном районе.',
};

export const agencyMock = {
  name: 'Лидер Недвижимость',
  address: 'г. Москва, ул. Тверская, 10',
  phone: '+7 (495) 123-45-67',
  email: 'info@lider-realty.ru',
  website: 'lider-realty.ru',
  description: 'Агентство недвижимости "Лидер" работает на рынке с 2010 года. Мы специализируемся на продаже и аренде жилой и коммерческой недвижимости.',
};

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

const profileMock = {
  name: 'Медведева Мария Александровна',
  photo: 'https://olimp.vtcrm.ru/uploads/User_photos/phpXxFFcI.jpeg',
  phone: '+7(930)137-50-17',
  email: '9301375017R@gmail.com',
  telegram: 'https://t.me/+79301375017',
  position: 'Агент Ярославля',
  birthdate: '08.02.95',
};

const tabItems = [
  {
    key: 'profile',
    label: <span><UserOutlined /> Мой профиль</span>,
    children: (
      <div style={{ width: '100%', marginTop: 24 }}>
        <Title level={4}>Личная информация</Title>
        <Text type="secondary">Ваши данные из CRM</Text>
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar size={80} src={profileMock.photo} />
          </Col>
          <Col span={20}>
            <Title level={5} style={{ margin: 0 }}>{profileMock.name}</Title>
            <Text type="secondary">{profileMock.position}</Text>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}><Input value={profileMock.phone} disabled addonBefore="Телефон" /></Col>
              <Col span={12}><Input value={profileMock.email} disabled addonBefore="Email" /></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Input value={profileMock.telegram} disabled addonBefore="Telegram" /></Col>
              <Col span={12}><Input value={profileMock.birthdate} disabled addonBefore="Дата рождения" /></Col>
            </Row>
          </Col>
        </Row>
        <Button type="primary" style={{ marginTop: 24 }}>Редактировать</Button>
      </div>
    ),
  },
  {
    key: 'agency',
    label: <span><HomeOutlined /> Агентство</span>,
    children: (
      <div style={{ width: '100%', marginTop: 24 }}>
        <Title level={4}>Информация об агентстве</Title>
        <Text type="secondary">Данные вашего агентства недвижимости</Text>
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar size={80} icon={<HomeOutlined />} />
          </Col>
          <Col span={20}>
            <Row gutter={16}>
              <Col span={12}><Input value={agencyMock.name} disabled addonBefore="Название" /></Col>
              <Col span={12}><Input value={agencyMock.address} disabled addonBefore="Адрес" /></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Input value={agencyMock.phone} disabled addonBefore="Телефон" /></Col>
              <Col span={12}><Input value={agencyMock.email} disabled addonBefore="Email" /></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Input value={agencyMock.website} disabled addonBefore="Веб-сайт" /></Col>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Col span={24}>
                <div style={{ marginBottom: 4, color: '#888' }}>Описание</div>
                <Input.TextArea value={agencyMock.description} disabled rows={2} />
              </Col>
            </Row>
          </Col>
        </Row>
        <Button type="primary" style={{ marginTop: 24 }}>Редактировать</Button>
      </div>
    ),
  },
  {
    key: 'subscription',
    label: <span><CreditCardOutlined /> Подписка</span>,
    children: (
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
    ),
  },
  {
    key: 'offer',
    label: <span><FileTextOutlined /> Оферта</span>,
    children: (
      <div style={{ width: '100%', marginTop: 24 }}>
        <Title level={4}>Договор оферты</Title>
        <Text type="secondary">Ознакомьтесь с условиями использования платформы</Text>
        <pre style={{ marginTop: 24, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 16 }}>{offerText}</pre>
      </div>
    ),
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ firstName: '', lastName: '', email: '', role: '' });
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  useEffect(() => {
    if (user) {
      setEditValues({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return false;
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
      const updatedUser = await updateProfile({ photo: photoUrl });
      authContext?.setAuthData(authContext.token, updatedUser);
      message.success('Аватар успешно обновлен!');
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Ошибка при обновлении аватара');
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
        role: user.role || '',
      });
    }
    setIsEditing(false);
  };
  const handleChange = (field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };
  const handleSave = async () => {
    try {
      const updatedUser = await updateProfile({
        ...editValues,
        role: editValues.role as 'agent' | 'director',
      });
      authContext?.setAuthData(authContext.token, updatedUser);
      message.success('Профиль обновлен!');
      setIsEditing(false);
    } catch (error) {
      message.error('Ошибка при обновлении профиля');
    }
  };

  const dynamicTabItems = tabItems.map(item => {
    if (item.key === 'profile') {
      return {
        ...item,
        children: (
          <div style={{ width: '100%', marginTop: 24 }}>
            <Card
              style={{
                width: '100%',
                maxWidth: '100%',
                borderRadius: 24,
                boxShadow: '0 4px 32px #e6eaf1',
                background: 'linear-gradient(135deg, #f7faff 60%, #e3f0ff 100%)',
                padding: 32,
                border: 'none',
                marginBottom: 32,
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Title level={3} style={{ marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>
                Личная информация
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Ваши данные из системы
              </Text>
              <Row gutter={32} style={{ marginTop: 32, alignItems: 'center' }}>
                <Col span={4} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar 
                    size={140} 
                    src={user?.photo} 
                    icon={<UserOutlined />} 
                    style={{ 
                      boxShadow: '0 2px 12px #b3c6e0', 
                      marginBottom: 12, 
                      borderRadius: 20, 
                      width: 140, 
                      height: 140, 
                      objectFit: 'cover', 
                    }} 
                    shape="square"
                  />
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={handleAvatarUpload}
                    accept="image/*"
                  >
                    <Button 
                      icon={<UploadOutlined />} 
                      size="middle" 
                      style={{ marginTop: 4, fontWeight: 500 }}
                      loading={uploading}
                    >
                      Загрузить фото
                    </Button>
                  </Upload>
                </Col>
                <Col span={20}>
                  <Title level={4} style={{ margin: 0, fontWeight: 600, fontSize: 26 }}>
                    {isEditing ? (
                      <Input
                        value={editValues.firstName}
                        onChange={e => handleChange('firstName', e.target.value)}
                        style={{ fontSize: 22, fontWeight: 600, width: 180, marginRight: 8 }}
                        placeholder="Имя"
                      />
                    ) : user?.firstName}{' '}
                    {isEditing ? (
                      <Input
                        value={editValues.lastName}
                        onChange={e => handleChange('lastName', e.target.value)}
                        style={{ fontSize: 22, fontWeight: 600, width: 180 }}
                        placeholder="Фамилия"
                      />
                    ) : user?.lastName}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 18, fontWeight: 500 }}>
                    {isEditing ? (
                      <Select
                        value={editValues.role}
                        onChange={value => handleChange('role', value)}
                        style={{ fontSize: 16, width: 180, marginRight: 8 }}
                        options={[
                          { value: 'agent', label: 'Агент' },
                          { value: 'director', label: 'Директор' },
                        ]}
                      />
                    ) : user?.role === 'director' ? 'Директор' : 'Агент'}
                  </Text>
                  <Row gutter={16} style={{ marginTop: 20 }}>
                    <Col span={12}>
                      <Input
                        value={isEditing ? editValues.email : user?.email || ''}
                        onChange={e => handleChange('email', e.target.value)}
                        disabled={!isEditing}
                        addonBefore="Email"
                        size="large"
                        style={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={12}>
                      {isEditing ? (
                        <Select
                          value={editValues.role}
                          onChange={value => handleChange('role', value)}
                          disabled={!isEditing}
                          style={{ fontSize: 16, width: '100%' }}
                          options={[
                            { value: 'agent', label: 'Агент' },
                            { value: 'director', label: 'Директор' },
                          ]}
                        />
                      ) : (
                        <Input
                          value={user?.role === 'director' ? 'Директор' : 'Агент'}
                          disabled
                          addonBefore="Роль"
                          size="large"
                          style={{ fontSize: 16 }}
                        />
                      )}
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Input
                        value={isEditing ? editValues.firstName : user?.firstName || ''}
                        onChange={e => handleChange('firstName', e.target.value)}
                        disabled={!isEditing}
                        addonBefore="Имя"
                        size="large"
                        style={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Input
                        value={isEditing ? editValues.lastName : user?.lastName || ''}
                        onChange={e => handleChange('lastName', e.target.value)}
                        disabled={!isEditing}
                        addonBefore="Фамилия"
                        size="large"
                        style={{ fontSize: 16 }}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
              {isEditing ? (
                <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
                  <Button type="primary" onClick={handleSave} style={{ width: 160, height: 48, fontSize: 18, borderRadius: 12, fontWeight: 600 }}>
                    Сохранить
                  </Button>
                  <Button onClick={handleCancel} style={{ width: 120, height: 48, fontSize: 18, borderRadius: 12, fontWeight: 600 }}>
                    Отмена
                  </Button>
                </div>
              ) : (
                <Button type="primary" onClick={handleEdit} style={{ marginTop: 32, width: 240, height: 48, fontSize: 18, borderRadius: 12, fontWeight: 600 }}>
                  Редактировать
                </Button>
              )}
            </Card>
          </div>
        ),
      };
    }
    return item;
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>Мой профиль</h1>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={dynamicTabItems.filter(Boolean)}
        style={{ background: 'transparent' }}
      />
    </div>
  );
} 