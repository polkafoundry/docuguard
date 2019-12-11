require("dotenv").config();
const http = require("http"),
  formidable = require('formidable'),
  { PassThrough } = require('stream')

const isAuthorized = (body, headers) => {
  return true
}

const httpServer = http.createServer();
httpServer.on("request", async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("access-control-allow-origin", "*")
    res.setHeader("access-control-allow-credentials", "true")
    res.setHeader("access-control-allow-methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("access-control-allow-headers", "Authorization")
    res.setHeader("access-control-max-age", 86400)
    res.setHeader("Content-Type", "text/plain charset=UTF-8")
    res.setHeader("Content-Type", 0)
    res.writeHead(204) // no content
    res.end()
  } else {

    const length = Number(req.headers['content-length'])
    if (!length) {
      // it is an invalid request
      res.writeHead(400) // bad request
      res.end()
      return
    }

    const memStream = new PassThrough()
    req.pipe(memStream)

    const form = new formidable.IncomingForm()
    const formData = []
    form.onPart = part => {
      let buf = Buffer.alloc(length)
      let startIndex = 0

      part.on('data', chunk => {
        chunk.copy(buf, startIndex)
        startIndex += chunk.length
      })
      part.on('end', () => {
        formData.push(buf.slice(0, startIndex))
        buf = Buffer.alloc(length)
        startIndex = 0
      })
    }

    form.parse(req, function (err) {

      if (err) {
        res.writeHead(400) // bad request
        res.end()
        return
      }

      if (isAuthorized(formData, res.headers)) {
        const proxyReq = http.request(process.env.IPFS_HOST + req.url, {
          method: req.method,
          headers: { ...req.headers, 'content-length': length }
        }, ipfsRes => {
          Object.entries(ipfsRes.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
          res.writeHead(ipfsRes.statusCode);

          ipfsRes.pipe(res, { end: true })
        })
        memStream.pipe(proxyReq, { end: true })
      } else {
        res.writeHead(401) // unauthorized
        res.end()
        return
      }
    });
  }
});

httpServer.listen(5050);
