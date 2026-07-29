import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }

    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.userRepository.find();
        return users.map((user) => new UserResponseDto(user));
    }

    async findOne(id: string): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        return new UserResponseDto(user);
    }

    findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async update(id: string, dto: UpdateUserDto, currentUserId: string): Promise<UserResponseDto> {
        if (id !== currentUserId) throw new ForbiddenException('You can only update your own account');
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        Object.assign(user, dto);
        const saved = await this.userRepository.save(user);
        return new UserResponseDto(saved);
    }

    async remove(id: string, currentUserId: string): Promise<{ message: string }> {
        if (id !== currentUserId) throw new ForbiddenException('You can only delete your own account');
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        await this.userRepository.remove(user);
        return { message: 'The user has been removed' };
    }
}
