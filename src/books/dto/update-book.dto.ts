import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  totalCopies?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  genreId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  publishedYear?: number;
}
