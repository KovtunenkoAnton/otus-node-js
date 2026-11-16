import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcryptjs';
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
        return this.usersRepository.find().then((users) => users.map((u) => u.toPublic()));
    }

    async createUser(data: CreateUserDto) {
        const passwordHash = data.password
            ? await hash(data.password, 10)
            : '';

        const user = this.usersRepository.create({ ...data, passwordHash });
        const saved = await this.usersRepository.save(user);
        return saved.toPublic();
    }

    async deleteUser(id: number) {
        await this.usersRepository.delete({ id });
    }

    async updateUser(id: number, currentUser: User, data: UpdateUserDto) {
        const existing = await this.usersRepository.findOne({ where: { id } });

        if (!existing) {
            throw new NotFoundException(`User id=${id} not found`);
        }

        if (currentUser.id === id) {
            const updates: Partial<Pick<User, 'name' | 'email'>> = {};
            if (data.name) updates.name = data.name;
            if (data.email) updates.email = data.email;
            await this.usersRepository.update(id, updates);
            return;
        }

        if (currentUser.role !== EUserRole.Admin) {
            throw new ForbiddenException('Insufficient permissions');
        }

        await this.usersRepository.update(id, data);
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
            throw new ForbiddenException('Insufficient permissions');
        }

        const existing = await this.usersRepository.findOne({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`User id=${id} not found`);
        }

        await this.usersRepository.update(id, updates);
    }
}
