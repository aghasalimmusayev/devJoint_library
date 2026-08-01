import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiBearerAuth()
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Roles(Role.ADMIN)
    @Post()
    @ApiOperation({ summary: 'Create a new category' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CategoryResponseDto })
    create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
        return this.categoriesService.create(dto);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all categories' })
    @ApiResponse({ status: HttpStatus.OK, type: [CategoryResponseDto] })
    findAll(): Promise<CategoryResponseDto[]> {
        return this.categoriesService.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get a category by id' })
    @ApiResponse({ status: HttpStatus.OK, type: CategoryResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
        return this.categoriesService.findOne(id);
    }

    @Roles(Role.ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a category' })
    @ApiResponse({ status: HttpStatus.OK, type: CategoryResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
        return this.categoriesService.update(id, dto);
    }

    @Roles(Role.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a category' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        return this.categoriesService.remove(id);
    }
}
