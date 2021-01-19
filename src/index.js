require("dotenv").config();
const fs = require('fs');
const { ecc } = require("@iceteachain/common");
var logger = require('./log/logger');
const Hash = require("ipfs-only-hash");
const http = require("http"),
    { isAuthorized } = require("./authorize"),
    formidable = require("formidable"),
    MemoryStream = require('memorystream'),
    { handleOptions, endWithCode, success } = require('./util');
const url = require('url');

const usageControlService = require('./service/usageControlService');
const db = require("./sequelize-ipfs");
const { initQuotaAppUsage } = require("./service/usageControlService");
db.sequelize.sync({ force: false });

const EXPIRED_DURATION = +process.env.EXPIRE;

const handleAddFiles =
    async (req, res, transferDataObject) => {
        const length = Number(req.headers["content-length"]);

        logger.info('content-length: ' + length);

        if (!length) {
            // it is an invalid request
            return endWithCode(res, 400, 'Body content is empty.'); // bad request
        }

        const memStream = new MemoryStream(undefined, { maxbufsize: length });
        req.pipe(memStream);

        const form = new formidable.IncomingForm();
        const formData = [];
        let fileSize = 0;
        form.onPart = part => {
            let buf = Buffer.alloc(length);
            let startIndex = 0;

            part.on("data", chunk => {
                chunk.copy(buf, startIndex);
                startIndex += chunk.length;
                fileSize += chunk.length;
            });
            part.on("end", () => {
                formData.push(buf.slice(0, startIndex));
                buf = Buffer.alloc(length);
                startIndex = 0;
            });
            part.on('error', console.error);
            part.on('aborted', console.error)
        };

        form.parse(req, async err => {
            if (err) {
                console.error(err);
                return endWithCode(res, 400, 'Error parsing form data.'); // bad request
            }

            const { app, from, pubkey, sign, time } = transferDataObject.authData;

            // then, check signature
            const promises = formData.reduce((hashes, buf) => {
                hashes.push(Hash.of(buf));
                return hashes;
            }, []);
            const fileHashes = await Promise.all(promises);
            const reqData = { app, fileHashes, from, time };

            const hash32bytes = ecc.stableHashObject(reqData, null);

            // const validSignature = ecc.verify(hash32bytes, sign, pubkey);
            // if (!validSignature) {
            //   logger.error('Invalid signature for ' + from, reqData, hash32bytes, pubkey);
            //   return endWithCode(res, 400, 'Invalid signature.'); // bad request
            // }

            //check is over usage limitation
            // const isOverUsageLimitation = await usageControlService.isOverUsageLimitation(from, app, length);

            // if (isOverUsageLimitation) {
            //     return endWithCode(res, 422, 'Your application has exceeded the space limit.'); // over usage limitation
            // }

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
                        res.setHeader(key, value);;
                    });

                    // clone status code
                    res.writeHead(ipfsRes.statusCode);

                    logger.info("res: ", res);
                    // pipe content
                    ipfsRes.pipe(res, { end: true });
                }
            );

            logger.info("formData: " + formData);
            logger.info("fileHashes: " + fileHashes);
            logger.info("fileSize: " + fileSize);

            // update usage
            // await usageControlService.updateUsage(from, app, fileHashes, fileSize);
            // await Promise.all(formData.forEach(function(buf, index) {
            //   var hash = fileHashes[index];
            //   logger.info("hash: " + hash);
            //   logger.info("====buf.length: " + buf.length);
            //   return usageControlService.updateUsage(from, app, hash, buf.length);
            // }));
            // write orgininal body to proxyReq
            memStream.pipe(proxyReq, { end: true });
        });
    };

const authenticationFilter =
    async (req, res, next, transferDataObject) => {
        const length = Number(req.headers["content-length"]);
        var authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return endWithCode(res, 401, 'Need Authorization information.')
        }
        const authData = authorizationHeader.slice(7); // get authData from 'Bearer {authData}'
        const { app, from, pubkey, sign, time } = JSON.parse(authData);

        // first, check if require is not expired
        if (Date.now() - time > EXPIRED_DURATION) {
            return endWithCode(res, 401, 'The request is no longer valid.')
        }

        // finally, check if user is approved
        const tokenAddress = ecc.toAddress(pubkey);
        // comment check flow only
        // try {
        //   const isApprovedUser = await isAuthorized(app, from, tokenAddress, length);
        //   if (!isApprovedUser) {
        //     return endWithCode(res, 401, 'Not an approved account or out of quota.');
        //   }
        // } catch (e) {
        //   logger.error(e);
        //   return endWithCode(res, 500, 'Error checking permission.')
        // }
        transferDataObject.authData = JSON.parse(authData);
        next(req, res, transferDataObject);
    };

const handleCurrentAppUsage =
    async (req, res, transferData) => {
        return usageControlService
            .getAppUsage(transferData.authData.app)
            .then(result => {
                if (result == null) {
                    return endWithCode(res, 401, 'Not an approved account or out of quota.');
                }

                return success(res, result);
            });
    };

const handleUserAppUsage =
    async (req, res, transferData) => {
        return usageControlService
            .getUserAppUsage(transferData.authData.from, transferData.authData.app)
            .then(result => {
                return success(res, { usage: result });
            });
    };

const handleUserUsage =
    async (req, res, transferData) => {
        return usageControlService
            .getUserUsage(transferData.authData.from)
            .then(result => {
                return success(res, { usage: result });
            });
    };

const handUpdateQuotaAppUsage = 
    async (req, res, transferData) => {
        logger.info("app: " + transferData.authData.app);
        return usageControlService
            .updateQuotaAppUsage(transferData.authData.app, req.headers.quota)
            .then(result => {
                return success(res, { usage: result });
            });
    }

const routeMap = [];
routeMap.push({
    "path": "/api/v0/usage/currentAppUsage",
    "method": "GET",
    "filter": authenticationFilter,
    "processor": handleCurrentAppUsage
});
routeMap.push({
    "path": "/api/v0/usage/userAppUsage",
    "method": "GET",
    "filter": authenticationFilter,
    "processor": handleUserAppUsage
});
routeMap.push({
    "path": "/api/v0/usage/userUsage",
    "method": "GET",
    "filter": authenticationFilter,
    "processor": handleUserUsage
});
routeMap.push({
    "path": "/api/v0/usage/updateQuotaAppUsage",
    "method": "POST",
    "filter": authenticationFilter,
    "processor": handUpdateQuotaAppUsage
});
routeMap.push({
    "path": "/api/v0/add",
    "method": "POST",
    "filter": authenticationFilter,
    "processor": handleAddFiles
});

const httpServer = http.createServer();
httpServer.on("request", (req, res) => {
    if (req.method === "OPTIONS") {
        return handleOptions(res)
    }
    var path = url.parse(req.url).pathname;
    for (const route of routeMap) {
        if (req.method == route.method && path == route.path) {
            var transferDataObject = {};
            var filter = route.filter;
            filter(req, res, route.processor, transferDataObject)
                .catch(e => {
                    logger.error(e);
                    endWithCode(res, 500)
                });
            return;
        }
    }
    endWithCode(400);
});

httpServer.listen(process.env.PORT, () => {
    logger.info("IPFS Proxy is listening on port " + process.env.PORT);
});
// for testing
module.exports = httpServer;
