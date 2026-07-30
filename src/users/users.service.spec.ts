import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
});

describe('UsersService', () => {
    let service: UsersService;
    let repository: MockRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: createMockRepository(),
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get(getRepositoryToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all users mapped to UserResponseDto', async () => {
            repository.find!.mockResolvedValue([
                { id: 'user-1', name: 'Alice' },
            ]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('user-1');
        });
    });

    describe('findOne', () => {
        it('should return a user when found', async () => {
            repository.findOne!.mockResolvedValue({
                id: 'user-1',
                name: 'Alice',
            });

            const result = await service.findOne('user-1');

            expect(result.id).toBe('user-1');
        });

        it('should throw NotFoundException when the user does not exist', async () => {
            repository.findOne!.mockResolvedValue(null);

            await expect(service.findOne('missing-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findByEmail', () => {
        it('should return the raw user entity for the given email', async () => {
            const user = { id: 'user-1', email: 'alice@example.com' };
            repository.findOne!.mockResolvedValue(user);

            const result = await service.findByEmail('alice@example.com');

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { email: 'alice@example.com' },
            });
            expect(result).toBe(user);
        });
    });

    describe('update', () => {
        it('should throw ForbiddenException when updating another account', async () => {
            await expect(
                service.update('user-1', { name: 'New name' }, 'user-2'),
            ).rejects.toThrow(ForbiddenException);
            expect(repository.findOne).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when the account no longer exists', async () => {
            repository.findOne!.mockResolvedValue(null);

            await expect(
                service.update('user-1', { name: 'New name' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should update and return the account', async () => {
            const user = { id: 'user-1', name: 'Alice' };
            repository.findOne!.mockResolvedValue(user);
            repository.save!.mockResolvedValue({ ...user, name: 'Alicia' });

            const result = await service.update(
                'user-1',
                { name: 'Alicia' },
                'user-1',
            );

            expect(repository.save).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Alicia' }),
            );
            expect(result.name).toBe('Alicia');
        });
    });

    describe('remove', () => {
        it('should throw ForbiddenException when removing another account', async () => {
            await expect(service.remove('user-1', 'user-2')).rejects.toThrow(
                ForbiddenException,
            );
            expect(repository.findOne).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when the account no longer exists', async () => {
            repository.findOne!.mockResolvedValue(null);

            await expect(service.remove('user-1', 'user-1')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should remove the account', async () => {
            const user = { id: 'user-1', name: 'Alice' };
            repository.findOne!.mockResolvedValue(user);
            repository.remove!.mockResolvedValue(user);

            await service.remove('user-1', 'user-1');

            expect(repository.remove).toHaveBeenCalledWith(user);
        });
    });
});
