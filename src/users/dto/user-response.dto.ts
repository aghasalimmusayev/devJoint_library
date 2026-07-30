import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { Gender } from '../../common/enums/gender.enum';
import { User } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiPropertyOptional()
    @Expose()
    surname: string | null;

    @ApiProperty({ enum: Gender })
    @Expose()
    gender: Gender;

    @ApiProperty()
    @Expose()
    email: string;

    @ApiPropertyOptional()
    @Expose()
    phone: string | null;

    @ApiProperty({ enum: Role })
    @Expose()
    role: Role;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
