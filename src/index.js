require("dotenv").config();
const Hash = require("ipfs-only-hash");
const http = require("http"),
  formidable = require("formidable"),
  httpProxy = require("http-proxy"),
  authorize = require("./authorize");

let proxy = httpProxy.createProxyServer({});
let target = process.env.IPFS_HOST;
console.log("target", target);

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

proxy.on("proxyReq", function(proxyReq, req, res, options) {
  proxyReq.setHeader("X-Special-Proxy-Header", "foobar");

  var form = new formidable.IncomingForm();
  form.parse(req, async function(err, fields, files) {
    const keys = Object.keys(files);
    console.log("keys", keys);
    Object.keys(files).forEach(function(key) {
      const file = files[key];
      // console.log(file);
      //  var fileBuffer = Buffer.from(file);
      // console.log(fileBuffer);
    });
    // const data = await readFileAsync(files["file-3"]);
    console.log("data", files["file-0"]);
  });

  let body = [];
  req
    .on("data", chunk => {
      // console.log("chunk", chunk.length);
      body.push(chunk);
    })
    .on("end", async () => {
      let buffer = Buffer.from(body[0]);
      const hash = await Hash.of(buffer);
      // console.log("hash", hash);

      // res.end(body);
      let token = req.headers.authorization.slice(7);
      // console.log("token1", token);
      // console.log("token2", JSON.parse(token));
      // console.log("token3", JSON.parse(token).sign);
      // console.log("req.headers", req.headers);
      //  res.writeHead(401);
      // authorize
      //   .checkAuthorize(token)
      //   .then(ok => {
      //     // console.log('req',body)
      //     res.writeHead(401);
      //   })
      //   .catch(e => {
      //     res.writeHead(401);
      //     res.end();
      //   });
    });

  req.on("error", function proxyRequestError() {
    console.log("request on error");
  });
});

let server = http.createServer(function(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("access-control-allow-methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("access-control-allow-headers", "Authorization");
    res.setHeader("access-control-max-age", 86400);
    res.setHeader("Content-Type", "text/plain charset=UTF-8");
    res.setHeader("Content-Type", 0);
    res.writeHead(204);
    res.end();
  } else {
    let token = req.headers.authorization.slice(7); // get token from 'Bearer {token}'
    console.log("req.headers", req.headers);
    // authorize.checkAuthorize(token).then(ok => {
    // if (ok) {
    proxy.web(req, res, { target: target });
    // }
    // }).catch(e => {
    // res.writeHead(401);
    // res.end();
    // })
  }
});

server.listen(5050);
