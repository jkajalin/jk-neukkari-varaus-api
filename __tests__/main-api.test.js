// Simplified main-api.test.js for context

const supertest = require('supertest');
const app = require('../app');
const { users } = require('../models/user-model');
const { initialUser } = require('./test_helper');

const api = supertest(app);

describe('Simplified main API tests', () => {
  
  test('Create first user', async () => {
    await api
      .post('/api/users')
      .send(initialUser[0])
      .expect(201)
      .expect('Content-Type', /application\/json/);
    
    const usersAtEnd = users;
    expect(usersAtEnd).toHaveLength(1);
    expect(usersAtEnd[0].userName).toBe(initialUser[0].userName);
  });

});

