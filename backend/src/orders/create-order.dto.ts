import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderStatus } from './order.entity';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  productName: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsIn(Object.values(OrderStatus))
  status?: OrderStatus;
}
