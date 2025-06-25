import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Typography, Space, Spin, Empty, Modal, List } from 'antd';
import { FolderOpenOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { fetchSelections, Selection } from '../services/selection.service';
import AddToSelectionModal from '../components/AddToSelectionModal';
import { Property } from '../types';
import { getRecentProperties } from '../services/property.service';

const { Title } = Typography;

const SelectionPage: React.FC = () => {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewSelection, setViewSelection] = useState<Selection | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  useEffect(() => {
    setLoading(true);
    fetchSelections().then(data => {
      setSelections(data);
      setLoading(false);
    });
    getRecentProperties().then(setAllProperties);
  }, [modalOpen]);

  const handleCreateModalClose = () => {
    setModalOpen(false);
    fetchSelections().then(setSelections);
  };

  const handleViewSelection = (sel: Selection) => {
    setViewSelection(sel);
  };

  const handleViewClose = () => {
    setViewSelection(null);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '32px 40px 0 40px', background: 'var(--background-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0 }}>Подборки объектов</Title>
        <Button type="primary" size="large" style={{ borderRadius: 10, fontWeight: 600 }} onClick={() => setModalOpen(true)}>
          Создать подборку
        </Button>
      </div>
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : selections.length === 0 ? (
        <Empty description="У вас пока нет подборок" style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[32, 32]}>
          {selections.map(sel => (
            <Col xs={24} sm={12} md={8} lg={6} key={sel.id}>
              <Card
                style={{ borderRadius: 16, boxShadow: '0 2px 16px #e6eaf1', minHeight: 210, background: '#fff', padding: 0 }}
                bodyStyle={{ padding: 24 }}
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <FolderOpenOutlined style={{ color: '#ff9800', fontSize: 22 }} />
                    <span style={{ fontWeight: 700, fontSize: 20 }}>{sel.title}</span>
                  </div>
                  <div style={{ color: '#222', fontSize: 15, marginBottom: 4 }}>Объектов: {sel.propertyIds.length}</div>
                  <div style={{ color: '#888', fontSize: 15, marginBottom: 12 }}>
                    <ClockCircleOutlined style={{ marginRight: 6 }} /> Создана: {sel.date}
                  </div>
                  <Button type="default" style={{ width: '100%', fontWeight: 500, borderRadius: 8 }} onClick={() => handleViewSelection(sel)}>
                    Просмотреть подборку
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      <AddToSelectionModal open={modalOpen} onClose={handleCreateModalClose} createOnly />
      <Modal open={!!viewSelection} onCancel={handleViewClose} footer={null} title={viewSelection?.title || ''} width={1100}>
        <div style={{ marginBottom: 16, color: '#888' }}>
          Создана: {viewSelection?.date}
        </div>
        <List
          grid={{ gutter: 32, column: 2 }}
          bordered={false}
          dataSource={viewSelection ? viewSelection.propertyIds.map(id => allProperties.find(p => p.id === id)).filter((p): p is Property => Boolean(p)) : []}
          renderItem={(item: Property) => (
            <List.Item style={{ padding: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                border: '1px solid #e6eaf1',
                borderRadius: 18,
                boxShadow: '0 2px 8px rgba(40,60,90,0.04)',
                padding: 0,
                overflow: 'hidden',
                minHeight: 180,
                transition: 'box-shadow 0.2s',
                cursor: 'pointer',
                margin: 0
              }}>
                {item.photos && item.photos.length > 0 ? (
                  <img src={item.photos[0]} alt={item.title} style={{ width: 200, height: 150, objectFit: 'cover', borderRadius: '18px 0 0 18px', flexShrink: 0, background: '#f5f5f5' }} />
                ) : (
                  <div style={{ width: 200, height: 150, background: '#f5f5f5', borderRadius: '18px 0 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 28, flexShrink: 0 }}>
                    Нет фото
                  </div>
                )}
                <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, color: '#222' }}>{item.title}</div>
                  <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>{item.address}</div>
                  <div style={{ color: '#222', fontSize: 16, marginBottom: 4 }}><b>Цена:</b> {item.price} ₽</div>
                  <div style={{ color: '#222', fontSize: 16 }}><b>Площадь:</b> {item.area} м²</div>
                </div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'В подборке пока нет объектов' }}
        />
      </Modal>
    </div>
  );
};

export default SelectionPage; 