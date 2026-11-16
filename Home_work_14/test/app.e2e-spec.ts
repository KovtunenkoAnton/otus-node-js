import './e2e-env.js'; // должен идти первым: переопределяет DB_NAME до загрузки AppModule
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { hash } from 'bcryptjs';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/db/Entities/User.entity.js';
import { ETaskStatus, EUserStatus, EUserRole } from '../src/constants.js';

const DB_NAME = 'home_work_14_e2e';
const AUTHOR_EMAIL = 'author@example.com';
const AUTHOR_PASSWORD = 'author-pass-123';

async function ensureDatabase(): Promise<void> {
  const admin = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '1234567',
    database: 'postgres',
  });

  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
  } catch (error) {
    if ((error as { code?: string }).code !== '42P04') {
      throw error;
    }
  } finally {
    await admin.end();
  }
}

describe('Tasks CRUD (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    await ensureDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('HOME_WORK_14')
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    const rows = await dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    const tables = rows.map(({ tablename }) => `"${tablename}"`).join(', ');
    await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);

    const usersRepository = dataSource.getRepository(User);
    await usersRepository.save(
      usersRepository.create({
        name: 'Test Author',
        email: AUTHOR_EMAIL,
        passwordHash: await hash(AUTHOR_PASSWORD, 10),
        role: EUserRole.Author,
        status: EUserStatus.Active,
      }),
    );

    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: AUTHOR_EMAIL, password: AUTHOR_PASSWORD });
    expect(signin.status).toBe(201);
    token = signin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const createTask = () =>
    request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task title', content: 'Task content', status: ETaskStatus.Draft });

  const getTask = (id: number) =>
    request(app.getHttpServer())
      .get(`/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

  it('POST /tasks — создание задачи', async () => {
    const res = await createTask();

    expect(res.status).toBe(201);
    expect(res.body.id).toEqual(expect.any(Number));
    expect(res.body.title).toBe('Task title');
    expect(res.body.content).toBe('Task content');
    expect(res.body.status).toBe(ETaskStatus.Draft);
    expect(res.body.author.email).toBe(AUTHOR_EMAIL);
  });

  it('GET /tasks — список и GET /tasks/:id — отдельная задача', async () => {
    const created = (await createTask()).body;

    const list = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(created.id);

    const single = await getTask(created.id);
    expect(single.status).toBe(200);
    expect(single.body.id).toBe(created.id);
    expect(single.body.title).toBe('Task title');
    expect(single.body.author.email).toBe(AUTHOR_EMAIL);
  });

  it('PUT /tasks/:id — обновление поля', async () => {
    const created = (await createTask()).body;

    const res = await request(app.getHttpServer())
      .put(`/tasks/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: ETaskStatus.Published });
    expect(res.status).toBe(200);

    const single = await getTask(created.id);
    expect(single.body.status).toBe(ETaskStatus.Published);
    expect(single.body.title).toBe('Task title'); // остальные поля не тронуты
  });

  it('DELETE /tasks/:id — удаление, затем GET → 404', async () => {
    const created = (await createTask()).body;

    const del = await request(app.getHttpServer())
      .delete(`/tasks/${created.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const after = await getTask(created.id);
    expect(after.status).toBe(404);
  });
});
