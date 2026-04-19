import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Users } from '../entities/user.entity';
import { UserService } from '../user.service';
import { CreateUserInput } from '../dto/create-user.input';

@Resolver(() => Users)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => Users, { name: 'createUser' })
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<Users> {
    return this.userService.createUser(input);
  }

  @Query(() => Users, { name: 'userByUsername', nullable: true })
  async userByUsername(
    @Args('username') username: string,
  ): Promise<Users | undefined> {
    return this.userService.findByUsername(username);
  }
}
