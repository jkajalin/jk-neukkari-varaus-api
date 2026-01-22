const request = require('supertest');
const express = require('express');
const createRoomRouter = require('../controllers/room-router');

describe('Room API - GET /api/rooms', () => {
    let app;
    let rooms;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        rooms = [];
        app.use('/api/rooms', createRoomRouter(rooms));
    });

    // Empty list
    test('Should return empty array when no rooms exist', async () => {
        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Single room
    test('Should return single room when one room exists', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0].name).toBe('Room A');
    });

    // Multiple rooms
    test('Should return multiple rooms with correct structure', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Conference Hall' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
        expect(response.body[0].name).toBe('Room A');
        expect(response.body[1].name).toBe('Room B');
        expect(response.body[2].name).toBe('Conference Hall');
    });

    // All rooms returned
    test('Should return all created rooms', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A 2' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
        expect(response.body.map(r => r.name)).toContain('Room A');
        expect(response.body.map(r => r.name)).toContain('Room A 2');
        expect(response.body.map(r => r.name)).toContain('Room B');
    });

    // JSON format
    test('Should return proper JSON format with correct headers', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Test Room' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.type).toMatch(/json/);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // Special characters in room names
    test('Should handle room names with special characters', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room-A_1.2' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Main Conference Room (Floor 2)' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe('Room-A_1.2');
        expect(response.body[1].name).toBe('Main Conference Room (Floor 2)');
    });

    // Deletion is reflected in list
    test('Should not include deleted rooms', async () => {
        const res1 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        // Delete Room A
        const roomId = res1.body.room.id;
        await request(app).delete(`/api/rooms/${roomId}`);

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Room B');
    });
});
