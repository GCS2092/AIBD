import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { EncryptionInterceptor } from './encryption.interceptor';

@Global()
@Module({
  providers: [EncryptionService, EncryptionInterceptor],
  exports: [EncryptionService, EncryptionInterceptor],
})
export class EncryptionModule {}

