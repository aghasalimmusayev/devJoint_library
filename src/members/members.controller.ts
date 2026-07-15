import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new member' })
  @ApiResponse({ status: HttpStatus.CREATED, type: MemberResponseDto })
  create(@Body() dto: CreateMemberDto): Promise<MemberResponseDto> {
    return this.membersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all members' })
  @ApiResponse({ status: HttpStatus.OK, type: [MemberResponseDto] })
  findAll(): Promise<MemberResponseDto[]> {
    return this.membersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member by id' })
  @ApiResponse({ status: HttpStatus.OK, type: MemberResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MemberResponseDto> {
    return this.membersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a member' })
  @ApiResponse({ status: HttpStatus.OK, type: MemberResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.membersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a member' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.membersService.remove(id);
  }
}
