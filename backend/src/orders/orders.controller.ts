import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';
import { Order } from './order.entity';
import { FirebaseService } from '../firebase/firebase.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    const order = await this.ordersService.create(dto);
    // Notify connected devices; a notification failure must not fail order creation.
    this.firebaseService
      .notifyOrderCreated(order)
      .catch((err) => console.error('FCM notification failed:', err?.message));
    return order;
  }

  @Get()
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }
}
