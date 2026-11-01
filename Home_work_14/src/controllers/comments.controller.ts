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
import { CommentService } from '../services/comment.service.js';
import { User } from '../db/Entities/User.entity.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
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
    getPublic() {
        return this.commentsService.getPublic();
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Добавление комментария к задаче (любой авторизованный)' })
    @Post()
    @UseGuards(AuthGuard)
    async createComment(
        @Body() data: CreateCommentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.commentsService.createComment(currentUser.id, data.taskId, data.content);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Обновление собственного комментария' })
    @Put(':id')
    @UseGuards(AuthGuard)
    async updateComment(
        @Param('id') id: number,
        @CurrentUser() currentUser: User,
        @Body() data: UpdateCommentDto,
    ) {
        await this.commentsService.updateComment(id, currentUser.id, data.content);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Удаление собственного комментария' })
    @Delete(':id')
    @UseGuards(AuthGuard)
    async deleteComment(@Param('id') id: number, @CurrentUser() currentUser: User) {
        await this.commentsService.deleteComment(id, currentUser.id);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Скрытие/показ комментария (автор задачи или admin)' })
    @Put(':id/status')
    @UseGuards(AuthGuard)
    async updateCommentStatus(
        @Param('id') id: number,
        @CurrentUser() currentUser: User,
        @Body() data: UpdateCommentStatusDto,
    ) {
        await this.commentsService.updateCommentStatus(id, currentUser.id, data.status);
    }
}
