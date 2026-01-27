const errorHandler = ( error, request, response, next ) => {

  if (process.env.NODE_ENV !== 'test'){
    console.error(error.message)
  }

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'Malformatted id' })
  }
  else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({
      error: 'Invalid session token'
    })
  }
  else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'Session token expired - Try to login again'
    })
  }  

  return next(error)
}

module.exports = errorHandler