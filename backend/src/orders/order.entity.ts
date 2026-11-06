import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerName: string;

  @Column()
  productName: string;

  @Column('int')
  quantity: number;

  @Column('numeric', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', default: OrderStatus.PENDING })
  status: OrderStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
