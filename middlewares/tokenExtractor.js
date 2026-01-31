/*
* Pre-conditions: request has authorization header in 'Bearer <token>' format
* Post-conditions: request.token is set to the extracted token string, or undefined if not present
*/
const tokenExtractor = (request, response, next) => {
  // tokenin ekstraktoiva koodi
  const authorization = request.get('authorization')

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7)
  }

  next()
}

module.exports = tokenExtractor