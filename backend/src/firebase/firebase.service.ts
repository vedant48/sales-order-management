import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { Order } from '../orders/order.entity';
import { DeviceToken } from '../devices/device-token.entity';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private enabled = false;

  constructor(
    @InjectRepository(DeviceToken)
    private readonly devices: Repository<DeviceToken>,
  ) {}

  onModuleInit() {
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      this.logger.warn(
        'Firebase credentials not set - notifications disabled. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
      );
      return;
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      this.enabled = true;
      this.logger.log('Firebase Admin initialised - notifications enabled.');
    } catch (err) {
      this.logger.error(`Firebase Admin init failed: ${err?.message}`);
    }
  }

  async notifyOrderCreated(order: Order): Promise<void> {
    if (!this.enabled) return;
    const rows = await this.devices.find();
    const tokens = rows.map((r) => r.token);
    if (tokens.length === 0) {
      this.logger.log('No registered device tokens - skipping notification.');
      return;
    }
    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'New order created',
        body: `Order for ${order.customerName} - ${order.productName} x${order.quantity}`,
      },
      data: {
        type: 'ORDER_CREATED',
        orderId: order.id,
      },
      webpush: {
        fcmOptions: { link: process.env.FRONTEND_URL || undefined },
      },
    });
    // Prune tokens that FCM reports as no longer valid.
    const stale: string[] = [];
    res.responses.forEach((r, i) => {
      const code = r.error?.code || '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        stale.push(tokens[i]);
      }
    });
    if (stale.length) {
      await this.devices.delete(stale);
      this.logger.log(`Removed ${stale.length} stale device token(s).`);
    }
    this.logger.log(`FCM sent: ${res.successCount} ok, ${res.failureCount} failed.`);
  }
}
