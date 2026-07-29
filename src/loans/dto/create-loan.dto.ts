import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateLoanDto {
    @ApiProperty()
    @IsUUID()
    bookId: string;

    @ApiProperty()
    @IsDateString()
    dueDate: string;
}
