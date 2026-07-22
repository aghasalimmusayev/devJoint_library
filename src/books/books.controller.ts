import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Patch,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { BookQueryDto } from './dto/book-query.dto';

@ApiTags('books')
@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new book' })
    @ApiResponse({ status: HttpStatus.CREATED, type: BookResponseDto })
    create(@Body() dto: CreateBookDto): Promise<BookResponseDto> {
        return this.booksService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List books with pagination and sorting' })
    @ApiResponse({ status: HttpStatus.OK })
    findAll(@Query() query: BookQueryDto) {
        return this.booksService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a book by id' })
    @ApiResponse({ status: HttpStatus.OK, type: BookResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BookResponseDto> {
        return this.booksService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a book' })
    @ApiResponse({ status: HttpStatus.OK, type: BookResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateBookDto,
    ): Promise<BookResponseDto> {
        return this.booksService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a book' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    remove(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ message: string }> {
        return this.booksService.remove(id);
    }
}
