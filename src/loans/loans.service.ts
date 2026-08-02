import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Loan } from './entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanQueryDto } from './dto/loan-query.dto';
import { LoanResponseDto } from './dto/loan-response.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Role } from '../common/enums/role.enum';
import { LoanStatus } from '../common/enums/loan-status.enum';

const LOAN_RELATIONS = ['book', 'book.author', 'user'];

@Injectable()
export class LoansService {
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>, @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>, @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    // Book.availableCopies and the new Loan row must land together or not at all —
    // otherwise a failure between the two saves would silently strand a decremented
    // copy count with no loan to account for it.
    @Transactional()
    async create(data: CreateLoanDto, currentUserId: string): Promise<LoanResponseDto> {
        this.assertFutureDueDate(data.dueDate);
        const book = await this.bookRepository.findOne({
            where: { id: data.bookId },
        });
        if (!book) throw new NotFoundException(`Book with id ${data.bookId} not found`);
        if (book.availableCopies < 1)
            throw new BadRequestException('No available copies for this book');
        book.availableCopies -= 1;
        await this.bookRepository.save(book);
        const loan = this.loanRepository.create({ ...data, userId: currentUserId });
        const saved = await this.loanRepository.save(loan);
        const reloaded = await this.loanRepository.findOne({
            where: { id: saved.id },
            relations: LOAN_RELATIONS,
        });
        if (!reloaded) throw new NotFoundException(`Loan with id ${saved.id} not found`);
        return new LoanResponseDto(reloaded);
    }

    async findAll(currentUser: AuthenticatedUser, query: LoanQueryDto): Promise<{
        data: LoanResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        const { page, limit, status, bookId, userId, dueDateFrom, dueDateTo } = query;
        // book/user are many-to-one from Loan's side, so joining them is safe with
        // skip/take (one row per loan either way) — unlike a to-many join.
        const qb = this.loanRepository
            .createQueryBuilder('loan')
            .leftJoinAndSelect('loan.book', 'book')
            .leftJoinAndSelect('book.author', 'author')
            .leftJoinAndSelect('loan.user', 'user')
            .orderBy('loan.dueDate', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);

        if (currentUser.role === Role.ADMIN) {
            if (userId) qb.andWhere('loan.userId = :userId', { userId });
        } else {
            qb.andWhere('loan.userId = :currentUserId', { currentUserId: currentUser.id });
        }
        if (bookId) qb.andWhere('loan.bookId = :bookId', { bookId });
        if (dueDateFrom) qb.andWhere('loan.dueDate >= :dueDateFrom', { dueDateFrom });
        if (dueDateTo) qb.andWhere('loan.dueDate <= :dueDateTo', { dueDateTo });

        if (status === LoanStatus.RETURNED) {
            qb.andWhere('loan.returnedAt IS NOT NULL');
        } else if (status === LoanStatus.ACTIVE) {
            qb.andWhere('loan.returnedAt IS NULL');
        } else if (status === LoanStatus.OVERDUE) {
            qb.andWhere('loan.returnedAt IS NULL').andWhere('loan.dueDate < :now', { now: new Date() });
        }

        const [loans, total] = await qb.getManyAndCount();
        return {
            data: loans.map((loan) => new LoanResponseDto(loan)),
            total,
            page,
            limit,
        };
    }

    async findOne(id: string, currentUserId: string, currentUserRole: Role): Promise<LoanResponseDto> {
        const loan = await this.loanRepository.findOne({
            where: { id },
            relations: LOAN_RELATIONS,
        });
        if (!loan) throw new NotFoundException(`Loan with id ${id} not found`);
        if (currentUserRole !== Role.ADMIN && loan.userId !== currentUserId) {
            throw new ForbiddenException('You can only view your own loans');
        }
        return new LoanResponseDto(loan);
    }

    async update(id: string, dto: UpdateLoanDto): Promise<LoanResponseDto> {
        if (dto.dueDate) this.assertFutureDueDate(dto.dueDate);
        const loan = await this.loanRepository.findOne({
            where: { id },
            relations: LOAN_RELATIONS,
        });
        if (!loan) throw new NotFoundException(`Loan with id ${id} not found`);
        Object.assign(loan, dto);
        const saved = await this.loanRepository.save(loan);
        return new LoanResponseDto(saved);
    }

    // Same reasoning as create(): marking the loan returned and restoring the
    // book's copy count are one logical operation and must commit/rollback together.
    @Transactional()
    async returnBook(id: string): Promise<LoanResponseDto> {
        const loan = await this.loanRepository.findOne({
            where: { id },
            relations: LOAN_RELATIONS,
        });
        if (!loan) throw new NotFoundException(`Loan with id ${id} not found`);
        if (loan.returnedAt)
            throw new BadRequestException('This loan has already been returned');
        loan.returnedAt = new Date();
        const saved = await this.loanRepository.save(loan);
        const book = await this.bookRepository.findOne({
            where: { id: loan.bookId },
        });
        if (book) {
            book.availableCopies += 1;
            await this.bookRepository.save(book);
        }
        return new LoanResponseDto(saved);
    }

    async remove(id: string): Promise<{ message: string }> {
        const loan = await this.loanRepository.findOne({ where: { id } });
        if (!loan) throw new NotFoundException(`Loan with id ${id} not found`);
        await this.loanRepository.remove(loan);
        return { message: 'The loan has been removed' };
    }

    private assertFutureDueDate(dueDate: string): void {
        if (new Date(dueDate) <= new Date()) {
            throw new BadRequestException('dueDate must be in the future');
        }
    }
}
