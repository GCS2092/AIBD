import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EncryptionService } from './encryption.service';
import { EncryptionSubscriber } from './encryption.subscriber';

export const encryptionSubscriberProvider: Provider = {
  provide: 'ENCRYPTION_SUBSCRIBER',
  useFactory: (dataSource: DataSource, encryptionService: EncryptionService) => {
    const subscriber = new EncryptionSubscriber(dataSource);
    subscriber.setEncryptionService(encryptionService);
    return subscriber;
  },
  inject: [DataSource, EncryptionService],
};

