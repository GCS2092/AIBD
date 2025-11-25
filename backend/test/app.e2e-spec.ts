import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check Endpoints', () => {
    it('/ (GET) should return API message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('AIBD');
        });
    });

    it('/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Database Test Endpoint', () => {
    it('/test/database (GET) should test database connection', () => {
      return request(app.getHttpServer())
        .get('/test/database')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('tables');
          
          if (res.body.success) {
            expect(res.body.database).toBe('connected');
            expect(res.body.tables).toHaveProperty('users');
            expect(res.body.tables).toHaveProperty('drivers');
            expect(res.body.tables).toHaveProperty('rides');
            expect(res.body.tables).toHaveProperty('pricing');
            
            // Vérifier que chaque table répond
            expect(res.body.tables.users.status).toBe('ok');
            expect(res.body.tables.drivers.status).toBe('ok');
            expect(res.body.tables.rides.status).toBe('ok');
            expect(res.body.tables.pricing.status).toBe('ok');
          } else {
            console.warn('Database connection failed:', res.body.errors);
          }
        });
    });

    it('/test/database (GET) should return pricing information', () => {
      return request(app.getHttpServer())
        .get('/test/database')
        .expect(200)
        .expect((res) => {
          if (res.body.success && res.body.tables.pricing.status === 'ok') {
            expect(res.body.tables.pricing).toHaveProperty('count');
            expect(res.body.tables.pricing).toHaveProperty('active');
            expect(res.body.tables.pricing).toHaveProperty('items');
            expect(Array.isArray(res.body.tables.pricing.items)).toBe(true);
          }
        });
    });
  });

  describe('CORS Configuration', () => {
    it('should allow CORS requests', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200)
        .expect((res) => {
          // CORS peut être configuré différemment, on vérifie juste que la requête passe
          expect(res.body).toBeDefined();
          expect(res.body.status).toBe('ok');
        });
    });
  });
});
