import { IsArray, IsString } from 'class-validator';

export class UpdateVideoOrderDto {
  @IsArray()
  @IsString({ each: true })
  videoIds!: string[];
}