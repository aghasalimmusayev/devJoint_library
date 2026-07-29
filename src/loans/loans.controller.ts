import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanResponseDto } from './dto/loan-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiBearerAuth()
@ApiTags('loans')
@Controller('loans')
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    @ApiOperation({ summary: 'Borrow a book (create a loan for yourself)' })
    @ApiResponse({ status: HttpStatus.CREATED, type: LoanResponseDto })
    create(@Body() dto: CreateLoanDto, @CurrentUser() currentUser: AuthenticatedUser): Promise<LoanResponseDto> {
        return this.loansService.create(dto, currentUser.id);
    }

    @Get()
    @ApiOperation({ summary: 'List loans (own loans for USER, all loans for ADMIN)' })
    @ApiResponse({ status: HttpStatus.OK, type: [LoanResponseDto] })
    findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<LoanResponseDto[]> {
        return this.loansService.findAll(currentUser);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a loan by id' })
    @ApiResponse({ status: HttpStatus.OK, type: LoanResponseDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: AuthenticatedUser): Promise<LoanResponseDto> {
        return this.loansService.findOne(id, currentUser.id, currentUser.role);
    }

    @Roles(Role.ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: 'Update a loan (e.g. extend due date)' })
    @ApiResponse({ status: HttpStatus.OK, type: LoanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLoanDto): Promise<LoanResponseDto> {
        return this.loansService.update(id, dto);
    }

    @Roles(Role.ADMIN)
    @Patch(':id/return')
    @ApiOperation({ summary: 'Mark a loan as returned' })
    @ApiResponse({ status: HttpStatus.OK, type: LoanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    returnBook(@Param('id', ParseUUIDPipe) id: string): Promise<LoanResponseDto> {
        return this.loansService.returnBook(id);
    }

    @Roles(Role.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a loan' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        return this.loansService.remove(id);
    }
}
