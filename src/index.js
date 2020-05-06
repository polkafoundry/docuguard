require("dotenv").config();
const { ecc } = require("@iceteachain/common");
const Hash = require("ipfs-only-hash");
const http = require("http"),
  { isAuthorized } = require("./authorize"),
  formidable = require("formidable"),
  MemoryStream = require('memorystream'),
  { handleOptions, endWithCode } = require('./util')

const EXPIRED_DURATION = +process.env.EXPIRE

const handleAddFiles =
  async (req, res) => {
    if (req.method === "OPTIONS") {
      return handleOptions(res)
    } else if (req.method !== 'POST' || !req.url.startsWith('/api/v0/add')) {
      return endWithCode(400)
    } else {
      const length = Number(req.headers["content-length"])
      if (!length) {
        // it is an invalid request
        return endWithCode(res, 400, 'Body content is empty.') // bad request
      }

      const memStream = new MemoryStream(undefined, { maxbufsize: length });
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
        part.on('error', console.error)
        part.on('aborted', console.error)
      };

      form.parse(req, async err => {
        if (err) {
          console.error(err)
          return endWithCode(res, 400, 'Error parsing form data.') // bad request
        }

        const authData = req.headers.authorization.slice(7); // get authData from 'Bearer {authData}'
        const { app, from, pubkey, sign, time } = JSON.parse(authData);

        // first, check if require is not expired
        if (typeof time !== 'number' || time <= 0 || isNaN(time) || !Number.isInteger(time)) {
          return endWithCode(res, 400, 'Invalid timestamp.')
        }

        const diff = Math.abs(Date.now() - time)
        if (!time ||  diff > EXPIRED_DURATION) {
          return endWithCode(res, 401, 'Request expired.')
        }

        // then, check signature
        const promises = formData.reduce((hashes, buf) => {
          hashes.push(Hash.of(buf))
          return hashes
        }, [])
        const fileHashes = await Promise.all(promises)
        const reqData = { app, fileHashes, from, time }

        const hash32bytes = ecc.stableHashObject(reqData, null);
        const validSignature = ecc.verify(hash32bytes, sign, pubkey);
        if (!validSignature) {
          console.log('Invalid signature for ' + from, reqData, hash32bytes, pubkey)
          return endWithCode(res, 400, 'Invalid signature.') // bad request
        }

        // finally, check if user is approved
        const tokenAddress = ecc.toAddress(pubkey);
        try {
          const isApprovedUser = await isAuthorized(app, from, tokenAddress);
          if (!isApprovedUser) {
            return endWithCode(res, 401, 'Not an approved account or out of quota.') // unauthorized
          }
        } catch (e) {
          console.error(e)
          return endWithCode(res, 500, 'Error checking permission.')
        }

        // everything seems fine, let's proxy the request to IPFS server
        const proxyReq = http.request(
          process.env.IPFS_HOST + req.url,
          {
            method: req.method,
            headers: { ...req.headers, "content-length": length }
          },
          ipfsRes => {
            // clone headers
            Object.keys(ipfsRes.headers).forEach(key => {
              const value = ipfsRes.headers[key];
              res.setHeader(key, value);
            });

            // clone status code
            res.writeHead(ipfsRes.statusCode);

            // pipe content
            ipfsRes.pipe(res, { end: true });
          }
        );

        // write orgininal body to proxyReq
        memStream.pipe(proxyReq, { end: true });

      });
    }
  }

const httpServer = http.createServer();
httpServer.on("request", (req, res) => {
  handleAddFiles(req, res).catch(e => {
    console.error(e)
    endWithCode(res, 500)
  })
});

httpServer.listen(process.env.PORT, () => {
  console.log("IPFS Proxy is listening on port " + process.env.PORT);
});
