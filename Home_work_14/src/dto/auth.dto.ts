import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
    @ApiProperty({ description: 'Имя пользователя' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Email' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Пароль', minLength: 6, maxLength: 72 })
    @IsString()
    @MinLength(6)
    @MaxLength(72)
    password: string;
}

export class SigninDto {
    @ApiProperty({ description: 'Email' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Пароль' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
