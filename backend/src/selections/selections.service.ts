import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Selection } from './selection.entity';
import { User } from '../users/user.entity';
import { randomBytes } from 'crypto';
import { Property } from '../properties/property.entity';
import * as PDFDocument from 'pdfkit';
import syncRequest from 'sync-request';

@Injectable()
export class SelectionsService {
  constructor(
    @InjectRepository(Selection)
    private selectionsRepository: Repository<Selection>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async findAllByUser(user: User): Promise<Selection[]> {
    return this.selectionsRepository.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
  }

  async findOneById(id: number, user: User): Promise<Selection | null> {
    return this.selectionsRepository.findOne({ where: { id, user: { id: user.id } } });
  }

  async create(title: string, propertyIds: number[], user: User): Promise<Selection> {
    const clientToken = randomBytes(16).toString('hex');
    const selection = this.selectionsRepository.create({ title, propertyIds, user, clientToken, clientLikes: [] });
    return this.selectionsRepository.save(selection);
  }

  async update(id: number, title: string, propertyIds: number[], user: User): Promise<Selection | null> {
    const selection = await this.findOneById(id, user);
    if (!selection) return null;
    selection.title = title;
    selection.propertyIds = propertyIds;
    return this.selectionsRepository.save(selection);
  }

  async remove(id: number, user: User): Promise<boolean> {
    const selection = await this.findOneById(id, user);
    if (!selection) return false;
    await this.selectionsRepository.remove(selection);
    return true;
  }

  async findByClientToken(token: string): Promise<{ id: number, title: string, properties: Partial<Property>[], clientLikes: any[] } | null> {
    const selection = await this.selectionsRepository.findOne({ where: { clientToken: token } });
    if (!selection) return null;
    // Получаем объекты без персональных данных
    const properties = await this.propertyRepository.find({ where: { id: In(selection.propertyIds) } });
    const safeProps = properties.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      address: p.address,
      price: p.price,
      area: p.area,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      status: p.status,
      isExclusive: p.isExclusive,
      photos: p.photos,
      createdAt: p.createdAt,
      lat: p.lat,
      lng: p.lng,
      floor: p.floor,
      totalFloors: p.totalFloors,
      link: p.link,
      pricePerM2: p.pricePerM2,
      externalId: p.externalId,
      seller: p.seller,
      datePublished: p.datePublished,
    }));
    return { id: selection.id, title: selection.title, properties: safeProps, clientLikes: selection.clientLikes || [] };
  }

  async saveClientLike(token: string, propertyId: number, liked: boolean): Promise<boolean> {
    const selection = await this.selectionsRepository.findOne({ where: { clientToken: token } });
    if (!selection) return false;
    let likes = selection.clientLikes || [];
    const idx = likes.findIndex(l => l.propertyId === propertyId);
    if (idx >= 0) likes[idx].liked = liked;
    else likes.push({ propertyId, liked });
    selection.clientLikes = likes;
    await this.selectionsRepository.save(selection);
    return true;
  }

  async getClientLikesForAgent(selectionId: number, user: User): Promise<{ propertyId: number, liked: boolean }[]> {
    const selection = await this.selectionsRepository.findOne({ where: { id: selectionId, user: { id: user.id } } });
    if (!selection) return [];
    return selection.clientLikes || [];
  }

  async generatePdf(selectionId: number, user: User): Promise<Buffer | null> {
    const selection = await this.findOneById(selectionId, user);
    if (!selection) return null;

    const doc = new (PDFDocument as any)({ margin: 36, size: 'A4' });
    doc.fontSize(20).text('Тестовая страница PDF', { align: 'center' });
    doc.end();
    
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
} 