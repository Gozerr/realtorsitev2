import React from 'react';
import { Card, Carousel, Tag, Select, Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types'; // Укажите правильный путь
import { MessageOutlined, PlusOutlined } from '@ant-design/icons';

const statusOptions = [
  { value: 'for_sale', label: 'В продаже', color: 'green' },
  { value: 'in_deal', label: 'На задатке', color: 'orange' },
  { value: 'reserved', label: 'На брони', color: 'blue' },
  { value: 'sold', label: 'Продан', color: 'red' },
];

type PropertyCardProps = {
  property: Property;
  isAgent?: boolean; // если true — показывать Select для смены статуса
  onStatusChange?: (id: string, status: string) => void;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, isAgent, onStatusChange }) => {
  const images: string[] = property.photos || property.images || [];
  const navigate = useNavigate();

  const currentStatus = statusOptions.find(opt => opt.value === property.status) || statusOptions[0];

  return (
    <Card
      title={property.title}
      style={{ width: '100%', marginBottom: 16, position: 'relative' }}
      cover={
        <div style={{ position: 'relative' }}>
          {images.length > 0 ? (
            <Carousel autoplay style={{ width: '100%', height: 220 }}>
              {images.map((url: string, i: number) => (
                <div key={i}>
                  <img
                    src={url}
                    alt={property.title}
                    style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8 }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <div style={{ width: '100%', height: 220, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Нет фото
            </div>
          )}
        </div>
      }
    >
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Tag color="purple" style={{ fontWeight: 600, fontSize: 14 }}>
          Эксклюзивный объект
        </Tag>
        {isAgent ? (
          <Select
            value={property.status}
            style={{ width: 160 }}
            onChange={value => onStatusChange && onStatusChange(property.id, value)}
            options={statusOptions}
          />
        ) : (
          <Tag color={currentStatus.color} style={{ fontWeight: 500 }}>
            {currentStatus.label}
          </Tag>
        )}
      </div>
      <p><b>Адрес:</b> {property.address}</p>
      <p><b>Цена:</b> {property.price} ₽</p>
      <p><b>Площадь:</b> {property.area} м²</p>
      <p><b>Описание:</b> {property.description}</p>
      {/* ...другие поля... */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <Button type="default" onClick={() => navigate(`/properties/${property.id}`)}>
          Подробнее
        </Button>
        <Tooltip title="Чат с агентом">
          <Button
            shape="circle"
            icon={<MessageOutlined />}
            onClick={() => navigate(`/chats?user=${property.agent?.id}`)}
          />
        </Tooltip>
        <Tooltip title="Добавить в избранное">
          <Button
            shape="circle"
            icon={<PlusOutlined />}
            // onClick={...} // здесь обработчик для добавления в избранное
          />
        </Tooltip>
      </div>
    </Card>
  );
};

export default PropertyCard;