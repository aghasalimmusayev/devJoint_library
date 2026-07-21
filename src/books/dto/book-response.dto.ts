import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Book } from '../entities/book.entity';
import { AuthorResponseDto } from '../../authors/dto/author-response.dto';

@Exclude()
export class BookResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    title: string;

    @ApiProperty()
    @Expose()
    isbn: string;

    @ApiProperty()
    @Expose()
    publishedDate: string;

    @ApiProperty()
    @Expose()
    totalCopies: number;

    @ApiProperty()
    @Expose()
    availableCopies: number;

    @ApiProperty({ type: () => AuthorResponseDto })
    @Expose()
    @Type(() => AuthorResponseDto)
    author: AuthorResponseDto;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<Book>) {
        Object.assign(this, partial);
    }
}
