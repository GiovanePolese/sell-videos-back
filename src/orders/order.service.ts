import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async createOrder(data: Partial<Order>): Promise<Order> {
    return this.orderRepository.save(data);
  }

  async updateStatus(txid: string, status: string) {
    return this.orderRepository.update({ txid }, { status });
  }

  async findByTxid(txid: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { txid } });
    if (!order) {
      throw new NotFoundException(`Cobrança com txid '${txid}' não encontrada.`);
    }
    return order;
  }

  async findByUserId(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      relations: ['user'],
    });
  }
}