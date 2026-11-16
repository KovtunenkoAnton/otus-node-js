import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../db/Entities/User.entity.js';

export const CurrentUser = createParamDecorator(
    (data: keyof User | undefined, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<{ user?: User }>();
        return data ? request.user?.[data] : request.user;
    },
);
