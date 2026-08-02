import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class BookQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    authorId?: string;

    @ApiPropertyOptional({ description: 'Filter by category id' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Case-insensitive search on title' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Only books published on or after this date' })
    @IsOptional()
    @IsDateString()
    publishedFrom?: string;

    @ApiPropertyOptional({ description: 'Only books published on or before this date' })
    @IsOptional()
    @IsDateString()
    publishedTo?: string;

    @ApiPropertyOptional({ description: 'Only books with at least one available copy' })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    availableOnly?: boolean;
}
