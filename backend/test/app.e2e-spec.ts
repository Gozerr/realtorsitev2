import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('memory');
        expect(res.body).toHaveProperty('version');
      });
  });

  it('/metrics (GET)', () => {
    return request(app.getHttpServer())
      .get('/metrics')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('system');
        expect(res.body).toHaveProperty('process');
        expect(res.body).toHaveProperty('app');
        expect(res.body.system).toHaveProperty('uptime');
        expect(res.body.system).toHaveProperty('memory');
        expect(res.body.system).toHaveProperty('cpu');
        expect(res.body.process).toHaveProperty('pid');
        expect(res.body.process).toHaveProperty('version');
        expect(res.body.process).toHaveProperty('platform');
        expect(res.body.process).toHaveProperty('arch');
        expect(res.body.app).toHaveProperty('version');
        expect(res.body.app).toHaveProperty('environment');
      });
  });
});

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/login (POST) - should fail with invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('/auth/login (POST) - should fail with missing credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(401);
  });
});

describe('Properties (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/properties/statistics (GET)', () => {
    return request(app.getHttpServer())
      .get('/properties/statistics')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('available');
        expect(res.body).toHaveProperty('sold');
        expect(res.body).toHaveProperty('reserved');
        expect(res.body).toHaveProperty('averagePrice');
      });
  });

  it('/properties/recent (GET)', () => {
    return request(app.getHttpServer())
      .get('/properties/recent')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/properties (GET) - should return paginated results', () => {
    return request(app.getHttpServer())
      .get('/properties?page=1&limit=10')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('properties');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('limit');
        expect(res.body).toHaveProperty('totalPages');
        expect(Array.isArray(res.body.properties)).toBe(true);
      });
  });
});

describe('Education (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/education (GET)', () => {
    return request(app.getHttpServer())
      .get('/education')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});

describe('Notifications (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/notifications (GET)', () => {
    return request(app.getHttpServer())
      .get('/notifications')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/notifications/user/1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/notifications/user/1')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
