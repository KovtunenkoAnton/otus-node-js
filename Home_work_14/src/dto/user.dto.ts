import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { EUserStatus, EUserRole } from '../constants.js';

export class CreateUserDto {
    @ApiProperty({ description: 'Имя пользователя' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Email' })
    @IsEmail()
    email: string;

    @ApiProperty({ enum: EUserRole, description: 'Роль' })
    @IsEnum(EUserRole)
    role: EUserRole;

    @ApiProperty({ enum: EUserStatus, description: 'Статус' })
    @IsEnum(EUserStatus)
    status: EUserStatus;

    @ApiPropertyOptional({ description: 'Пароль (опционально)', minLength: 6, maxLength: 72 })
    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(72)
    password?: string;
}

export class UpdateUserDto {
    @ApiPropertyOptional({ description: 'Имя пользователя' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiPropertyOptional({ description: 'Email' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ enum: EUserRole, description: 'Роль' })
    @IsOptional()
    @IsEnum(EUserRole)
    role?: EUserRole;

    @ApiPropertyOptional({ enum: EUserStatus, description: 'Статус' })
    @IsOptional()
    @IsEnum(EUserStatus)
    status?: EUserStatus;
}

export class UpdateUserStatusAndRoleDto {
    @ApiPropertyOptional({ enum: EUserRole, description: 'Роль' })
    @IsOptional()
    @IsEnum(EUserRole)
    role?: EUserRole;

    @ApiPropertyOptional({ enum: EUserStatus, description: 'Статус' })
    @IsOptional()
    @IsEnum(EUserStatus)
    status?: EUserStatus;
}
