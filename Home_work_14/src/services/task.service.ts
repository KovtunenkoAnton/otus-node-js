import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { ETaskStatus, EUserRole } from '../constants.js';
import { Task } from '../db/Entities/Task.entity.js';
import { Tag } from '../db/Entities/Tag.entity.js';
import { User } from '../db/Entities/User.entity.js';

interface TaskListQuery {
    tag?: string;
    status?: ETaskStatus;
    author?: number;
    q?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,
        @InjectRepository(Tag)
        private tagsRepository: Repository<Tag>,
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) { }

    async getAll(query: TaskListQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;

        const base: FindOptionsWhere<Task> = {};

        if (query.status) {
            base.status = query.status;
        }

        if (query.author) {
            base.author = { id: query.author };
        }

        if (query.tag) {
            base.tags = { name: query.tag };
        }

        const where: FindOptionsWhere<Task>[] = query.q
            ? [
                { ...base, title: ILike(`%${query.q}%`) },
                { ...base, content: ILike(`%${query.q}%`) },
            ]
            : [base];

        const [items, total] = await Promise.all([
            this.tasksRepository.find({
                where,
                relations: { tags: true, author: true },
                order: { id: 'DESC' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.tasksRepository.count({ where }),
        ]);

        return {
            items: items.map((t) => ({ ...t, author: t.author?.toPublic() })),
            total,
            page,
            limit,
        };
    }

    async createTask(
        currentUserId: number,
        data: { title: string; content: string; status: ETaskStatus; tags?: number[] },
    ) {
        const author = await this.usersRepository.findOne({
            where: { id: currentUserId },
        });

        if (!author) {
            throw new NotFoundException(`User id=${currentUserId} not found`);
        }

        const tags = data.tags
            ? await this.tagsRepository.findBy({ id: In(data.tags) })
            : [];

        const task = this.tasksRepository.create({
            title: data.title,
            content: data.content,
            status: data.status,
            author,
            tags,
        });

        const saved = await this.tasksRepository.save(task);
        return { ...saved, author: saved.author?.toPublic() };
    }

    async updateTask(
        id: number,
        currentUserId: number,
        data: Partial<{ title: string; content: string; status: ETaskStatus; tags: number[] }>,
    ) {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: { author: true },
        });

        if (!task) {
            throw new NotFoundException(`Task id=${id} not found`);
        }

        await this.assertCanManageTask(currentUserId, task);

        const { tags, ...fields } = data;
        const updates: Partial<Task> = { ...fields };

        if (tags) {
            updates.tags = await this.tagsRepository.findBy({ id: In(tags) });
        }

        await this.tasksRepository.update(id, updates);
    }

    async deleteTask(id: number, currentUserId: number) {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: { author: true },
        });

        if (!task) {
            throw new NotFoundException(`Task id=${id} not found`);
        }

        await this.assertCanManageTask(currentUserId, task);

        await this.tasksRepository.delete({ id });
    }

    private async assertCanManageTask(currentUserId: number, task: Task) {
        const current = await this.usersRepository.findOne({
            where: { id: currentUserId },
        });

        if (current?.role === EUserRole.Admin) {
            return;
        }

        if (!current || task.author.id !== currentUserId) {
            throw new ForbiddenException('Insufficient permissions');
        }
    }
}
