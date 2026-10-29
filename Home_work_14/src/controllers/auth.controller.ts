import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service.js';
import { SigninDto, SignupDto } from '../dto/auth.dto.js';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiOperation({ summary: 'Регистрация (создаёт пользователя с ролью user)' })
    @Post('signup')
    signup(@Body() data: SignupDto) {
        return this.authService.signup(data);
    }

    @ApiOperation({ summary: 'Логин, выдаёт JWT access token (Bearer)' })
    @Post('signin')
    signin(@Body() data: SigninDto) {
        return this.authService.signin(data);
    }
}
