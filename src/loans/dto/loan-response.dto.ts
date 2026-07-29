import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Loan } from '../entities/loan.entity';
import { BookResponseDto } from '../../books/dto/book-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

@Exclude()
export class LoanResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty({ type: () => BookResponseDto })
    @Expose()
    @Type(() => BookResponseDto)
    book: BookResponseDto;

    @ApiProperty({ type: () => UserResponseDto })
    @Expose()
    @Type(() => UserResponseDto)
    user: UserResponseDto;

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
