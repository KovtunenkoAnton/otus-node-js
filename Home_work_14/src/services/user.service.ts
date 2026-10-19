import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/Entities/User.entity.js';
import { EUserRole } from '../constants.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) { }

    getAll() {
        return this.usersRepository.find();
    }

    async createUser(data: CreateUserDto) {
        await this.usersRepository.save(data);
    }

    async deleteUser(id: number) {
        await this.usersRepository.delete({ id });
    }

    async updateUser(id: number, data: UpdateUserDto) {
        const existing = await this.usersRepository.findOne({
            where: { id },
        });

        if (!existing) {
            throw new Error(`User id=${id} notFound`);
        }

        await this.usersRepository.update(id, { ...existing, ...data });
    }

    async updateUserStatusAndRole(
        id: number,
        currentUserId: number,
        updates: Partial<Pick<User, 'role' | 'status'>>,
    ) {
        const current = await this.usersRepository.findOne({
            where: { id: currentUserId },
        });

        if (!current || current.role !== EUserRole.Admin) {
            throw new Error(`User id=${currentUserId} is not admin`);
        }

        const existing = await this.usersRepository.findOne({
            where: { id },
        });

        if (!existing) {
            throw new Error(`User id=${id} notFound`);
        }

        await this.usersRepository.update(id, updates);
    }
}
