import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { LoanStatus } from '../common/enums/loan-status.enum';

type MockRepository<T extends object = any> = Partial<
    Record<keyof Repository<T>, jest.Mock>
>;

const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
});

const createMockRepository = <T extends object = any>(): MockRepository<T> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
});

describe('LoansService', () => {
    let service: LoansService;
    let loanRepository: MockRepository<Loan>;
    let bookRepository: MockRepository<Book>;
    let userRepository: MockRepository<User>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoansService,
                {
                    provide: getRepositoryToken(Loan),
                    useValue: createMockRepository(),
                },
                {
                    provide: getRepositoryToken(Book),
                    useValue: createMockRepository(),
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: createMockRepository(),
                },
            ],
        }).compile();

        service = module.get<LoansService>(LoansService);
        loanRepository = module.get(getRepositoryToken(Loan));
        bookRepository = module.get(getRepositoryToken(Book));
        userRepository = module.get(getRepositoryToken(User));
    });

    describe('create', () => {
        const futureDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
        const dto = {
            bookId: 'book-1',
            dueDate: futureDueDate,
        };
        const currentUserId = 'user-1';

        it('should throw NotFoundException when the book does not exist', async () => {
            bookRepository.findOne!.mockResolvedValue(null);

            await expect(service.create(dto, currentUserId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException when there are no available copies', async () => {
            bookRepository.findOne!.mockResolvedValue({
                id: 'book-1',
                availableCopies: 0,
            });

            await expect(service.create(dto, currentUserId)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should decrement availableCopies and create the loan', async () => {
            const book = { id: 'book-1', availableCopies: 2 };
            const user = { id: currentUserId };
            const createdLoan = { id: 'loan-1', ...dto, userId: currentUserId };

            bookRepository.findOne!.mockResolvedValueOnce(book);
            loanRepository.create!.mockReturnValue(createdLoan);
            loanRepository.save!.mockResolvedValue(createdLoan);
            loanRepository.findOne!.mockResolvedValue({
                ...createdLoan,
                book,
                user,
            });

            await service.create(dto, currentUserId);

            expect(bookRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ availableCopies: 1 }),
            );
        });
    });

    describe('findAll', () => {
        const baseQuery = { page: 1, limit: 10, order: 'ASC' as const };
        const adminUser = { id: 'admin-1', name: 'Admin', email: 'a@a.com', role: Role.ADMIN };
        const regularUser = { id: 'user-1', name: 'User', email: 'u@u.com', role: Role.USER };

        it('should scope non-admin users to their own loans', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            loanRepository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll(regularUser, baseQuery);

            expect(qb.andWhere).toHaveBeenCalledWith('loan.userId = :currentUserId', {
                currentUserId: regularUser.id,
            });
        });

        it('should not scope admin users unless userId filter is given', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            loanRepository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll(adminUser, baseQuery);

            expect(qb.andWhere).not.toHaveBeenCalledWith(
                expect.stringContaining('loan.userId'),
                expect.anything(),
            );
        });

        it('should let admin filter by an arbitrary userId', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            loanRepository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll(adminUser, { ...baseQuery, userId: 'user-2' });

            expect(qb.andWhere).toHaveBeenCalledWith('loan.userId = :userId', {
                userId: 'user-2',
            });
        });

        it('should filter by bookId and due date range', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            loanRepository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll(adminUser, {
                ...baseQuery,
                bookId: 'book-1',
                dueDateFrom: '2026-01-01',
                dueDateTo: '2026-12-31',
            });

            expect(qb.andWhere).toHaveBeenCalledWith('loan.bookId = :bookId', { bookId: 'book-1' });
            expect(qb.andWhere).toHaveBeenCalledWith('loan.dueDate >= :dueDateFrom', {
                dueDateFrom: '2026-01-01',
            });
            expect(qb.andWhere).toHaveBeenCalledWith('loan.dueDate <= :dueDateTo', {
                dueDateTo: '2026-12-31',
            });
        });

        it('should translate status=active into returnedAt IS NULL', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            loanRepository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll(adminUser, { ...baseQuery, status: LoanStatus.ACTIVE });

            expect(qb.andWhere).toHaveBeenCalledWith('loan.returnedAt IS NULL');
        });

        it('should translate status=returned into returnedAt IS NOT NULL', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            loanRepository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll(adminUser, { ...baseQuery, status: LoanStatus.RETURNED });

            expect(qb.andWhere).toHaveBeenCalledWith('loan.returnedAt IS NOT NULL');
        });

        it('should translate status=overdue into returnedAt IS NULL AND dueDate < now', async () => {
            const qb = createMockQueryBuilder();
            qb.getManyAndCount.mockResolvedValue([[], 0]);
            loanRepository.createQueryBuilder!.mockReturnValue(qb);

            await service.findAll(adminUser, { ...baseQuery, status: LoanStatus.OVERDUE });

            expect(qb.andWhere).toHaveBeenCalledWith('loan.returnedAt IS NULL');
            expect(qb.andWhere).toHaveBeenCalledWith(
                'loan.dueDate < :now',
                expect.objectContaining({ now: expect.any(Date) }),
            );
        });
    });

    describe('returnBook', () => {
        it('should throw BadRequestException when the loan was already returned', async () => {
            loanRepository.findOne!.mockResolvedValue({
                id: 'loan-1',
                bookId: 'book-1',
                returnedAt: new Date(),
            });

            await expect(service.returnBook('loan-1')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should increment availableCopies when returning a loan', async () => {
            const loan = { id: 'loan-1', bookId: 'book-1', returnedAt: null };
            const book = { id: 'book-1', availableCopies: 1 };

            loanRepository.findOne!.mockResolvedValue(loan);
            loanRepository.save!.mockResolvedValue({
                ...loan,
                returnedAt: new Date(),
            });
            bookRepository.findOne!.mockResolvedValue(book);

            await service.returnBook('loan-1');

            expect(bookRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ availableCopies: 2 }),
            );
        });
    });
});
