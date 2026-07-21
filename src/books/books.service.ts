import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { BookQueryDto } from './dto/book-query.dto';
import { AuthorsService } from '../authors/authors.service';

const SORTABLE_FIELDS = ['title', 'publishedDate', 'createdAt'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

function isSortableField(value: unknown): value is SortableField {
    return SORTABLE_FIELDS.includes(value as SortableField);
}

@Injectable()
export class BooksService {
    constructor(@InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
        private readonly authorsService: AuthorsService,
    ) { }

    async create(dto: CreateBookDto): Promise<BookResponseDto> {
        await this.authorsService.getOrThrow(dto.authorId);
        const book = this.bookRepository.create({
            ...dto,
            availableCopies: dto.totalCopies,
        });
        const saved = await this.save(book);
        return new BookResponseDto(saved);
    }

    async findAll(query: BookQueryDto): Promise<{
        data: BookResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        const { page, limit, sortBy, order, authorId } = query;
        const sortField = isSortableField(sortBy) ? sortBy : 'createdAt';
        const qb = this.bookRepository
            .createQueryBuilder('book')
            .leftJoinAndSelect('book.author', 'author')
            .orderBy(`book.${sortField}`, order ?? 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (authorId) qb.andWhere('book.authorId = :authorId', { authorId });
        const [books, total] = await qb.getManyAndCount();
        return {
            data: books.map((book) => new BookResponseDto(book)),
            total,
            page,
            limit,
        };
    }

    async findOne(id: string): Promise<BookResponseDto> {
        const book = await this.getOrThrow(id);
        return new BookResponseDto(book);
    }

    async update(id: string, dto: UpdateBookDto): Promise<BookResponseDto> {
        const book = await this.getOrThrow(id);
        if (dto.authorId) await this.authorsService.getOrThrow(dto.authorId);
        Object.assign(book, dto);
        const saved = await this.save(book);
        return new BookResponseDto(saved);
    }

    async remove(id: string): Promise<{ message: string }> {
        const book = await this.getOrThrow(id);
        await this.bookRepository.remove(book);
        return { message: 'The book has been removed' }
    }

    private async save(book: Book): Promise<Book> {
        const saved = await this.bookRepository.save(book);
        return this.getOrThrow(saved.id);
    }

    private async getOrThrow(id: string): Promise<Book> {
        const book = await this.bookRepository.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!book) throw new NotFoundException(`Book with id ${id} not found`);
        return book;
    }
}
