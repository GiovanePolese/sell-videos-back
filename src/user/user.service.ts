import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async createUser(payload: CreateUserInput | string): Promise<Users> {
    const userData: Partial<Users> =
      typeof payload === 'string'
        ? { name: payload, password: '', dica_senha: '' }
        : {
            name: payload.name,
            password: payload.password,
            dica_senha: payload.dicaSenha,
          };

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findByUsername(name: string): Promise<Users | undefined> {
    return this.userRepository.findOne({ where: { name } });
  }
}
