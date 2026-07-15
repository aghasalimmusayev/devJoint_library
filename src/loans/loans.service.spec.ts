import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { Member } from '../members/entities/member.entity';

type MockRepository<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T extends object = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('LoansService', () => {
  let service: LoansService;
  let loanRepository: MockRepository<Loan>;
  let bookRepository: MockRepository<Book>;
  let memberRepository: MockRepository<Member>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        { provide: getRepositoryToken(Loan), useValue: createMockRepository() },
        { provide: getRepositoryToken(Book), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(Member),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    loanRepository = module.get(getRepositoryToken(Loan));
    bookRepository = module.get(getRepositoryToken(Book));
    memberRepository = module.get(getRepositoryToken(Member));
  });

  describe('create', () => {
    const dto = {
      bookId: 'book-1',
      memberId: 'member-1',
      dueDate: '2026-08-01',
    };

    it('should throw NotFoundException when the book does not exist', async () => {
      bookRepository.findOne!.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when there are no available copies', async () => {
      bookRepository.findOne!.mockResolvedValue({
        id: 'book-1',
        availableCopies: 0,
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should decrement availableCopies and create the loan', async () => {
      const book = { id: 'book-1', availableCopies: 2 };
      const member = { id: 'member-1' };
      const createdLoan = { id: 'loan-1', ...dto };

      bookRepository.findOne!.mockResolvedValueOnce(book);
      memberRepository.findOne!.mockResolvedValue(member);
      loanRepository.create!.mockReturnValue(createdLoan);
      loanRepository.save!.mockResolvedValue(createdLoan);
      loanRepository.findOne!.mockResolvedValue({
        ...createdLoan,
        book,
        member,
      });

      await service.create(dto);

      expect(bookRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ availableCopies: 1 }),
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
