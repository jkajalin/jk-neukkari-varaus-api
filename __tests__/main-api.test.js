// Simplified main-api.test.js for context

const supertest = require('supertest');
const app = require('../app');
const { users } = require('../models/user-model');
const { initialUsers } = require('./test_helper');
const { rooms, reservations } = require('../models/data-stores');

const testuser00 = { username: initialUsers[0].userName, password: initialUsers[0].password }
let testuser00Token = 'empty baerer';
const testuser01 = { username: initialUsers[1].userName, password: initialUsers[1].password }
let testuser01Token = 'empty baerer';

const api = supertest(app);

describe('Simplified main API tests', () => {

  describe('Testing with testuser', () => {

    test('Create first user', async () => {
      await api
        .post('/api/users')
        .send(initialUsers[0])
        .expect(201)
        .expect('Content-Type', /application\/json/);

      const usersAtEnd = users;
      expect(usersAtEnd).toHaveLength(1);
      expect(usersAtEnd[0].userName).toBe(initialUsers[0].userName);
    });

    test('A aspesific initial user is listed', async () => {

      const response = await api.get('/api/users');

      const contents = response.body.map(u => u.userName);
      expect(contents).toContain('admin');

    });

    // Login and create second user // depends on first user created above
    describe('Login and create second user', () => {

      test('Login is successful and token is placed', async () => {

        const loginresult00 = await api
          .post('/api/login')
          .send(testuser00)
          .expect(200)
          .expect('Content-Type', /application\/json/);

        //console.log('Login result for testuser00:', loginresult00.body); // Debug log
        testuser00Token = loginresult00.body.token;
        //console.log('Token for testuser00:', testuser00Token); // Debug log

        expect(loginresult00.body.token).toBeDefined;
      });

      test('Init second user, with logged in user', async () => {
        await api
          .post('/api/users')
          .send(initialUsers[1])
          .set({ Authorization: `bearer ${testuser00Token}` })
          .expect(201)
          .expect('Content-Type', /application\/json/)
      });

      test('Second user is listed', async () => {

        const response = await api.get('/api/users');

        const contents = response.body.map(u => u.userName);
        expect(contents).toContain('jkajalin');

      });
      
      test('create a room with logged in user', async () => {

        const newRoom = { "name": "Conference Hall" };

        await api
          .post('/api/rooms')
          .send(newRoom)
          .set({ Authorization: `bearer ${testuser00Token}` })
          .expect(201)
          .expect('Content-Type', /application\/json/);

        roomsAtEnd = rooms;
        expect(roomsAtEnd).toHaveLength(1);
        expect(roomsAtEnd[0].name).toBe(newRoom.name);
          
      });

      // get all rooms, so far
      test('Get all rooms', async () => {
        
        const response = await api.get('/api/rooms');
        expect(response.body).toHaveLength(1);
      });

      // create a reservation - should be possible without authentication // depending on room created previously
      test('create a reservation', async () => {
        
        // note: rooms seems to contain rooms with id parameter not roomId
        const newReservation = { 
          "roomId": rooms[0].id,
          "startTime": "2026-07-01T10:00:00Z",
          "endTime": "2026-07-01T11:00:00Z"
        }; 

        await api
          .post('/api/reservations')
          .send(newReservation)          
          .expect(201)
          .expect('Content-Type', /application\/json/);

        const reservationsAtEnd = reservations; // kinda direct access to data store // unnesessary const creation
        expect(reservationsAtEnd).toHaveLength(1);
        expect(reservationsAtEnd[0].roomId).toBe(newReservation.roomId);

      });

    });

  });

});

