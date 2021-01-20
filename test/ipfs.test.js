process.env.NODE_ENV = 'test';

let chai = require('chai');
let expect = chai.expect;
let chaiHttp = require('chai-http');
let httpServer = require('../src/index');
let should = chai.should();
const config = require("config");
const logger = require('../src/log/logger');

chai.use(chaiHttp);
describe('###########------------Call tests suit...----------##########', () => {
    // Init token
    // Get token from config file and then update request time
    const authData = config.get("test.authorization");
    const bearerData = JSON.parse(JSON.stringify(authData));
    bearerData["time"] = Date.now();
    const authorization = "Bearer " + JSON.stringify(bearerData);
    const fileTest1 = './test/temp/file-temp1.txt';

    logger.info("authorization: " + JSON.stringify(authorization));

    before((done) => {
        done();
    });

    beforeEach((done) => {
        done();
    });

    // Test case: init or update quota for app
    describe('/POST update quota app', () => {
        it('it should POST update quota for app usage', (done) => {
            chai.request(httpServer)
                .post('/api/v0/usage/updateQuotaAppUsage')
                .set('authorization', authorization)
                .set('quota', 1000010)
                .end((err, res) => {
                    res.should.have.status(200);
                    const text = res.text;
                    logger.info("res: " + JSON.stringify(res));
                    // let temp = JSON.parse(res.text);
                    // expect(temp.usage).gt(0);
                    done();
                })
        });
    });

    // Test case upload file
    describe('/POST upload file', () => {
        it('it should POST upload file', (done) => {
            chai.request(httpServer)
                .post('/api/v0/add')
                .set('authorization', authorization)
                .attach('file', fileTest1)
                .end((err, res) => {
                    res.should.have.status(200);
                    const text = res.text;
                    logger.info("res_upload: " + JSON.stringify(res));
                    let temp = JSON.parse(res.text);
                    // expect(temp.path).not.null();
                    // expect(temp.hash).not.null();
                    expect(temp.Size).eq('41');
                    done();
                })
        });
    });

    // Test case get current app usage
    describe('/GET current app usage', () => {
        it('it should GET current app usage', (done) => {
            chai.request(httpServer)
                .get('/api/v0/usage/currentAppUsage')
                .set('authorization', authorization)
                .end((err, res) => {
                    res.should.have.status(200);
                    const text = res.text;
                    logger.info("res: " + JSON.stringify(res));

                    let temp = JSON.parse(res.text);
                    temp.should.be.a('object');
                    logger.info("temp: " + JSON.stringify(temp));
                    logger.info("usage: " + temp.usage);
                    temp.usage.should.be.a('number');
                    expect(temp["app"]).to.equal('contract.lovelockdev');
                    expect(temp["usage"]).gt(0);
                    done();
                })
        });
    });

    // Test case get user app usage
    describe('/GET user app usage', () => {
        it('it should GET user app usage', (done) => {
            chai.request(httpServer)
                .get('/api/v0/usage/userAppUsage')
                .set('authorization', authorization)
                .end((err, res) => {
                    res.should.have.status(200);
                    const text = res.text;
                    logger.info("res: " + JSON.stringify(res));
                    let temp = JSON.parse(res.text);
                    expect(temp.usage).gt(0);
                    done();
                })
        });
    });

    // Test case get user usage
    describe('/GET user usage', () => {
        it('it should GET user usage', (done) => {
            chai.request(httpServer)
                .get('/api/v0/usage/userUsage')
                .set('authorization', authorization)
                .end((err, res) => {
                    res.should.have.status(200);
                    const text = res.text;
                    logger.info("res: " + JSON.stringify(res));
                    let temp = JSON.parse(res.text);
                    expect(temp.usage).gt(0);
                    done();
                })
        });
    });
});