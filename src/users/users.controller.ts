import { Body, Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Roles(Role.ADMIN)
    @Get()
    @ApiOperation({ summary: 'List all users' })
    @ApiResponse({ status: HttpStatus.OK, type: [UserResponseDto] })
    findAll(): Promise<UserResponseDto[]> {
        return this.usersService.findAll();
    }

    @Roles(Role.ADMIN)
    @Get(':id')
    @ApiOperation({ summary: 'Get a user by id' })
    @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update your own profile' })
    @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ): Promise<UserResponseDto> {
        return this.usersService.update(id, dto, currentUser.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete your own profile' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.FORBIDDEN })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: AuthenticatedUser,
    ): Promise<{ message: string }> {
        return this.usersService.remove(id, currentUser.id);
    }
}
