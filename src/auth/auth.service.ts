import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(data: RegisterDto): Promise<AuthResponseDto> {
        const existing = await this.userRepository.findOne({ where: { email: data.email } });
        if (existing) throw new ConflictException(`User with email ${data.email} already exists`);
        const password = await bcrypt.hash(data.password, 10);
        const user = this.userRepository.create({ ...data, password, role: Role.USER });
        const saved = await this.userRepository.save(user);
        return this.buildAuthResponse(saved);
    }

    async login(data: LoginDto): Promise<AuthResponseDto> {
        const user = await this.userRepository.findOne({ where: { email: data.email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const passwordMatches = await bcrypt.compare(data.password, user.password);
        if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');
        return this.buildAuthResponse(user);
    }

    private buildAuthResponse(user: User): AuthResponseDto {
        const payload: JwtPayload = { sub: user.id, name: user.name, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        return new AuthResponseDto({
            accessToken,
            expiresIn: this.configService.get<string>('jwt.expiresIn')!,
            user: new UserResponseDto(user),
        });
    }
}
