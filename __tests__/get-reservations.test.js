const request = require('supertest');
const express = require('express');
const createReservationRouter = require('../reservation-router');

describe('Reservation Router - GET /api/reservations/:room', () => {
    let app;
    let reservations;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        reservations = [];
        app.use('/api/reservations', createReservationRouter(reservations));
    });

    // Valid retrieval
    test('Should get all reservations for a specific room', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get('/api/reservations/Room A');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].room).toBe('Room A');
    });

    // Edge case: Empty room (no reservations)
    test('Should return empty array for room with no reservations', async () => {
        const response = await request(app)
            .get('/api/reservations/Room A');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Edge case: Multiple reservations for same room
    test('Should return all reservations for a room', async () => {
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
                room: 'Room A',
                startTime: futureStart1,
                endTime: futureEnd1
            });

        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart2,
                endTime: futureEnd2
            });

        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart3,
                endTime: futureEnd3
            });

        // Get reservations
        const response = await request(app)
            .get('/api/reservations/Room A');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
    });

    // Edge case: Separate reservations for different rooms
    test('Should only return reservations for the requested room', async () => {
        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        // Create reservation for Room A
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart1,
                endTime: futureEnd1
            });

        // Create reservation for Room B
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room B',
                startTime: futureStart2,
                endTime: futureEnd2
            });

        // Get reservations for Room A
        const response = await request(app)
            .get('/api/reservations/Room A');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].room).toBe('Room A');
    });

    // Edge case: Room name with special characters
    test('Should handle room names with special characters', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room-A_1.2',
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get('/api/reservations/Room-A_1.2');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].room).toBe('Room-A_1.2');
    });

    // Edge case: Case sensitivity
    test('Should be case-sensitive when filtering by room', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation for 'Room A'
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations for 'room a' (different case)
        const response = await request(app)
            .get('/api/reservations/room a');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(0);
    });

    // Edge case: Room name with spaces
    test('Should handle room names with spaces', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Main Conference Room',
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get('/api/reservations/Main Conference Room');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].room).toBe('Main Conference Room');
    });

    // Edge case: Retrieve after cancellation
    test('Should not return cancelled reservations', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        const createResponse = await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart,
                endTime: futureEnd
            });

        const reservationId = createResponse.body.reservation.id;

        // Cancel reservation
        await request(app)
            .delete(`/api/reservations/${reservationId}`);

        // Get reservations
        const response = await request(app)
            .get('/api/reservations/Room A');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(0);
    });

    // Edge case: Verify reservation contains all expected fields
    test('Should return reservations with all expected fields', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart,
                endTime: futureEnd
            });

        // Get reservations
        const response = await request(app)
            .get('/api/reservations/Room A');

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('room');
        expect(response.body[0]).toHaveProperty('startTime');
        expect(response.body[0]).toHaveProperty('endTime');
        expect(response.body[0]).toHaveProperty('id');
    });
});
