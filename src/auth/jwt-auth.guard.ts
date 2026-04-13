import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// A classe JwtAuthGuard estende o AuthGuard do Passport, usando a estratégia 'jwt' definida no JwtStrategy.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
