import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Context } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderService } from '../order.service';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Query(() => [Order], { 
    name: 'meusPedidos',
    description: 'Retorna a lista de pedidos do usuário autenticado, ordenados do mais recente para o mais antigo.'
  })
  @UseGuards(GqlAuthGuard)
  async getMyOrders(@Context() context): Promise<Order[]> {
    
    const user = context.req.user;

    return this.orderService.findByUserId(user.userId);
  }
}