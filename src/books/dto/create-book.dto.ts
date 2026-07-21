import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateBookDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    isbn: string;

    @ApiProperty()
    @IsDateString()
    publishedDate: string;

    @ApiProperty({ minimum: 1, default: 1 })
    @IsInt()
    @Min(1)
    totalCopies: number;

    @ApiProperty()
    @IsUUID()
    authorId: string;
}
