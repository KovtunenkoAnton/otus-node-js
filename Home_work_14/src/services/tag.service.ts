import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EUserRole } from '../constants.js';
import { Tag } from '../db/Entities/Tag.entity.js';
import { User } from '../db/Entities/User.entity.js';
import { TagDto } from '../dto/tag.dto.js';

@Injectable()
export class TagService {
    constructor(
        @InjectRepository(Tag)
        private tagsRepository: Repository<Tag>,
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) { }

    getAll() {
        return this.tagsRepository.find();
    }

    async createTag(currentUserId: number, tag: TagDto) {
        await this.assertAdmin(currentUserId);

        return this.tagsRepository.save(tag);
    }

    async updateTag(id: number, currentUserId: number, tag: TagDto) {
        await this.assertAdmin(currentUserId);

        const existing = await this.tagsRepository.findOne({
            where: { id },
        });

        if (!existing) {
            throw new Error(`Tag id=${id} notFound`);
        }

        await this.tagsRepository.update(id, { ...existing, ...tag });
    }

    async deleteTag(id: number, currentUserId: number) {
        await this.assertAdmin(currentUserId);

        await this.tagsRepository.delete({ id });
    }

    private async assertAdmin(currentUserId: number) {
        const current = await this.usersRepository.findOne({
            where: { id: currentUserId },
        });

        if (!current || current.role !== EUserRole.Admin) {
            throw new Error(`User id=${currentUserId} is not admin`);
        }
    }
}
