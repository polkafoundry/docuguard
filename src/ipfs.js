const http = require('http')

const tempHttpServer = http.createServer()
tempHttpServer.on("request", async (req, res) => {

  console.log('IPFS here')

  // read the data
  const length = Number(req.headers['content-length'])
  if (!length) {
    // it is an invalid request
    res.writeHead(400) // bad request
    res.end()
    return
  }

  const body = Buffer.alloc(length)
  let startIndex = 0
  console.log('IPFS received headers: ', req.headers)
  req.on('data', chunk => {
    chunk.copy(body, startIndex)
    startIndex += chunk.length
  });
  req.on('end', () => {
    console.log('IPFS received body: ', body)
    res.writeHead(200)
    res.write(Buffer.from('ok from ipfs'))
    res.end()
  })
})
tempHttpServer.listen(5001)