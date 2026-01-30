const supertest = require('supertest');
const app = require('../app');
const { users } = require('../models/user-model');
const { initialUsers } = require('./test_helper');
const { rooms, reservations } = require('../models/data-stores');

const api = supertest(app);

describe('Reservation Router - DELETE /api/reservations', () => {
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

    // Valid cancellation by ID (path parameter)
    test('Should cancel a reservation by ID successfully', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation
        const createResponse = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        const reservationId = createResponse.body.reservation.id;

        // Cancel reservation by ID
        const response = await api
            .delete(`/api/reservations/${reservationId}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Reservation cancelled successfully.');
        expect(reservations.length).toBe(0);
    });

    // Edge case: Cancelling non-existent reservation
    test('Should return error when reservation ID does not exist', async () => {
        const response = await api
            .delete('/api/reservations/nonexistent-id');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Reservation not found.');
    });

    // Edge case: Cancel specific reservation when multiple exist
    test('Should cancel only the specified reservation', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        // Create two reservations for Room A
        const res1 = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        const res2 = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        const id1 = res1.body.reservation.id;

        // Cancel first reservation
        const response = await api
            .delete(`/api/reservations/${id1}`);

        expect(response.status).toBe(200);
        expect(reservations.length).toBe(1);
        expect(reservations[0].startTime).toBe(futureStart2);
    });

    // Edge case: Cancel reservation from different room
    test('Should not cancel reservation if ID does not match', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 90000000).toISOString();

        // Create reservation for Room A
        await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart,
                endTime: futureEnd
            });

        // Try to cancel with wrong ID
        const response = await api
            .delete('/api/reservations/wrong-id');

        expect(response.status).toBe(404);
        expect(reservations.length).toBe(1);
    });

    // Edge case: Multiple cancellations
    test('Should successfully cancel multiple reservations', async () => {
        // Create a room first
        const roomId = await createRoom('Room A');

        const futureStart1 = new Date(Date.now() + 86400000).toISOString();
        const futureEnd1 = new Date(Date.now() + 90000000).toISOString();
        const futureStart2 = new Date(Date.now() + 93600000).toISOString();
        const futureEnd2 = new Date(Date.now() + 97200000).toISOString();

        // Create two reservations
        const res1 = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart1,
                endTime: futureEnd1
            });

        const res2 = await api
            .post('/api/reservations')
            .send({
                roomId,
                startTime: futureStart2,
                endTime: futureEnd2
            });

        const id1 = res1.body.reservation.id;
        const id2 = res2.body.reservation.id;

        // Cancel both
        await api
            .delete(`/api/reservations/${id1}`);

        const response = await api
            .delete(`/api/reservations/${id2}`);

        expect(response.status).toBe(200);
        expect(reservations.length).toBe(0);
    });
});
