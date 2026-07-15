import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty()
  @IsUUID()
  bookId: string;

  @ApiProperty()
  @IsUUID()
  memberId: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;
}
