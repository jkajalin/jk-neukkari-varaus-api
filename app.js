const express = require('express');
const createReservationRouter = require('./controllers/reservation-router');
const createRoomRouter = require('./controllers/room-router');

const requestLogger = require('./middlewares/requestLogger')
const errorHandler  =  require('./middlewares/errorHandler')
const unknownEndpoint = require('./middlewares/unknownEndpoint')
const tokenExtractor = require ( './middlewares/tokenExtractor' );

const usersRouter = require( './controllers/user-router' );
const createLoginRouter = require('./controllers/login-router');

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(tokenExtractor);

// Disable 'X-Powered-By' header for security
app.disable('x-powered-by')

// Use the routers
app.use('/api/login', createLoginRouter());
app.use('/api/reservations', createReservationRouter());
app.use('/api/rooms', createRoomRouter());
app.use('/api/users', usersRouter());

if ( process.env.NODE_ENV === 'test' ) {

  const testingRouter = require('./controllers/test-router')
  app.use('/api/testing', testingRouter)
}

app.use( unknownEndpoint )
// tämä tulee kaikkien muiden middlewarejen rekisteröinnin jälkeen!
app.use( errorHandler )


module.exports = app