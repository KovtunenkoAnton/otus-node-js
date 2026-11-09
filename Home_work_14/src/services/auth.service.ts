import {
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { User } from '../db/Entities/User.entity.js';
import { EUserStatus, EUserRole } from '../constants.js';
import { SigninDto, SignupDto } from '../dto/auth.dto.js';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async signup(data: SignupDto) {
        const email = data.email.toLowerCase();

        const existing = await this.usersRepository.findOne({ where: { email } });
        if (existing) {
            throw new ConflictException('Email is already in use');
        }

        const passwordHash = await hash(data.password, 10);
        const user = this.usersRepository.create({
            name: data.name,
            email,
            passwordHash,
            role: EUserRole.User,
            status: EUserStatus.Active,
        });

        const saved = await this.usersRepository.save(user);
        return saved.toPublic();
    }

    async signin(data: SigninDto) {
        const email = data.email.toLowerCase();

        const user = await this.usersRepository.findOne({ where: { email } });
        const isPasswordValid =
            user?.passwordHash && (await compare(data.password, user.passwordHash));

        if (!user || !isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.status === EUserStatus.Blocked) {
            throw new ForbiddenException('User is blocked');
        }

        const accessToken = jwt.sign(
            { sub: String(user.id), role: user.role },
            this.getSecret(),
            { expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 3600) },
        );

        return { accessToken };
    }

    private getSecret() {
        return process.env.JWT_SECRET ?? 'dev-jwt-secret';
    }
}
