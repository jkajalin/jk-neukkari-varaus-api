const supertest = require('supertest');
const app = require('../app');
const { users } = require('../models/user-model');
const { initialUsers } = require('./test_helper');
const { rooms, reservations } = require('../models/data-stores');

const api = supertest(app);

describe('Reservation Router - POST /api/reservations', () => {
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

    // Valid reservation creation
    test('Should create a reservation successfully', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString(); // +1 day
        const futureEnd = new Date(Date.now() + 90000000).toISOString(); // +1 day + 1 hour

        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Reservation created successfully.');
        expect(response.body.reservation).toBeDefined();
        expect(response.body.reservation.roomId).toBe(roomId);
    });

    // Edge case: Missing required fields
    test('Should return error when room ID is missing', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        const response = await api
            .post('/api/reservations')
            .send({
                startTime: futureStart,
                endTime: futureEnd
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Room ID');
    });

    // Edge case: Non-existent room
    test('Should return error when room does not exist', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        const response = await api
            .post('/api/reservations')
            .send({
                roomId: 'nonexistent-room-id',
                startTime: futureStart,
                endTime: futureEnd
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Room not found.');
    });

    test('Should return error when startTime is missing', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                endTime: futureEnd
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
    });

    test('Should return error when endTime is missing', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();

        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
    });

    // Edge case: Start time equals end time
    test('Should return error when start time equals end time', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();

        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart,
                endTime: futureStart
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Start time must be before end time.');
    });

    // Edge case: Start time after end time
    test('Should return error when start time is after end time', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 3600000).toISOString();

        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Start time must be before end time.');
    });

    // Edge case: Reservation in the past
    test('Should return error when reservation is in the past', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const pastStart = new Date(Date.now() - 86400000).toISOString(); // -1 day
        const pastEnd = new Date(Date.now() - 82800000).toISOString(); // -1 day + 1 hour

        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: pastStart,
                endTime: pastEnd
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Reservation cannot be in the past.');
    });

    // Edge case: Overlapping reservations
    test('Should return error when room is already reserved', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 87300000).toISOString(); // Within first reservation
        const futureEnd2 = new Date(Date.now() + 91800000).toISOString();

        // Create first reservation
        await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        // Try to create overlapping reservation
        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Room is already reserved for this time.');
    });

    // Edge case: Same room different times (should work)
    test('Should allow reservations in same room at different times', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString(); // After first reservation
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        // Create first reservation
        await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        // Create second reservation in same room, different time
        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        expect(response.status).toBe(201);
    });

    // Edge case: Different room same time (should work)
    test('Should allow different rooms to be reserved at the same time', async () => {
        // Create two rooms first
        const roomId1 = await createRoom('Room A');
        const roomId2 = await createRoom('Room B');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation for Room A
        await api
            .post('/api/reservations')
            .send({
                roomId: roomId1,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Create reservation for Room B at the same time
        const response = await api
            .post('/api/reservations')
            .send({
                roomId: roomId2,
                startTime: futureStart,
                endTime: futureEnd
            });

        expect(response.status).toBe(201);
    });

    // Edge case: Exact overlap (start time = end time of existing reservation)
    test('Should allow reservation that starts exactly when another ends', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = futureEnd1; // Starts exactly when first ends
        const futureEnd2 = new Date(Date.now() + 93600000).toISOString();

        // Create first reservation
        await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        // Create second reservation starting exactly when first ends
        const response = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        expect(response.status).toBe(201);
    });
});
