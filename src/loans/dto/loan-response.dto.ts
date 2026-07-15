import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Loan } from '../entities/loan.entity';
import { BookResponseDto } from '../../books/dto/book-response.dto';
import { MemberResponseDto } from '../../members/dto/member-response.dto';

@Exclude()
export class LoanResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ type: () => BookResponseDto })
  @Expose()
  @Type(() => BookResponseDto)
  book: BookResponseDto;

  @ApiProperty({ type: () => MemberResponseDto })
  @Expose()
  @Type(() => MemberResponseDto)
  member: MemberResponseDto;

  @ApiProperty()
  @Expose()
  borrowedAt: Date;

  @ApiProperty()
  @Expose()
  dueDate: string;

  @ApiProperty({ nullable: true })
  @Expose()
  returnedAt: Date | null;

  constructor(partial: Partial<Loan>) {
    Object.assign(this, partial);
  }
}
