require("dotenv").config();
const { ecc } = require("@iceteachain/common");
const Hash = require("ipfs-only-hash");
const fs = require("fs");
const http = require("http"),
  authorize = require("./authorize"),
  formidable = require("formidable"),
  { PassThrough } = require("stream");

const httpServer = http.createServer();
httpServer.on("request", async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("access-control-allow-methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("access-control-allow-headers", "Authorization");
    res.setHeader("access-control-max-age", 86400);
    res.setHeader("Content-Type", "text/plain charset=UTF-8");
    res.setHeader("Content-Type", 0);
    res.writeHead(204); // no content
    res.end();
  } else {
    const length = Number(req.headers["content-length"]);
    if (!length) {
      // it is an invalid request
      res.writeHead(400); // bad request
      res.end();
      return;
    }

    const memStream = new PassThrough();
    req.pipe(memStream);

    const form = new formidable.IncomingForm();
    const formData = [];
    form.onPart = part => {
      let buf = Buffer.alloc(length);
      let startIndex = 0;

      part.on("data", chunk => {
        chunk.copy(buf, startIndex);
        startIndex += chunk.length;
      });
      part.on("end", () => {
        formData.push(buf.slice(0, startIndex));
        buf = Buffer.alloc(length);
        startIndex = 0;
      });
    };

    form.parse(req, async err => {
      if (err) {
        res.writeHead(400); // bad request
        res.end();
        return;
      }

      let token = req.headers.authorization.slice(7); // get token from 'Bearer {token}'
      const { from, sign, time, pubkeySigner } = JSON.parse(token);

      // const address = ecc.toAddress(from);
      let isAuthen = false;
      try {
        console.log("from", from);
        isAuthen = await authorize.checkAuthorize(from);
        console.log("isAuthen", isAuthen);
        if (!isAuthen) {
          res.writeHead(401); // unauthorized
          res.end();
          return;
        }
      } catch (e) {
        res.writeHead(401); // unauthorized
        res.end();
        return;
      }

      let preHash = [];
      formData.forEach(buffer => {
        // console.log("buffer", buffer);
        preHash.push(Hash.of(buffer));
      });
      preHash = await Promise.all(preHash);
      // console.log("preHash", preHash);
      let concatHash = "";
      preHash.forEach(hash => {
        concatHash = concatHash.concat(hash);
      });
      const timeServer = Date.now();
      const isLess60Second = Math.floor(timeServer - time) / 1000 < 60;
      const hash32bytes = ecc.stableHashObject(concatHash + time);
      const isSigned = ecc.verify(hash32bytes, sign, pubkeySigner);
      console.log("isSigned", isSigned, "- isLess60Second: ", isLess60Second);

      if (isLess60Second && isSigned) {
        const proxyReq = http.request(
          process.env.IPFS_HOST + req.url,
          {
            method: req.method,
            headers: { ...req.headers, "content-length": length }
          },
          ipfsRes => {
            console.log("Got response from IPFS");
            Object.keys(ipfsRes.headers).forEach(key => {
              const value = ipfsRes.headers[key];
              res.setHeader(key, value);
            });
            res.writeHead(ipfsRes.statusCode); // no content
            ipfsRes.pipe(res, { end: true });
          }
        );
        //proxyReq.write(body)
        memStream.pipe(proxyReq, { end: true });
        //proxyReq.end()
      } else {
        res.writeHead(401); // unauthorized
        res.end();
        return;
      }
    });
  }
});

httpServer.listen(5050);
