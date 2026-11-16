import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import jwt from 'jsonwebtoken';
import { EUserStatus } from '../constants.js';
import { User } from '../db/Entities/User.entity.js';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: User;
        }>();

        const token = this.extractToken(request);
        if (!token) {
            throw new UnauthorizedException('Missing access token');
        }

        let payload: { sub: string; role: string };
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-jwt-secret') as {
                sub: string;
                role: string;
            };
        } catch {
            throw new UnauthorizedException('Invalid access token');
        }

        const user = await this.usersRepository.findOne({
            where: { id: Number(payload.sub) },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.status === EUserStatus.Blocked) {
            throw new ForbiddenException('User is blocked');
        }

        request.user = user;
        return true;
    }

    private extractToken(request: { headers: { authorization?: string } }) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
