import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateOrderDto } from './create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const order = this.orders.create(dto);
    return this.orders.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orders.find({ order: { createdAt: 'DESC' } });
  }
}
