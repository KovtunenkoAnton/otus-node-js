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
import { CommentService } from '../services/comment.service.js';
import { Comment } from '../db/Entities/Comment.entity.js';
import {
    CreateCommentDto,
    UpdateCommentDto,
    UpdateCommentStatusDto,
} from '../dto/comment.dto.js';

@ApiTags('comments')
@Controller('/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentService) { }

    @ApiOperation({ summary: 'Список видимых комментариев' })
    @Get()
    getPublic(): Promise<Comment[]> {
        return this.commentsService.getPublic();
    }

    @ApiOperation({ summary: 'Добавление комментария к задаче' })
    @Post()
    async createComment(
        @Body() data: CreateCommentDto,
        currentUserId: number,
    ) {
        await this.commentsService.createComment(currentUserId, data.taskId, data.content)
    }

    @ApiOperation({ summary: 'Обновление собственного комментария' })
    @Put(':id')
    async updateComment(
        @Param('id') id: number,
        currentUserId: number,
        @Body() data: UpdateCommentDto,
    ) {
        await this.commentsService.updateComment(id, currentUserId, data.content)
    }

    @ApiOperation({ summary: 'Удаление собственного комментария' })
    @Delete(':id')
    async deleteComment(@Param('id') id: number, currentUserId: number) {
        await this.commentsService.deleteComment(id, currentUserId)
    }

    @ApiOperation({ summary: 'Скрытие/показ комментария (автор задачи или admin)' })
    @Put(':id/status')
    async updateCommentStatus(
        @Param('id') id: number,
        currentUserId: number,
        @Body() data: UpdateCommentStatusDto,
    ) {
        await this.commentsService.updateCommentStatus(id, currentUserId, data.status)
    }
}
