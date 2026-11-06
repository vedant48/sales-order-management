import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseService } from './firebase.service';
import { DeviceToken } from '../devices/device-token.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken])],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
