const requestLogger = (request, response, next) => {

  if (process.env.NODE_ENV !== 'test'){

    console.log('---')
    console.log('Method:', request.method)
    console.log('Path:  ', request.path)

    if( process.env.NODE_ENV !== 'production' ){
      console.log('Body:  ', request.body)
    }
    console.log('---')
  }

  next()
}

module.exports = requestLogger