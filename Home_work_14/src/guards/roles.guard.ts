import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EUserRole } from '../constants.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { User } from '../db/Entities/User.entity.js';

/**
 * Проверяет, что роль пользователя из request.user (заполнен AuthGuard'ом)
 * входит в список ролей из @Roles(). Без @Roles() пропускает всех.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<EUserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const user = context.switchToHttp().getRequest<{ user?: User }>().user;

        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
