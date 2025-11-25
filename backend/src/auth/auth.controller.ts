import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register/driver/:token')
  @HttpCode(HttpStatus.CREATED)
  async registerDriver(
    @Param('token') token: string,
    @Body() registerDto: RegisterDriverDto,
  ) {
    return this.authService.registerDriver(token, registerDto);
  }
}

