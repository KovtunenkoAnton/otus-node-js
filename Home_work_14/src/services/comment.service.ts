import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ECommentStatus, EUserRole } from '../constants.js';
import { Comment } from '../db/Entities/Comment.entity.js';
import { Task } from '../db/Entities/Task.entity.js';
import { User } from '../db/Entities/User.entity.js';

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) { }

    getPublic() {
        return this.commentsRepository.find({
            where: {status: ECommentStatus.Visible },
            relations: { author: true },
            order: { id: 'ASC' },
        });
    }

    async createComment(currentUserId: number, taskId: number, content: string) {
        const author = await this.usersRepository.findOne({
            where: { id: currentUserId },
        });

        if (!author) {
            throw new Error(`User id=${currentUserId} notFound`);
        }

        const task = await this.tasksRepository.findOne({
            where: { id: taskId },
        });

        if (!task) {
            throw new Error(`Task id=${taskId} notFound`);
        }

        const comment = this.commentsRepository.create({
            content,
            status: ECommentStatus.Visible,
            author,
            task,
        });

        return this.commentsRepository.save(comment);
    }

    async updateComment(id: number, currentUserId: number, content: string) {
        const comment = await this.findCommentOrFail(id);

        if (comment.author.id !== currentUserId) {
            throw new Error(`User id=${currentUserId} can not manage comment id=${id}`);
        }

        await this.commentsRepository.update(id, { content });
    }

    async deleteComment(id: number, currentUserId: number) {
        const comment = await this.findCommentOrFail(id);

        if (comment.author.id !== currentUserId) {
            throw new Error(`User id=${currentUserId} can not manage comment id=${id}`);
        }

        await this.commentsRepository.delete({ id });
    }

    async updateCommentStatus(id: number, currentUserId: number, status: ECommentStatus) {
        const comment = await this.commentsRepository.findOne({
            where: { id },
            relations: { task: { author: true } },
        });

        if (!comment) {
            throw new Error(`Comment id=${id} notFound`);
        }

        const current = await this.usersRepository.findOne({
            where: { id: currentUserId },
        });

        const isAdmin = current?.role === EUserRole.Admin;
        const isTaskAuthor = comment.task.author.id === currentUserId;

        if (!isAdmin && !isTaskAuthor) {
            throw new Error(`User id=${currentUserId} can not manage comment id=${id}`);
        }

        await this.commentsRepository.update(id, { status });
    }

    private async findCommentOrFail(id: number) {
        const comment = await this.commentsRepository.findOne({
            where: { id },
            relations: { author: true },
        });

        if (!comment) {
            throw new Error(`Comment id=${id} notFound`);
        }

        return comment;
    }
}
