import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './orders/orders.module';
import { DevicesModule } from './devices/devices.module';
import { FirebaseModule } from './firebase/firebase.module';
import { Order } from './orders/order.entity';
import { DeviceToken } from './devices/device-token.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sales_orders',
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities: [Order, DeviceToken],
      synchronize: true,
    }),
    FirebaseModule,
    OrdersModule,
    DevicesModule,
  ],
})
export class AppModule {}
