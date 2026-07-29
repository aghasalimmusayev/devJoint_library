import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from './entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanResponseDto } from './dto/loan-response.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Role } from '../common/enums/role.enum';

const LOAN_RELATIONS = ['book', 'book.author', 'user'];

@Injectable()
export class LoansService {
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>, @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>, @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

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

    async findAll(currentUser: AuthenticatedUser): Promise<LoanResponseDto[]> {
        const loans = await this.loanRepository.find({
            where: currentUser.role === Role.ADMIN ? {} : { userId: currentUser.id },
            relations: LOAN_RELATIONS,
        });
        return loans.map((loan) => new LoanResponseDto(loan));
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
