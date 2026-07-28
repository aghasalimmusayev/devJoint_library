import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorResponseDto } from './dto/author-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('authors')
@Controller('authors')
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new author' })
    @ApiResponse({ status: HttpStatus.CREATED, type: AuthorResponseDto })
    create(@Body() dto: CreateAuthorDto): Promise<AuthorResponseDto> {
        return this.authorsService.create(dto);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all authors' })
    @ApiResponse({ status: HttpStatus.OK, type: [AuthorResponseDto] })
    findAll(): Promise<AuthorResponseDto[]> {
        return this.authorsService.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get an author by id' })
    @ApiResponse({ status: HttpStatus.OK, type: AuthorResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<AuthorResponseDto> {
        return this.authorsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an author' })
    @ApiResponse({ status: HttpStatus.OK, type: AuthorResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAuthorDto,
    ): Promise<AuthorResponseDto> {
        return this.authorsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an author' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    remove(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ message: string }> {
        return this.authorsService.remove(id);
    }
}
