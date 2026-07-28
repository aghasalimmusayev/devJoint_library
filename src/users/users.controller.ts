import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'List all users' })
    @ApiResponse({ status: HttpStatus.OK, type: [UserResponseDto] })
    findAll(): Promise<UserResponseDto[]> {
        return this.usersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a user by id' })
    @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update the user' })
    @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
        return this.usersService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete the user' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        return this.usersService.remove(id);
    }
}
