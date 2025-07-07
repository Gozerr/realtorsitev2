import { Exclude, Expose, Type } from 'class-transformer';
import { UserPublicDto } from '../../users/dto/user-public.dto';

@Exclude()
export class PropertyPublicDto {
  @Expose() id: number;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() address: string;
  @Expose() price: number;
  @Expose() area: number;
  @Expose() bedrooms: number;
  @Expose() bathrooms: number;
  @Expose() status: string;
  @Expose() isExclusive: boolean;
  @Expose() photos: string[];
  @Expose() createdAt: Date;
  @Expose() lat?: number;
  @Expose() lng?: number;
  @Expose() floor?: number;
  @Expose() totalFloors?: number;
  @Expose() link?: string;
  @Expose() pricePerM2?: number;
  @Expose() externalId?: string;
  @Expose() seller?: string;
  @Expose() datePublished?: string;

  @Expose()
  @Type(() => UserPublicDto)
  agent?: UserPublicDto;
} 