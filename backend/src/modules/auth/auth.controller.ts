import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyMfaDto,
  EnableMfaDto,
} from './dto/auth.dto';
import { AppleLoginDto, GoogleMobileLoginDto } from './dto/oauth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mfaService: MfaService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register with email and password' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA code after login' })
  verifyMfa(@Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(dto.code, dto.tempToken);
  }

  @ApiBearerAuth()
  @Post('mfa/setup')
  @ApiOperation({ summary: 'Setup MFA - returns QR code' })
  setupMfa(@CurrentUser('id') userId: string) {
    return this.mfaService.setupMfa(userId);
  }

  @ApiBearerAuth()
  @Post('mfa/enable')
  @ApiOperation({ summary: 'Enable MFA after verifying code' })
  enableMfa(@CurrentUser('id') userId: string, @Body() dto: EnableMfaDto) {
    return this.mfaService.enableMfa(userId, dto.code);
  }

  @ApiBearerAuth()
  @Post('mfa/disable')
  @ApiOperation({ summary: 'Disable MFA' })
  disableMfa(@CurrentUser('id') userId: string, @Body() dto: EnableMfaDto) {
    return this.mfaService.disableMfa(userId, dto.code);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    return { message: 'Redirects to Google' };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.googleLogin(req.user as {
      googleId: string;
      email: string;
      name?: string;
      avatarUrl?: string;
    });
    const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT ?? 'http://localhost:3000/auth/callback';
    res.redirect(
      `${redirectUrl}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Public()
  @Post('google/mobile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google login via mobile ID token' })
  googleMobile(@Body() dto: GoogleMobileLoginDto) {
    return this.authService.googleMobileLogin(dto);
  }

  @Public()
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apple Sign-In' })
  appleLogin(@Body() dto: AppleLoginDto) {
    return this.authService.appleLogin(dto);
  }
}
