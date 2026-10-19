import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TagDto {
    @ApiProperty({ description: 'Название тега' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
