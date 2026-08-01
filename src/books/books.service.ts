import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { BookQueryDto } from './dto/book-query.dto';
import { AuthorsService } from '../authors/authors.service';
import { CategoriesService } from '../categories/categories.service';

const BOOK_RELATIONS = ['author', 'categories'];

const SORTABLE_FIELDS = ['title', 'publishedDate', 'createdAt'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

function isSortableField(value: unknown): value is SortableField {
    return SORTABLE_FIELDS.includes(value as SortableField);
}

@Injectable()
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,
        private readonly authorsService: AuthorsService,
        private readonly categoriesService: CategoriesService,
    ) {}

    async create(dto: CreateBookDto): Promise<BookResponseDto> {
        await this.authorsService.findOne(dto.authorId);
        const { categoryIds, ...rest } = dto;
        const book = this.bookRepository.create({
            ...rest,
            availableCopies: dto.totalCopies,
        });
        if (categoryIds) book.categories = await this.categoriesService.findByIds(categoryIds);
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
        // categories is a to-many relation: joining it directly here would multiply
        // rows and break skip/take pagination, so it's batch-loaded separately below.
        const qb = this.bookRepository
            .createQueryBuilder('book')
            .leftJoinAndSelect('book.author', 'author')
            .orderBy(`book.${sortField}`, order ?? 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (authorId) qb.andWhere('book.authorId = :authorId', { authorId });
        const [books, total] = await qb.getManyAndCount();
        await this.attachCategories(books);
        return {
            data: books.map((book) => new BookResponseDto(book)),
            total,
            page,
            limit,
        };
    }

    async findOne(id: string): Promise<BookResponseDto> {
        const book = await this.bookRepository.findOne({
            where: { id },
            relations: BOOK_RELATIONS,
        });
        if (!book) throw new NotFoundException(`Book with id ${id} not found`);
        return new BookResponseDto(book);
    }

    async update(id: string, dto: UpdateBookDto): Promise<BookResponseDto> {
        const book = await this.bookRepository.findOne({
            where: { id },
            relations: BOOK_RELATIONS,
        });
        if (!book) throw new NotFoundException(`Book with id ${id} not found`);
        if (dto.authorId) await this.authorsService.findOne(dto.authorId);
        const { categoryIds, ...rest } = dto;
        Object.assign(book, rest);
        if (categoryIds) book.categories = await this.categoriesService.findByIds(categoryIds);
        const saved = await this.save(book);
        return new BookResponseDto(saved);
    }

    async remove(id: string): Promise<{ message: string }> {
        const book = await this.bookRepository.findOne({
            where: { id },
            relations: BOOK_RELATIONS,
        });
        if (!book) throw new NotFoundException(`Book with id ${id} not found`);
        await this.bookRepository.remove(book);
        return { message: 'The book has been removed' };
    }

    private async save(book: Book): Promise<Book> {
        const saved = await this.bookRepository.save(book);
        const reloaded = await this.bookRepository.findOne({
            where: { id: saved.id },
            relations: BOOK_RELATIONS,
        });
        if (!reloaded) throw new NotFoundException(`Book with id ${saved.id} not found`);
        return reloaded;
    }

    /** Batch-loads categories for a page of books in a single extra query, avoiding N+1. */
    private async attachCategories(books: Book[]): Promise<void> {
        if (books.length === 0) return;
        const bookIds = books.map((book) => book.id);
        const withCategories = await this.bookRepository
            .createQueryBuilder('book')
            .leftJoinAndSelect('book.categories', 'categories')
            .where('book.id IN (:...bookIds)', { bookIds })
            .getMany();
        const categoriesByBookId = new Map(withCategories.map((book) => [book.id, book.categories]));
        for (const book of books) {
            book.categories = categoriesByBookId.get(book.id) ?? [];
        }
    }
}
