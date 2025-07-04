import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Typography, Space, Spin, Empty, Modal, List, message, Tooltip } from 'antd';
import { FolderOpenOutlined, UserOutlined, ClockCircleOutlined, LikeOutlined, DislikeOutlined, LinkOutlined, FilePdfOutlined, QuestionCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchSelections, Selection, getSelectionById, getClientLikes, getClientLink, downloadSelectionPdf, removePropertyFromSelection, deleteSelection } from '../services/selection.service';
import AddToSelectionModal from '../components/AddToSelectionModal';
import { Property } from '../types';
import { getAllProperties } from '../services/property.service';
import OptimizedImage from '../components/OptimizedImage';

const { Title } = Typography;

const SelectionPage: React.FC = () => {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewSelection, setViewSelection] = useState<Selection | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [clientLikes, setClientLikes] = useState<{ propertyId: number; liked: boolean }[]>([]);

  useEffect(() => {
    setLoading(true);
    fetchSelections().then(data => {
      setSelections(data);
      setLoading(false);
    });
    getAllProperties().then(res => setAllProperties(res.properties));
  }, [modalOpen]);

  useEffect(() => {
    if (viewSelection) {
      getSelectionById(viewSelection.id).then(sel => {
        setClientToken(sel.clientToken || null);
      });
      getClientLikes(viewSelection.id).then(setClientLikes);
    } else {
      setClientToken(null);
      setClientLikes([]);
    }
  }, [viewSelection]);

  const handleCreateModalClose = () => {
    setModalOpen(false);
    fetchSelections().then(setSelections);
    if (viewSelection) {
      getSelectionById(viewSelection.id).then(sel => setViewSelection(sel));
    }
  };

  const handleViewSelection = (sel: Selection) => {
    setViewSelection(sel);
  };

  const handleViewClose = () => {
    setViewSelection(null);
  };

  const handleCopyLink = () => {
    if (clientToken) {
      const link = getClientLink(clientToken);
      navigator.clipboard.writeText(link);
      message.success('Ссылка для клиента скопирована!');
    }
  };

  const handleDownloadPdf = () => {
    if (viewSelection) {
      downloadSelectionPdf(viewSelection.id);
      message.success('PDF-файл формируется и будет скачан');
    }
  };

  const getLikeStatus = (propertyId: number) => {
    const like = clientLikes.find(l => l.propertyId === propertyId);
    if (!like) return null;
    return like.liked;
  };

  const handleRemoveProperty = async (propertyId: number) => {
    if (!viewSelection) return;
    await removePropertyFromSelection(viewSelection.id, propertyId);
    message.success('Объект удалён из подборки');
    // Обновить подборку
    getSelectionById(viewSelection.id).then(sel => setViewSelection(sel));
  };

  const handleDeleteSelection = async () => {
    if (!viewSelection) return;
    Modal.confirm({
      title: 'Удалить подборку?',
      content: 'Вы уверены, что хотите удалить эту подборку? Это действие необратимо.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        await deleteSelection(viewSelection.id);
        message.success('Подборка удалена');
        setViewSelection(null);
        fetchSelections().then(setSelections);
      },
    });
  };

  function getThumbnail(photo: string | undefined): string | undefined {
    if (!photo) return undefined;
    if (photo.startsWith('/uploads/objects/')) {
      const parts = photo.split('/');
      return ['/uploads', 'objects', 'thumbnails', ...parts.slice(3)].join('/');
    }
    return undefined;
  }

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
            <Col xs={24} sm={12} md={8} lg={6} key={sel.id} className="selection-card">
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="default" style={{ width: '100%', fontWeight: 500, borderRadius: 8 }} onClick={() => handleViewSelection(sel)}>
                      Просмотреть подборку
                    </Button>
                    <Tooltip title="Удалить подборку">
                      <Button danger icon={<DeleteOutlined />} onClick={() => {
                        Modal.confirm({
                          title: 'Удалить подборку?',
                          content: 'Вы уверены, что хотите удалить эту подборку? Это действие необратимо.',
                          okText: 'Удалить',
                          okType: 'danger',
                          cancelText: 'Отмена',
                          onOk: async () => {
                            await deleteSelection(sel.id);
                            message.success('Подборка удалена');
                            if (viewSelection?.id === sel.id) setViewSelection(null);
                            fetchSelections().then(setSelections);
                          },
                        });
                      }} />
                    </Tooltip>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      <AddToSelectionModal open={modalOpen} onClose={handleCreateModalClose} createOnly />
      <Modal open={!!viewSelection} onCancel={handleViewClose} footer={null} title={viewSelection?.title || ''} width={1100}>
        <div style={{ marginBottom: 16, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Создана: {viewSelection?.date}</span>
          <span style={{ display: 'flex', gap: 12 }}>
            {clientToken && (
              <Tooltip title="Скопировать ссылку для клиента">
                <Button icon={<LinkOutlined />} onClick={handleCopyLink} style={{ marginRight: 8 }} />
              </Tooltip>
            )}
            <Tooltip title="Скачать PDF">
              <Button icon={<FilePdfOutlined />} onClick={handleDownloadPdf} />
            </Tooltip>
          </span>
        </div>
        <List
          grid={{ gutter: 32, column: 2 }}
          bordered={false}
          dataSource={viewSelection ? viewSelection.propertyIds.map(id => allProperties.find(p => Number(p.id) === Number(id))).filter((p): p is Property => Boolean(p)) : []}
          renderItem={(item: Property) => {
            if (viewSelection) {
              console.log('propertyIds:', viewSelection.propertyIds);
              console.log('allProperties:', allProperties.map(p => p.id));
            }
            const likeStatus = getLikeStatus(item.id);
            return (
              <List.Item style={{ padding: 0, position: 'relative' }}>
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
                  margin: 0,
                  position: 'relative',
                }}>
                  <OptimizedImage
                    src={getThumbnail(item.photos && item.photos[0]) || (item.photos && item.photos[0]) || '/placeholder-property.jpg'}
                    alt={item.title}
                    width={200}
                    height={150}
                    style={{ objectFit: 'cover', borderRadius: '18px 0 0 18px', flexShrink: 0, background: '#f5f5f5' }}
                    lazy={true}
                    fallback="/placeholder-property.jpg"
                  />
                  <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>{item.title}</span>
                      <Tooltip title="Удалить объект из подборки">
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleRemoveProperty(item.id)} />
                      </Tooltip>
                    </div>
                    <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>{item.address}</div>
                    <div style={{ color: '#222', fontSize: 16, marginBottom: 4 }}><b>Цена:</b> {item.price} ₽</div>
                    <div style={{ color: '#222', fontSize: 16 }}><b>Площадь:</b> {item.area} м²</div>
                    <div style={{ position: 'absolute', top: 18, right: 24, display: 'flex', gap: 8 }}>
                      {likeStatus === true && <Tooltip title="Понравилось"><LikeOutlined style={{ color: '#22c55e', fontSize: 22 }} /></Tooltip>}
                      {likeStatus === false && <Tooltip title="Не понравилось"><DislikeOutlined style={{ color: '#f44336', fontSize: 22 }} /></Tooltip>}
                      {likeStatus === null && <Tooltip title="Нет ответа"><QuestionCircleOutlined style={{ color: '#bbb', fontSize: 22 }} /></Tooltip>}
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
          locale={{ emptyText: 'В подборке пока нет объектов' }}
        />
      </Modal>
      <style>{`
        @media (max-width: 767px) {
          .selection-card {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default SelectionPage; 