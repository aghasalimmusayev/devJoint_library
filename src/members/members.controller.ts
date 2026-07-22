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
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<MemberResponseDto> {
        return this.membersService.findOne(id);
    }

    @Patch(':id')
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
    @ApiOperation({ summary: 'Delete a member' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    remove(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ message: string }> {
        return this.membersService.remove(id);
    }
}
