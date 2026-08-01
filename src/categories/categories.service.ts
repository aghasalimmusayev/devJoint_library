import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
    constructor(@InjectRepository(Category) private readonly categoryRepository: Repository<Category>) { }

    async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
        const existing = await this.categoryRepository.findOne({ where: { name: ILike(dto.name) } });
        if (existing) throw new ConflictException(`Category with name "${dto.name}" already exists`);
        const category = this.categoryRepository.create(dto);
        const saved = await this.categoryRepository.save(category);
        return new CategoryResponseDto(saved);
    }

    async findAll(): Promise<CategoryResponseDto[]> {
        const categories = await this.categoryRepository.find();
        return categories.map((category) => new CategoryResponseDto(category));
    }

    async findOne(id: string): Promise<CategoryResponseDto> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) throw new NotFoundException(`Category with id ${id} not found`);
        return new CategoryResponseDto(category);
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) throw new NotFoundException(`Category with id ${id} not found`);
        if (dto.name) {
            const existing = await this.categoryRepository.findOne({ where: { name: ILike(dto.name) } });
            if (existing && existing.id !== id) throw new ConflictException(`Category with name "${dto.name}" already exists`);
        }
        Object.assign(category, dto);
        const saved = await this.categoryRepository.save(category);
        return new CategoryResponseDto(saved);
    }

    async remove(id: string): Promise<{ message: string }> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) throw new NotFoundException(`Category with id ${id} not found`);
        await this.categoryRepository.remove(category);
        return { message: 'The category has been removed' };
    }

    /** Loads entities for the given ids; throws if any id does not exist. Used by BooksService to attach categories. */
    async findByIds(ids: string[]): Promise<Category[]> {
        const categories = await this.categoryRepository.findBy({ id: In(ids) });
        const foundIds = new Set(categories.map((category) => category.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        if (missing.length > 0)
            throw new NotFoundException(`Category(ies) not found: ${missing.join(', ')}`);
        return categories;
    }
}
