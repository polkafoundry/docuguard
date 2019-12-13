/*
  A fake IPFS server for local testing.
*/

const http = require('http')
const Hash = require("ipfs-only-hash")
const formidable = require("formidable")
const fs = require('fs')
const { endWithCode } = require('../src/util')

const tempHttpServer = http.createServer()
tempHttpServer.on("request", async (req, res) => {

    console.log('IPFS server got a new request', req.method, req.url)

    if (req.method === 'GET') {
        // get the hash
        const hash = req.url.split('/').pop()
        if (!hash.startsWith('Qm')) {
            return endWithCode(res, 400)
        }

        const path = __dirname + '/files/' + hash
        fs.readFile(path, async (err, buf) => {
            if (err) {
                console.error(err)
                return endWithCode(res, 404, 'File not found or cannot be read.')
            }
            res.setHeader('access-control-allow-origin', '*')
            //res.setHeader('Content-Type', 'image/jpeg')
            res.setHeader('Content-Length', buf.length)
            res.writeHead(200)
            res.end(buf)
        })

    } else {

        // extract the form
        const form = new formidable.IncomingForm()
        form.uploadDir = __dirname + '/files/'

        const results = []

        form.on('file', async function (field, file) {
            const p = new Promise((resolve, reject) => {
                fs.readFile(file.path, async (err, buf) => {
                    if (err) {
                        return reject(err)
                    }
                    const hash = await Hash.of(buf)
                    const path = form.uploadDir + hash
                    fs.rename(file.path, path, () => undefined);
                    resolve({ path: hash, hash, size: buf.length })
                })
            })
            results.push(p)
        });

        form.on('error', function (err) {
            console.error("An form data error occured.")
            console.log(err);
            req.resume();
        });

        form.on('aborted', function (err) {
            console.log("User aborted.");
            console.log(err)
        });

        form.parse(req, function () {
            Promise.all(results).then(data => {
                res.setHeader('access-control-allow-origin', '*')
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(200)
                const r = data.reduce((prev, item) => {
                    const json = JSON.stringify(item)
                    prev += prev ? ('\n' + json) : json
                    return prev
                }, '')
                res.end(r)
            }).catch(err => {
                return endWithCode(res, 500, err)
            })
        });
    }
})

tempHttpServer.listen(5001)
console.log('Fake IPFS server is listening at port 5001!')