import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service.js';
import { User } from '../db/Entities/User.entity.js';
import { CreateUserDto, UpdateUserDto, UpdateUserStatusAndRoleDto } from '../dto/user.dto.js';

@ApiTags('users')
@Controller('/users')
export class UsersController {
    constructor(private readonly usersService: UserService) { }

    @ApiOperation({ summary: 'Список пользователей' })
    @Get()
    getAll(): Promise<User[]> {
        return this.usersService.getAll();
    }

    @ApiOperation({ summary: 'Регистрация пользователя' })
    @Post()
    async createUser(@Body() data: CreateUserDto) {
        await this.usersService.createUser(data)
    }

    @ApiOperation({ summary: 'Удаление пользователя' })
    @Delete(':id')
    async deleteUser(@Param('id') id: number) {
        await this.usersService.deleteUser(id)
    }

    @ApiOperation({ summary: 'Обновление пользователя' })
    @Put(':id')
    async updateUser(@Param('id') id: number, @Body() data: UpdateUserDto) {
        await this.usersService.updateUser(id, data)
    }

    @ApiOperation({ summary: 'Изменение роли/статуса пользователя (admin)' })
    @Put(':id/status')
    async updateUserStatusAndRole(
        @Param('id') id: number,
        currentUserId: number,
        @Body() data: UpdateUserStatusAndRoleDto,
    ) {
        await this.usersService.updateUserStatusAndRole(id, currentUserId, data)
    }
}
