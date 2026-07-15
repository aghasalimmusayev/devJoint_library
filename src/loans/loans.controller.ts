import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanResponseDto } from './dto/loan-response.dto';

@ApiTags('loans')
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Borrow a book (create a loan)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LoanResponseDto })
  create(@Body() dto: CreateLoanDto): Promise<LoanResponseDto> {
    return this.loansService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all loans' })
  @ApiResponse({ status: HttpStatus.OK, type: [LoanResponseDto] })
  findAll(): Promise<LoanResponseDto[]> {
    return this.loansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan by id' })
  @ApiResponse({ status: HttpStatus.OK, type: LoanResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LoanResponseDto> {
    return this.loansService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a loan (e.g. extend due date)' })
  @ApiResponse({ status: HttpStatus.OK, type: LoanResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanDto,
  ): Promise<LoanResponseDto> {
    return this.loansService.update(id, dto);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Mark a loan as returned' })
  @ApiResponse({ status: HttpStatus.OK, type: LoanResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  returnBook(@Param('id', ParseUUIDPipe) id: string): Promise<LoanResponseDto> {
    return this.loansService.returnBook(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a loan' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.loansService.remove(id);
  }
}
