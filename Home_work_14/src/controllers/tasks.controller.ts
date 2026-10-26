import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaskService } from '../services/task.service.js';
import { Task } from '../db/Entities/Task.entity.js';
import {
    CreateTaskDto,
    TaskListQueryDto,
    UpdateTaskDto,
} from '../dto/task.dto.js';

@ApiTags('tasks')
@Controller('/tasks')
export class TasksController {
    constructor(private readonly tasksService: TaskService) { }

    @ApiOperation({ summary: 'Список задач с фильтрами и пагинацией' })
    @Get()
    getAll(
        @Query() query: TaskListQueryDto,
    ): Promise<{ items: Task[]; total: number; page: number; limit: number }> {
        return this.tasksService.getAll(query);
    }

    @ApiOperation({ summary: 'Создание задачи' })
    @Post()
    async createTask(
        @Body() data: CreateTaskDto,
        currentUserId: number,
    ) {
        await this.tasksService.createTask(currentUserId, data)
    }

    @ApiOperation({ summary: 'Обновление задачи (автор задачи или admin)' })
    @Put(':id')
    async updateTask(
        @Param('id') id: number,
        currentUserId: number,
        @Body() data: UpdateTaskDto,
    ) {
        await this.tasksService.updateTask(id, currentUserId, data)
    }

    @ApiOperation({ summary: 'Удаление задачи (автор задачи или admin)' })
    @Delete(':id')
    async deleteTask(@Param('id') id: number, currentUserId: number) {
        await this.tasksService.deleteTask(id, currentUserId)
    }
}
