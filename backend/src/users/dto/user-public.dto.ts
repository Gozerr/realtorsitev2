import { Exclude, Expose, Type } from 'class-transformer';

export class AgencyPublicDto {
  @Expose() id: number;
  @Expose() name: string;
}

@Exclude()
export class UserPublicDto {
  @Expose() id: number;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() photo?: string;
  @Expose() phone?: string;
  @Expose() city?: string;
  @Expose() region?: string;
  @Expose() role: string;
  @Expose() telegramId?: string;
  @Expose() telegramUsername?: string;
  @Expose() whatsappNumber?: string;
  @Expose()
  @Type(() => AgencyPublicDto)
  agency?: AgencyPublicDto;
} 