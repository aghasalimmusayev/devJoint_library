import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LoanStatus } from '../../common/enums/loan-status.enum';

export class LoanQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ enum: LoanStatus })
    @IsOptional()
    @IsEnum(LoanStatus)
    status?: LoanStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    bookId?: string;

    @ApiPropertyOptional({ description: 'ADMIN only — filter by borrower' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ description: 'Only loans due on or after this date' })
    @IsOptional()
    @IsDateString()
    dueDateFrom?: string;

    @ApiPropertyOptional({ description: 'Only loans due on or before this date' })
    @IsOptional()
    @IsDateString()
    dueDateTo?: string;
}
