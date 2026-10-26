import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service.js';
import { User } from '../db/Entities/User.entity.js';
import { EUserRole } from '../constants.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import {
    CreateUserDto,
    UpdateUserDto,
    UpdateUserStatusAndRoleDto,
} from '../dto/user.dto.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('/users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UserService) { }

    @ApiOperation({ summary: 'Список пользователей (admin)' })
    @Get()
    @Roles(EUserRole.Admin)
    getAll() {
        return this.usersService.getAll();
    }

    @ApiOperation({ summary: 'Создание пользователя (admin)' })
    @Post()
    @Roles(EUserRole.Admin)
    async createUser(@Body() data: CreateUserDto) {
        return this.usersService.createUser(data);
    }

    @ApiOperation({ summary: 'Удаление пользователя (admin)' })
    @Delete(':id')
    @Roles(EUserRole.Admin)
    async deleteUser(@Param('id') id: number) {
        await this.usersService.deleteUser(id);
    }

    @ApiOperation({ summary: 'Обновление: сам пользователь (имя/email) или admin (все поля)' })
    @Put(':id')
    async updateUser(
        @Param('id') id: number,
        @CurrentUser() currentUser: User,
        @Body() data: UpdateUserDto,
    ) {
        await this.usersService.updateUser(id, currentUser, data);
    }

    @ApiOperation({ summary: 'Изменение роли/статуса пользователя (admin)' })
    @Put(':id/status')
    @Roles(EUserRole.Admin)
    async updateUserStatusAndRole(
        @Param('id') id: number,
        @CurrentUser('id') currentUserId: number,
        @Body() data: UpdateUserStatusAndRoleDto,
    ) {
        await this.usersService.updateUserStatusAndRole(id, currentUserId, data);
    }
}
