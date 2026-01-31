const app = require('./app') // Express-sovellus
const http = require('http')
const config = require('./utils/config');

// Check start conditions
if (!process.env.SECRET) {
  console.error('SECRET environment variable is required');
  process.exit(1);
}

const server = http.createServer(app)

server.listen( config.API_PORT, () => {
  console.log( `Server running on port ${config.API_PORT}` )
})

// ### end of server.js ###