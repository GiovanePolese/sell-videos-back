import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { Users } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('addDB')
  async createUser(@Body('name') name: string): Promise<string> {
    await this.userService.createUser(name);
    return `usuário ${name} adicionado no banco com sucesso`;
  }

  @Get('username/:username')
  async findByUsername(
    @Param('username') username: string,
  ): Promise<Users | undefined> {
    return this.userService.findByUsername(username);
  }
}
