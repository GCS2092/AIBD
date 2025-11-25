import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Ride } from './entities/ride.entity';
import { Pricing } from './entities/pricing.entity';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn().mockResolvedValue(0),
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: {
            count: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(Ride),
          useValue: {
            count: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(Pricing),
          useValue: {
            count: jest.fn().mockResolvedValue(0),
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API message', () => {
      expect(appController.getHello()).toContain('AIBD');
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await appController.healthCheck();
      expect(result).toBeDefined();
      expect(result).toEqual(
        expect.objectContaining({
          status: expect.any(String),
          timestamp: expect.any(String),
          uptime: expect.any(Number),
        }),
      );
      expect(result.status).toBe('ok');
    });
  });
});
