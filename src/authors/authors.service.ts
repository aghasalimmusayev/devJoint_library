import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorResponseDto } from './dto/author-response.dto';

@Injectable()
export class AuthorsService {
    constructor(
        @InjectRepository(Author)
        private readonly authorRepository: Repository<Author>,
    ) {}

    async create(dto: CreateAuthorDto): Promise<AuthorResponseDto> {
        const author = this.authorRepository.create(dto);
        const saved = await this.authorRepository.save(author);
        return new AuthorResponseDto(saved);
    }

    async findAll(): Promise<AuthorResponseDto[]> {
        const authors = await this.authorRepository.find();
        return authors.map((author) => new AuthorResponseDto(author));
    }

    async findOne(id: string): Promise<AuthorResponseDto> {
        const author = await this.getOrThrow(id);
        return new AuthorResponseDto(author);
    }

    async update(id: string, dto: UpdateAuthorDto): Promise<AuthorResponseDto> {
        const author = await this.getOrThrow(id);
        Object.assign(author, dto);
        const saved = await this.authorRepository.save(author);
        return new AuthorResponseDto(saved);
    }

    async remove(id: string): Promise<{ message: string }> {
        const author = await this.getOrThrow(id);
        await this.authorRepository.remove(author);
        return { message: 'The author has been removed' };
    }

    async getOrThrow(id: string): Promise<Author> {
        const author = await this.authorRepository.findOne({ where: { id } });
        if (!author)
            throw new NotFoundException(`Author with id ${id} not found`);
        return author;
    }
}
