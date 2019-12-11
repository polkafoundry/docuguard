require("dotenv").config();
const fs = require("fs");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);
const { ecc, codec, AccountType } = require("@iceteachain/common");
const Hash = require("ipfs-only-hash");
const http = require("http"),
  formidable = require("formidable"),
  httpProxy = require("http-proxy"),
  authorize = require("./authorize");

let proxy = httpProxy.createProxyServer({});
let target = process.env.IPFS_HOST;
console.log("target", target);

// function someAsyncFunc() {
//   return new Promise(resolve => {
//     resolve({ data: 1 });
//   });
// }
function formidablePromise(req) {
  return new Promise((resolve, reject) => {
    var form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields: fields, files: files });
    });
  });
}

proxy.on("proxyReq", async (proxiedReq, req, res, options) => {
  try {
    proxiedReq.on("socket", function(socket) {
      if (server) {
        server.emit("proxyReq", proxyReq, req, res, options);
      }
    });
    proxiedReq.proxyWait = new Promise(function(resolve) {
      setTimeout(() => resolve("done!"), 5000);
    });

    (proxiedReq.proxyWait || Promise.resolve()).then(data => {
      console.log("data", data);
      proxiedReq.setHeader("origin", "");
      proxiedReq.setHeader("host", "");
    });

    // const data = await formidablePromise(req);
    // console.log("data", data);
    // let promise = new Promise((resolve, reject) => {});
    // const aaaaa = await promise;

    console.log("done");
    let token = req.headers.authorization.slice(7); // get token from 'Bearer {token}'
    token = JSON.parse(token);
    Object.keys(token.signs).forEach(ipfsHash => {
      const timeServer = Date.now();
      const item = token.signs[ipfsHash];
      const { sign, time } = item;
      const isLess30Second = Math.floor(timeServer - time) / 1000 < 30;
      const hash32bytes = ecc.stableHashObject(ipfsHash + time);
      const isSigned = ecc.verify(hash32bytes, sign, token.pubkey);
      console.log("isSigned", isSigned, "- isLess30Second: ", isLess30Second);
    });
  } catch (error) {
    console.log("error", error);
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Cannot " + req.method + " " + req.url);
  }

  // const isSign = ecc.verify(token.);
  // proxiedReq.setHeader("X-Special-Proxy-Header", "foobar");

  // const data = await formidablePromise(req);
  // Update header
  // proxiedReq.setHeader("content-type", "text/plain");
  // proxiedReq.setHeader("content-length", 0);
  // proxiedReq.setHeader("origin", "");
  // proxiedReq.setHeader("host", "");
  // Write out body changes to the proxyReq stream
  // proxiedReq.write("");
  console.log("aaaa");
});

let server = http.createServer();
server.on("request", async (req, res) => {
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
    // const data = await formidablePromise(newObj);
    // const data = await someAsyncFunc();

    proxy.web(req, res, { target: target });
    console.log("end");
    // res.end(JSON.stringify(data));
  }
});

server.listen(5050);
