import { Body, Controller, Post } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './register-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(@Body() dto: RegisterDeviceDto) {
    await this.devicesService.register(dto.token);
    return { registered: true };
  }
}
