const http = require('http'),
  httpProxy = require('http-proxy'),
  authorize = require('./authorize');

let proxy = httpProxy.createProxyServer({});
let target = 'http://localhost:5001';

let server = http.createServer(function (req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-credentials', 'true');
    res.setHeader('access-control-allow-methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('access-control-allow-headers', 'Authorization');
    res.setHeader('access-control-max-age', 86400);
    res.setHeader('Content-Type', 'text/plain charset=UTF-8');
    res.setHeader('Content-Type', 0);
    res.writeHead(204);
    res.end();
  } else {
    let token = req.headers.authorization.slice(7) // get token from 'Bearer {token}'

    authorize.checkAuthorize(token).then(ok => {
      if (ok) {
        proxy.web(req, res, { target: target });
      }
    }).catch(e => {
      res.writeHead(401);
      res.end();
    })
  }
});

server.listen(5050);