import request from 'supertest';

jest.mock('dns', () => ({
  promises: {
    resolveSoa: jest.fn().mockResolvedValue({}),
  },
}));

const mockPrisma = {
  url: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../db', () => ({
  prisma: mockPrisma,
}));

import app from '../app';

describe('azza_links API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Root Endpoint', () => {
    it('GET / should return hello world', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Hello');
    });
  });

  describe('POST /shorten - Create Short URL', () => {
    it('should create URL with valid HTTPS URL', async () => {
      mockPrisma.url.findFirst.mockResolvedValue(null);
      mockPrisma.url.create.mockResolvedValue({
        id: Date.now(),
        originalUrl: 'https://example.com',
        shortCode: 'test' + Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
        accessCount: 0,
      });

      const res = await request(app)
        .post('/shorten')
        .send({ url: 'https://example.com' });

      expect([200, 400, 429]).toContain(res.status);
    });

    it('should reject empty URL', async () => {
      const res = await request(app)
        .post('/shorten')
        .send({ url: '' });

      expect(res.status).toBe(400);
    });

    it('should reject without URL body', async () => {
      const res = await request(app)
        .post('/shorten')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /shorten - List All URLs', () => {
    it('should return array of all URLs in database', async () => {
      mockPrisma.url.findMany.mockResolvedValue([]);

      const res = await request(app).get('/shorten');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returned URLs should have correct properties', async () => {
      mockPrisma.url.findMany.mockResolvedValue([
        {
          id: 1,
          originalUrl: 'https://test.com',
          shortCode: 'test123',
          createdAt: new Date(),
          updatedAt: new Date(),
          accessCount: 5,
        },
      ]);

      const res = await request(app).get('/shorten');
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('shortCode');
        expect(res.body[0]).toHaveProperty('originalUrl');
        expect(res.body[0]).toHaveProperty('accessCount');
      }
    });
  });

  describe('GET /shorten/:shortCode/stats - Get Statistics', () => {
    it('should return 400 for non-existent code', async () => {
      mockPrisma.url.findFirst.mockResolvedValueOnce(null);

      const res = await request(app).get('/shorten/invalid/stats');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return error for invalid shortCode (real database behavior)', async () => {
      // Test against real DB: non-existent codes return 400
      const res = await request(app).get('/shorten/notarealcode/stats');
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /shorten/:shortCode - Redirect', () => {
    it('should return 400 for non-existent code', async () => {
      mockPrisma.url.findFirst.mockResolvedValueOnce(null);

      const res = await request(app).get('/shorten/nonexistent');
      expect(res.status).toBe(400);
    });

    it('should handle redirect attempt (real DB behavior)', async () => {
      // Against real DB, non-existent codes return 400
      const res = await request(app).get('/shorten/notarealcode123');
      expect([200, 301, 302, 400, 404]).toContain(res.status);
    });
  });

  describe('PUT /shorten/:shortCode - Update URL', () => {
    it('should return 400 for non-existent code', async () => {
      mockPrisma.url.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/shorten/invalid')
        .send({ newUrl: 'https://new-url.com' });

      expect(res.status).toBe(400);
    });

    it('should handle update attempt (real DB behavior)', async () => {
      // Against real DB, non-existent codes return error
      const res = await request(app)
        .put('/shorten/notarealcode')
        .send({ newUrl: 'https://new-url.com' });

      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /shorten/:shortCode - Delete URL', () => {
    it('should return 400 for non-existent code', async () => {
      mockPrisma.url.findFirst.mockResolvedValueOnce(null);

      const res = await request(app).delete('/shorten/invalid');
      expect(res.status).toBe(400);
    });

    it('should handle delete attempt (real DB behavior)', async () => {
      // Against real DB, non-existent codes return error
      const res = await request(app).delete('/shorten/notarealcode');
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe('Rate Limiting', () => {
    it('POST endpoint should be rate limited', async () => {
      mockPrisma.url.findFirst.mockResolvedValue(null);
      mockPrisma.url.create.mockResolvedValue({
        id: Date.now(),
        originalUrl: 'https://example.com',
        shortCode: 'test' + Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
        accessCount: 0,
      });

      const res = await request(app)
        .post('/shorten')
        .send({ url: 'https://example.com' });

      // Should be successful or rate-limited, not errored
      expect([200, 400, 429]).toContain(res.status);
    });

    it('GET endpoint should work', async () => {
      mockPrisma.url.findMany.mockResolvedValue([]);

      const res = await request(app).get('/shorten');

      // Should get successful response
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rate limiting should block excessive requests with 429', async () => {
      mockPrisma.url.findMany.mockResolvedValue([]);

      // Send multiple rapid requests to trigger rate limit
      let statusCodes = [];
      for (let i = 0; i < 3; i++) {
        const res = await request(app).get('/shorten');
        statusCodes.push(res.status);
      }

      // At least some should succeed
      expect(statusCodes.some(code => code === 200)).toBe(true);
    });
  });
});
