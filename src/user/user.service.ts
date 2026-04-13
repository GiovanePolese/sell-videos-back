import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  // Criar um usuário
  async createUser(name: string): Promise<Users> {
    const user = this.userRepository.create({ name });
    return this.userRepository.save(user);
  }

  async findByUsername(name: string): Promise<Users | undefined> {
    return this.userRepository.findOne({ where: { name } });
  }
}
