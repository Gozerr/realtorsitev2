import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  name: string;
} 