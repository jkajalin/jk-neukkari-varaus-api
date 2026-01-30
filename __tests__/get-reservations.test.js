const supertest = require('supertest');
const app = require('../app');
const { users } = require('../models/user-model');
const { initialUsers } = require('./test_helper');
const { rooms, reservations } = require('../models/data-stores');

const api = supertest(app);

describe('Reservation Router - GET /api/reservations/:roomId', () => {
    let token;

    beforeEach(async () => {
        // Clear data stores
        users.length = 0;
        rooms.length = 0;
        reservations.length = 0;

        // Create initial user
        await api
            .post('/api/users')
            .send(initialUsers[0]);

        // Login to get token
        const loginRes = await api
            .post('/api/login')
            .send({ username: initialUsers[0].userName, password: initialUsers[0].password });
        token = loginRes.body.token;
    });

    // Helper function to create a room
    const createRoom = async (name) => {
        const response = await api
            .post('/api/rooms')
            .send({ name })
            .set({ Authorization: `bearer ${token}` });
        return response.body.room.id;
    };

    // Valid retrieval
    test('Should get all reservations for a specific room', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomId);
    });

    // Edge case: Empty room (no reservations)
    test('Should return empty array for room with no reservations', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Edge case: Multiple reservations for same room
    test('Should return all reservations for a room', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();
        const futureStart3 = new Date(Date.now() + 100800000).toISOString();
        const futureEnd3 = new Date(Date.now() + 104400000).toISOString();

        // Create three reservations for Room A
        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart3,
                endTime: futureEnd3
            });

        // Get reservations
        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
    });

    // Edge case: Separate reservations for different rooms
    test('Should only return reservations for the requested room', async () => {
        // Create two rooms
        const roomAId = await createRoom('Room A');
        const roomBId = await createRoom('Room B');

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        // Create reservation for Room A
        await api
            .post('/api/reservations')
            .send({
                roomId: roomAId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        // Create reservation for Room B
        await api
            .post('/api/reservations')
            .send({
                roomId: roomBId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        // Get reservations for Room A
        const response = await api
            .get(`/api/reservations/${roomAId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomAId);
    });

    // Edge case: Room name with special characters
    test('Should handle room names with special characters', async () => {
        // Create a room with special characters in name
        const roomId = await createRoom('Room-A_1.2');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomId);
    });

    // Edge case: Case sensitivity
    test('Should be case-sensitive when filtering by room', async () => {
        // Create a room
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation for 'Room A'
        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations using the correct roomId
        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);

        // Try with different roomId format (should not find anything)
        const wrongResponse = await api
            .get('/api/reservations/00000000-0000-0000-0000-000000000000');

        expect(wrongResponse.status).toBe(200);
        expect(wrongResponse.body.length).toBe(0);
    });

    // Edge case: Room name with spaces
    test('Should handle room names with spaces', async () => {
        // Create a room with spaces in name
        const roomId = await createRoom('Main Conference Room');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomId);
    });

    // Edge case: Retrieve after cancellation
    test('Should not return cancelled reservations', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        const createResponse = await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        const reservationId = createResponse.body.reservation.id;

        // Cancel reservation
        await api
            .delete(`/api/reservations/${reservationId}`);

        // Get reservations
        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(0);
    });

    // Edge case: Verify reservation contains all expected fields
    test('Should return reservations with all expected fields', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await api
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await api
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('roomId');
        expect(response.body[0]).toHaveProperty('startTime');
        expect(response.body[0]).toHaveProperty('endTime');
        expect(response.body[0]).toHaveProperty('id');
    });
});
