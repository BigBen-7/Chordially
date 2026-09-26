import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/users/user.module.js';
@Module({
  imports: [AuthModule, UserModule],
})
export class AppModule {}
