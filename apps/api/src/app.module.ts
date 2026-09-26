import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/users/user.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { CreatorModule } from './modules/creators/creator.module.js';
import { FanModule } from './modules/fans/fan.module.js';
import { DepositModule } from './modules/deposits/deposit.module.js';
import { CreatorPayoutModule } from './modules/creator-payouts/creator-payout.module.js';
import { NotificationModule } from './modules/notifications/notification.module.js';
import { SearchModule } from './modules/search/search.module.js';

@Module({
  imports: [AuthModule, UserModule, WalletModule, CreatorModule, FanModule, DepositModule, CreatorPayoutModule, NotificationModule, SearchModule],
})
export class AppModule {}
