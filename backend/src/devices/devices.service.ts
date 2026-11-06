import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from './device-token.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly devices: Repository<DeviceToken>,
  ) {}

  async register(token: string): Promise<DeviceToken> {
    const existing = await this.devices.findOne({ where: { token } });
    if (existing) {
      existing.updatedAt = new Date();
      return this.devices.save(existing);
    }
    return this.devices.save(this.devices.create({ token }));
  }

  async findAllTokens(): Promise<string[]> {
    const rows = await this.devices.find();
    return rows.map((r) => r.token);
  }

  async removeByToken(token: string): Promise<void> {
    await this.devices.delete({ token });
  }
}
