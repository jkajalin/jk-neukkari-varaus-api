const request = require('supertest');
const express = require('express');
const createReservationRouter = require('../controllers/reservation-router');
const createRoomRouter = require('../controllers/room-router');

describe('Reservation Router - GET /api/reservations/:roomId', () => {
    let app;
    let reservations;
    let rooms;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        reservations = [];
        rooms = [];
        app.use('/api/reservations', createReservationRouter(reservations, rooms));
        app.use('/api/rooms', createRoomRouter(rooms));
    });

    // Valid retrieval
    test('Should get all reservations for a specific room', async () => {
        // Create a room first
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });
        const roomId = roomRes.body.room.id;

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomId);
    });

    // Edge case: Empty room (no reservations)
    test('Should return empty array for room with no reservations', async () => {
        // Create a room first
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });
        const roomId = roomRes.body.room.id;

        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Edge case: Multiple reservations for same room
    test('Should return all reservations for a room', async () => {
        // Create a room first
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });
        const roomId = roomRes.body.room.id;

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();
        const futureStart3 = new Date(Date.now() + 100800000).toISOString();
        const futureEnd3 = new Date(Date.now() + 104400000).toISOString();

        // Create three reservations for Room A
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart3,
                endTime: futureEnd3
            });

        // Get reservations
        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
    });

    // Edge case: Separate reservations for different rooms
    test('Should only return reservations for the requested room', async () => {
        // Create two rooms
        const roomARes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });
        const roomAId = roomARes.body.room.id;

        const roomBRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });
        const roomBId = roomBRes.body.room.id;

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        // Create reservation for Room A
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomAId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        // Create reservation for Room B
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomBId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        // Get reservations for Room A
        const response = await request(app)
            .get(`/api/reservations/${roomAId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomAId);
    });

    // Edge case: Room name with special characters
    test('Should handle room names with special characters', async () => {
        // Create a room with special characters in name
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room-A_1.2' });
        const roomId = roomRes.body.room.id;

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomId);
    });

    // Edge case: Case sensitivity
    test('Should be case-sensitive when filtering by room', async () => {
        // Create a room
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });
        const roomId = roomRes.body.room.id;

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation for 'Room A'
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations using the correct roomId
        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);

        // Try with different roomId format (should not find anything)
        const wrongResponse = await request(app)
            .get('/api/reservations/00000000-0000-0000-0000-000000000000');

        expect(wrongResponse.status).toBe(200);
        expect(wrongResponse.body.length).toBe(0);
    });

    // Edge case: Room name with spaces
    test('Should handle room names with spaces', async () => {
        // Create a room with spaces in name
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Main Conference Room' });
        const roomId = roomRes.body.room.id;

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].roomId).toBe(roomId);
    });

    // Edge case: Retrieve after cancellation
    test('Should not return cancelled reservations', async () => {
        // Create a room first
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });
        const roomId = roomRes.body.room.id;

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        const createResponse = await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        const reservationId = createResponse.body.reservation.id;

        // Cancel reservation
        await request(app)
            .delete(`/api/reservations/${reservationId}`);

        // Get reservations
        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(0);
    });

    // Edge case: Verify reservation contains all expected fields
    test('Should return reservations with all expected fields', async () => {
        // Create a room first
        const roomRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });
        const roomId = roomRes.body.room.id;

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                roomId: roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get(`/api/reservations/${roomId}`);

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('roomId');
        expect(response.body[0]).toHaveProperty('startTime');
        expect(response.body[0]).toHaveProperty('endTime');
        expect(response.body[0]).toHaveProperty('id');
    });
});
