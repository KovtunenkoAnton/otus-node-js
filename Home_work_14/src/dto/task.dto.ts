import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { ETaskStatus } from '../constants.js';

export class CreateTaskDto {
    @ApiProperty({ description: 'Название задачи' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Описание задачи' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ enum: ETaskStatus, description: 'Статус задачи' })
    @IsEnum(ETaskStatus)
    status: ETaskStatus;

    @ApiPropertyOptional({ description: 'Список id тегов', type: [Number] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    tags?: number[];
}

export class UpdateTaskDto {
    @ApiPropertyOptional({ description: 'Название задачи' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @ApiPropertyOptional({ description: 'Описание задачи' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    content?: string;

    @ApiPropertyOptional({ enum: ETaskStatus, description: 'Статус задачи' })
    @IsOptional()
    @IsEnum(ETaskStatus)
    status?: ETaskStatus;

    @ApiPropertyOptional({ description: 'Список id тегов', type: [Number] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    tags?: number[];
}

export class TaskListQueryDto {
    @ApiPropertyOptional({ description: 'Фильтр по названию тега' })
    @IsOptional()
    @IsString()
    tag?: string;

    @ApiPropertyOptional({ enum: ETaskStatus, description: 'Фильтр по статусу' })
    @IsOptional()
    @IsEnum(ETaskStatus)
    status?: ETaskStatus;

    @ApiPropertyOptional({ description: 'Фильтр по id автора' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    author?: number;

    @ApiPropertyOptional({ description: 'Поиск по названию и описанию' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ description: 'Номер страницы', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Размер страницы', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}
