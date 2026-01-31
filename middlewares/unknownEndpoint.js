/*
* Pre-conditions: No route matched the request
* Post-conditions: Response sent with 404 status and error message
*/
const unknownEndpoint = (request, response, next) => {
  response.status(404).send({ error: 'unknown endpoint' })
  next()
}

module.exports = unknownEndpoint