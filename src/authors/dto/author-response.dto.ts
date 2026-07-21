import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Author } from '../entities/author.entity';

@Exclude()
export class AuthorResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    firstName: string;

    @ApiProperty()
    @Expose()
    lastName: string;

    @ApiPropertyOptional()
    @Expose()
    bio: string | null;

    @ApiPropertyOptional()
    @Expose()
    birthDate: string | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<Author>) { Object.assign(this, partial); }
}
