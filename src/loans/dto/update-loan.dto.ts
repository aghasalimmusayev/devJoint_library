import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateLoanDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}
