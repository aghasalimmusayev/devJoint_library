import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { Gender } from '../common/enums/gender.enum';

jest.mock('bcrypt');

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
});

describe('AuthService', () => {
    let service: AuthService;
    let repository: MockRepository;
    let jwtService: { sign: jest.Mock };
    let configService: { get: jest.Mock };

    beforeEach(async () => {
        jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
        configService = { get: jest.fn().mockReturnValue('1d') };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: createMockRepository(),
                },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        repository = module.get(getRepositoryToken(User));

        jest.clearAllMocks();
    });

    describe('register', () => {
        const dto = {
            name: 'Alice',
            email: 'alice@example.com',
            password: 'password123',
            gender: Gender.FEMALE,
        };

        it('should throw ConflictException when the email is already taken', async () => {
            repository.findOne!.mockResolvedValue({ id: 'user-1' });

            await expect(service.register(dto)).rejects.toThrow(
                ConflictException,
            );
            expect(repository.create).not.toHaveBeenCalled();
        });

        it('should hash the password and create the user with role USER', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            repository.findOne!.mockResolvedValue(null);
            const created = { ...dto, password: 'hashed-password' };
            const saved = { id: 'user-1', ...created, role: Role.USER };
            repository.create!.mockReturnValue(created);
            repository.save!.mockResolvedValue(saved);

            const result = await service.register(dto);

            expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    password: 'hashed-password',
                    role: Role.USER,
                }),
            );
            expect(result.accessToken).toBe('signed-token');
            expect(result.user.id).toBe('user-1');
        });
    });

    describe('login', () => {
        const dto = { email: 'alice@example.com', password: 'password123' };

        it('should throw UnauthorizedException when the user does not exist', async () => {
            repository.findOne!.mockResolvedValue(null);

            await expect(service.login(dto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when the password does not match', async () => {
            repository.findOne!.mockResolvedValue({
                id: 'user-1',
                password: 'hashed-password',
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(dto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should return an access token when credentials are valid', async () => {
            const user = {
                id: 'user-1',
                name: 'Alice',
                email: dto.email,
                role: Role.USER,
                password: 'hashed-password',
            };
            repository.findOne!.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login(dto);

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ sub: 'user-1', email: dto.email }),
            );
            expect(result.accessToken).toBe('signed-token');
        });
    });
});
