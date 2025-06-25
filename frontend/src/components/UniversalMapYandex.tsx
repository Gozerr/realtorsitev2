import React, { useEffect, useRef } from 'react';
import { Property } from '../types';

// Декларация для window.ymaps
declare global {
  interface Window {
    ymaps: any;
  }
}

interface UniversalMapYandexProps {
  properties: Property[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: React.CSSProperties;
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 11;

const UniversalMapYandex: React.FC<UniversalMapYandexProps> = ({
  properties,
  selectedId,
  onSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  style = { height: 400, width: '100%' },
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    const initMap = () => {
      mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        controls: ['zoomControl', 'fullscreenControl'],
      });
    };
    if (window.ymaps && window.ymaps.Map) {
      initMap();
    } else {
      window.ymaps.ready(initMap);
    }
  }, [initialCenter, initialZoom]);

  // Обновление маркеров и кластеров
  useEffect(() => {
    if (!mapRef.current || !window.ymaps) return;
    // Удаляем старые маркеры и кластеры
    if (clustererRef.current) {
      mapRef.current.geoObjects.remove(clustererRef.current);
      clustererRef.current = null;
    }
    markersRef.current = [];
    // Создаём новые маркеры
    const geoObjects = properties.filter(p => !isNaN(Number(p.lat)) && !isNaN(Number(p.lng))).map(p => {
      const placemark = new window.ymaps.Placemark([Number(p.lat), Number(p.lng)], {
        balloonContent: `<b>${p.title}</b><br/>${p.address}<br/><a href='/properties/${p.id}'>Подробнее</a>`
      }, {
        preset: selectedId === p.id ? 'islands#redIcon' : 'islands#blueIcon',
      });
      placemark.events.add('click', () => onSelect && onSelect(p.id));
      markersRef.current.push(placemark);
      return placemark;
    });
    // Кластеризация
    clustererRef.current = new window.ymaps.Clusterer({
      preset: 'islands#invertedBlueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
    });
    clustererRef.current.add(geoObjects);
    mapRef.current.geoObjects.add(clustererRef.current);
  }, [properties, selectedId, onSelect]);

  // Центрирование на выбранном объекте
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const selected = properties.find(p => p.id === selectedId && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)));
    if (selected) {
      mapRef.current.setCenter([Number(selected.lat), Number(selected.lng)], mapRef.current.getZoom(), { duration: 300 });
    }
  }, [selectedId, properties]);

  return (
    <div ref={mapContainerRef} style={style} />
  );
};

export default UniversalMapYandex; 