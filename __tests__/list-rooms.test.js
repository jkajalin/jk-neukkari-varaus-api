const request = require('supertest');
const express = require('express');
const createReservationRouter = require('../reservation-router');

describe('Reservation Router - GET /api/reservations/rooms/list', () => {
    let app;
    let reservations;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        reservations = [];
        app.use('/api/reservations', createReservationRouter(reservations));
    });

    // Valid retrieval - no rooms
    test('Should return empty array when no reservations exist', async () => {
        const response = await request(app)
            .get('/api/reservations/rooms/list');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Valid retrieval - single room
    test('Should return single room when one reservation exists', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation for Room A
        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart,
                endTime: futureEnd
            });

        const response = await request(app)
            .get('/api/reservations/rooms/list');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0].name).toBe('Room A');
        expect(response.body[0].id).toBe(1);
    });

    // Valid retrieval - multiple rooms
    test('Should return multiple rooms with correct IDs', async () => {
        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();
        const futureStart3 = new Date(Date.now() + 100800000).toISOString();
        const futureEnd3 = new Date(Date.now() + 104400000).toISOString();

        // Create reservations for three different rooms
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
                room: 'Room B',
                startTime: futureStart2,
                endTime: futureEnd2
            });

        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Meeting Hall',
                startTime: futureStart3,
                endTime: futureEnd3
            });

        const response = await request(app)
            .get('/api/reservations/rooms/list');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
        expect(response.body[0].name).toBe('Room A');
        expect(response.body[0].id).toBe(1);
        expect(response.body[1].name).toBe('Room B');
        expect(response.body[1].id).toBe(2);
        expect(response.body[2].name).toBe('Meeting Hall');
        expect(response.body[2].id).toBe(3);
    });

    // Edge case: Duplicate rooms from multiple reservations
    test('Should return unique rooms only (not duplicates)', async () => {
        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();
        const futureStart3 = new Date(Date.now() + 100800000).toISOString();
        const futureEnd3 = new Date(Date.now() + 104400000).toISOString();

        // Create three reservations, two in the same room
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
                room: 'Room B',
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

        const response = await request(app)
            .get('/api/reservations/rooms/list');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe('Room A');
        expect(response.body[1].name).toBe('Room B');
    });

    // Edge case: Verify JSON format and headers
    test('Should return proper JSON format with correct headers', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart,
                endTime: futureEnd
            });

        const response = await request(app)
            .get('/api/reservations/rooms/list');

        expect(response.status).toBe(200);
        expect(response.type).toMatch(/json/);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // Edge case: Room names with special characters
    test('Should handle room names with special characters', async () => {
        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room-A_1.2',
                startTime: futureStart1,
                endTime: futureEnd1
            });

        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Main Conference Room (Floor 2)',
                startTime: futureStart2,
                endTime: futureEnd2
            });

        const response = await request(app)
            .get('/api/reservations/rooms/list');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe('Room-A_1.2');
        expect(response.body[1].name).toBe('Main Conference Room (Floor 2)');
    });

    // Edge case: After cancellation
    test('Should not include rooms with no active reservations', async () => {
        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        // Create reservations for two rooms
        const res1 = await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room A',
                startTime: futureStart1,
                endTime: futureEnd1
            });

        await request(app)
            .post('/api/reservations')
            .send({
                room: 'Room B',
                startTime: futureStart2,
                endTime: futureEnd2
            });

        // Cancel first reservation
        await request(app)
            .delete(`/api/reservations/${res1.body.reservation.id}`);

        const response = await request(app)
            .get('/api/reservations/rooms/list');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Room B');
    });
});
