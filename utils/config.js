require('dotenv').config();

const API_PORT = process.env.API_PORT? process.env.API_PORT : 3001

module.exports = { API_PORT }
