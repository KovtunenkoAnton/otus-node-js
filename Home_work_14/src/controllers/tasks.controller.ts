import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaskService } from '../services/task.service.js';
import { User } from '../db/Entities/User.entity.js';
import { EUserRole } from '../constants.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import {
    CreateTaskDto,
    TaskListQueryDto,
    UpdateTaskDto,
} from '../dto/task.dto.js';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('/tasks')
@UseGuards(AuthGuard, RolesGuard)
export class TasksController {
    constructor(private readonly tasksService: TaskService) { }

    @ApiOperation({ summary: 'Список задач с фильтрами и пагинацией (любой авторизованный)' })
    @Get()
    getAll(@Query() query: TaskListQueryDto) {
        return this.tasksService.getAll(query);
    }

    @ApiOperation({ summary: 'Создание задачи (author или admin)' })
    @Post()
    @Roles(EUserRole.Author, EUserRole.Admin)
    async createTask(
        @Body() data: CreateTaskDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.tasksService.createTask(currentUser.id, data);
    }

    @ApiOperation({ summary: 'Обновление задачи (автор задачи или admin)' })
    @Put(':id')
    async updateTask(
        @Param('id') id: number,
        @CurrentUser() currentUser: User,
        @Body() data: UpdateTaskDto,
    ) {
        await this.tasksService.updateTask(id, currentUser.id, data);
    }

    @ApiOperation({ summary: 'Удаление задачи (автор задачи или admin)' })
    @Delete(':id')
    async deleteTask(@Param('id') id: number, @CurrentUser() currentUser: User) {
        await this.tasksService.deleteTask(id, currentUser.id);
    }
}
