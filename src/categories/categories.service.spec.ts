import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

type MockRepository = Partial<Record<keyof Repository<Category>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    remove: jest.fn(),
});

describe('CategoriesService', () => {
    let service: CategoriesService;
    let repository: MockRepository;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                {
                    provide: getRepositoryToken(Category),
                    useValue: createMockRepository(),
                },
            ],
        }).compile();
        service = module.get<CategoriesService>(CategoriesService);
        repository = module.get(getRepositoryToken(Category));
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should create and return a category', async () => {
            const dto = { name: 'Fiction' };
            const created = { id: '1', ...dto };
            repository.findOne!.mockResolvedValue(null);
            repository.create!.mockReturnValue(created);
            repository.save!.mockResolvedValue(created);
            const result = await service.create(dto);
            expect(repository.create).toHaveBeenCalledWith(dto);
            expect(result.name).toBe('Fiction');
        });
        it('should throw ConflictException when the name already exists (case-insensitive)', async () => {
            repository.findOne!.mockResolvedValue({ id: '1', name: 'Fiction' });
            await expect(service.create({ name: 'fiction' })).rejects.toThrow(
                ConflictException,
            );
            expect(repository.create).not.toHaveBeenCalled();
        });
    });
    describe('findAll', () => {
        it('should return all categories mapped to response dtos', async () => {
            repository.find!.mockResolvedValue([{ id: '1', name: 'Fiction' }]);
            const result = await service.findAll();
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Fiction');
        });
    });
    describe('findOne', () => {
        it('should return a category when found', async () => {
            repository.findOne!.mockResolvedValue({ id: '1', name: 'Fiction' });
            const result = await service.findOne('1');
            expect(result.id).toBe('1');
        });
        it('should throw NotFoundException when the category does not exist', async () => {
            repository.findOne!.mockResolvedValue(null);
            await expect(service.findOne('missing-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
    describe('update', () => {
        it('should throw NotFoundException when the category does not exist', async () => {
            repository.findOne!.mockResolvedValue(null);
            await expect(
                service.update('missing-id', { name: 'New name' }),
            ).rejects.toThrow(NotFoundException);
        });
        it('should throw ConflictException when renaming to a name used by another category', async () => {
            repository.findOne!
                .mockResolvedValueOnce({ id: '1', name: 'Fiction' })
                .mockResolvedValueOnce({ id: '2', name: 'Drama' });
            await expect(
                service.update('1', { name: 'Drama' }),
            ).rejects.toThrow(ConflictException);
        });
        it('should allow keeping its own current name', async () => {
            const category = { id: '1', name: 'Fiction' };
            repository.findOne!
                .mockResolvedValueOnce(category)
                .mockResolvedValueOnce(category);
            repository.save!.mockResolvedValue(category);
            const result = await service.update('1', { name: 'Fiction' });
            expect(result.name).toBe('Fiction');
        });
        it('should update and return the category', async () => {
            const category = { id: '1', name: 'Fiction' };
            repository.findOne!.mockResolvedValueOnce(category).mockResolvedValueOnce(null);
            repository.save!.mockResolvedValue({ id: '1', name: 'Sci-Fi' });
            const result = await service.update('1', { name: 'Sci-Fi' });
            expect(repository.save).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Sci-Fi' }),
            );
            expect(result.name).toBe('Sci-Fi');
        });
    });
    describe('remove', () => {
        it('should remove an existing category', async () => {
            const category = { id: '1', name: 'Fiction' };
            repository.findOne!.mockResolvedValue(category);
            repository.remove!.mockResolvedValue(category);
            await service.remove('1');
            expect(repository.remove).toHaveBeenCalledWith(category);
        });
        it('should throw NotFoundException when removing a missing category', async () => {
            repository.findOne!.mockResolvedValue(null);
            await expect(service.remove('missing-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
    describe('findByIds', () => {
        it('should return categories when all ids exist', async () => {
            const categories = [
                { id: '1', name: 'Fiction' },
                { id: '2', name: 'Drama' },
            ];
            repository.findBy!.mockResolvedValue(categories);
            const result = await service.findByIds(['1', '2']);
            expect(result).toEqual(categories);
        });
        it('should throw NotFoundException listing the missing ids', async () => {
            repository.findBy!.mockResolvedValue([{ id: '1', name: 'Fiction' }]);
            await expect(
                service.findByIds(['1', 'missing-id']),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
