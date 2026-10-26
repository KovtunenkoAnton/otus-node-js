import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsString,
    Min,
} from 'class-validator';
import { ECommentStatus } from '../constants.js';

export class CreateCommentDto {
    @ApiProperty({ description: 'Текст комментария' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ description: 'Id задачи' })
    @IsInt()
    @Min(1)
    taskId: number;
}

export class UpdateCommentDto {
    @ApiProperty({ description: 'Текст комментария' })
    @IsString()
    @IsNotEmpty()
    content: string;
}

export class UpdateCommentStatusDto {
    @ApiProperty({ enum: ECommentStatus, description: 'Статус комментария (видимый/скрытый)' })
    @IsEnum(ECommentStatus)
    status: ECommentStatus;
}
