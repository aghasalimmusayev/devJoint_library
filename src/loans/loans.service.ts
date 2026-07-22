import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from './entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { Member } from '../members/entities/member.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanResponseDto } from './dto/loan-response.dto';

@Injectable()
export class LoansService {
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,
        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,
    ) {}

    async create(data: CreateLoanDto): Promise<LoanResponseDto> {
        this.assertFutureDueDate(data.dueDate);
        const book = await this.bookRepository.findOne({
            where: { id: data.bookId },
        });
        if (!book)
            throw new NotFoundException(
                `Book with id ${data.bookId} not found`,
            );
        if (book.availableCopies < 1)
            throw new BadRequestException('No available copies for this book');
        const member = await this.memberRepository.findOne({
            where: { id: data.memberId },
        });
        if (!member)
            throw new NotFoundException(
                `Member with id ${data.memberId} not found`,
            );
        book.availableCopies -= 1;
        await this.bookRepository.save(book);
        const loan = this.loanRepository.create(data);
        const saved = await this.loanRepository.save(loan);
        return this.findOne(saved.id);
    }

    async findAll(): Promise<LoanResponseDto[]> {
        const loans = await this.loanRepository.find({
            relations: ['book', 'book.author', 'member'],
        });
        return loans.map((loan) => new LoanResponseDto(loan));
    }

    async findOne(id: string): Promise<LoanResponseDto> {
        const loan = await this.getOrThrow(id);
        return new LoanResponseDto(loan);
    }

    async update(id: string, dto: UpdateLoanDto): Promise<LoanResponseDto> {
        if (dto.dueDate) this.assertFutureDueDate(dto.dueDate);
        const loan = await this.getOrThrow(id);
        Object.assign(loan, dto);
        const saved = await this.loanRepository.save(loan);
        return this.findOne(saved.id);
    }

    async returnBook(id: string): Promise<LoanResponseDto> {
        const loan = await this.getOrThrow(id);
        if (loan.returnedAt)
            throw new BadRequestException(
                'This loan has already been returned',
            );
        loan.returnedAt = new Date();
        await this.loanRepository.save(loan);
        const book = await this.bookRepository.findOne({
            where: { id: loan.bookId },
        });
        if (book) {
            book.availableCopies += 1;
            await this.bookRepository.save(book);
        }
        return this.findOne(id);
    }

    async remove(id: string): Promise<{ message: string }> {
        const loan = await this.getOrThrow(id);
        await this.loanRepository.remove(loan);
        return { message: 'The loan has been removed' };
    }

    private assertFutureDueDate(dueDate: string): void {
        if (new Date(dueDate) <= new Date()) {
            throw new BadRequestException('dueDate must be in the future');
        }
    }

    private async getOrThrow(id: string): Promise<Loan> {
        const loan = await this.loanRepository.findOne({
            where: { id },
            relations: ['book', 'book.author', 'member'],
        });
        if (!loan) throw new NotFoundException(`Loan with id ${id} not found`);
        return loan;
    }
}
