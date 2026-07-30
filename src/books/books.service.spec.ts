import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { AuthorsService } from '../authors/authors.service';

type MockRepository = Partial<Record<keyof Repository<Book>, jest.Mock>>;

const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
});

const createMockRepository = (): MockRepository => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
});

describe('BooksService', () => {
    let service: BooksService;
    let repository: MockRepository;
    let authorsService: { findOne: jest.Mock };

    beforeEach(async () => {
        authorsService = { findOne: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BooksService,
                {
                    provide: getRepositoryToken(Book),
                    useValue: createMockRepository(),
                },
                {
                    provide: AuthorsService,
                    useValue: authorsService,
                },
            ],
        }).compile();

        service = module.get<BooksService>(BooksService);
        repository = module.get(getRepositoryToken(Book));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const dto = {
            title: '1984',
            isbn: '978-0451524935',
            publishedDate: '1949-06-08',
            totalCopies: 3,
            authorId: 'author-1',
        };

        it('should throw NotFoundException when the author does not exist', async () => {
            authorsService.findOne.mockRejectedValue(new NotFoundException());

            await expect(service.create(dto)).rejects.toThrow(
                NotFoundException,
            );
            expect(repository.create).not.toHaveBeenCalled();
        });

        it('should create a book with availableCopies seeded from totalCopies', async () => {
            const created = { ...dto, availableCopies: dto.totalCopies };
            const saved = { id: 'book-1', ...created };

            authorsService.findOne.mockResolvedValue({ id: dto.authorId });
            repository.create!.mockReturnValue(created);
            repository.save!.mockResolvedValue(saved);
            repository.findOne!.mockResolvedValue({
                ...saved,
                author: { id: dto.authorId },
            });

            const result = await service.create(dto);

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({ availableCopies: dto.totalCopies }),
            );
            expect(result.id).toBe('book-1');
        });
    });

    describe('findAll', () => {
        it('should paginate and map results to BookResponseDto', async () => {
            const qb = createMockQueryBuilder();
            const books = [{ id: 'book-1', title: '1984' }];
            qb.getManyAndCount.mockResolvedValue([books, 1]);
            repository.createQueryBuilder!.mockReturnValue(qb);

            const result = await service.findAll({
                page: 1,
                limit: 10,
                order: 'ASC',
            });

            expect(qb.skip).toHaveBeenCalledWith(0);
            expect(qb.take).toHaveBeenCalledWith(10);
            expect(qb.andWhere).not.toHaveBeenCalled();
            expect(result).toEqual({
                data: [expect.objectContaining({ id: 'book-1' })],
                total: 1,
                page: 1,
                limit: 10,
            });
        });

        it('should filter by authorId when provided', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            repository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll({
                page: 1,
                limit: 10,
                order: 'ASC',
                authorId: 'author-1',
            });

            expect(qb.andWhere).toHaveBeenCalledWith(
                'book.authorId = :authorId',
                {
                    authorId: 'author-1',
                },
            );
        });
    });

    describe('findOne', () => {
        it('should return a book when found', async () => {
            repository.findOne!.mockResolvedValue({
                id: 'book-1',
                title: '1984',
            });

            const result = await service.findOne('book-1');

            expect(result.id).toBe('book-1');
        });

        it('should throw NotFoundException when the book does not exist', async () => {
            repository.findOne!.mockResolvedValue(null);

            await expect(service.findOne('missing-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should throw NotFoundException when the book does not exist', async () => {
            repository.findOne!.mockResolvedValue(null);

            await expect(
                service.update('missing-id', { title: 'New title' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when reassigned to a missing author', async () => {
            repository.findOne!.mockResolvedValue({
                id: 'book-1',
                title: '1984',
            });
            authorsService.findOne.mockRejectedValue(new NotFoundException());

            await expect(
                service.update('book-1', { authorId: 'missing-author' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should update and return the book', async () => {
            const book = { id: 'book-1', title: '1984' };
            repository.findOne!.mockResolvedValueOnce(book);
            repository.findOne!.mockResolvedValueOnce({
                ...book,
                title: 'Animal Farm',
            });
            repository.save!.mockResolvedValue({
                ...book,
                title: 'Animal Farm',
            });

            const result = await service.update('book-1', {
                title: 'Animal Farm',
            });

            expect(repository.save).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Animal Farm' }),
            );
            expect(result.title).toBe('Animal Farm');
        });
    });

    describe('remove', () => {
        it('should remove an existing book', async () => {
            const book = { id: 'book-1', title: '1984' };
            repository.findOne!.mockResolvedValue(book);
            repository.remove!.mockResolvedValue(book);

            await service.remove('book-1');

            expect(repository.remove).toHaveBeenCalledWith(book);
        });

        it('should throw NotFoundException when removing a missing book', async () => {
            repository.findOne!.mockResolvedValue(null);

            await expect(service.remove('missing-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
