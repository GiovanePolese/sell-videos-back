// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService, // Serviço para buscar usuários
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);

    // Para descobrir a Hash
    // const passwordHash = await bcrypt.hash(password, 10);
    // console.log(passwordHash);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user; // Excluir senha
      // Gerar o payload do JWT
      const payload = { sub: result.id, username: user.name };

      // Retorne o token JWT
      return {
        access_token: this.jwtService.sign(payload),
      };
    } else {
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }
}
