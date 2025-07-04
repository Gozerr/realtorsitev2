import { Exclude, Expose } from 'class-transformer';

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
} 