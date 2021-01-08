process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let httpServer = require('../src/index');
let should = chai.should();

chai.use(chaiHttp);
// Test service getCurrentAppUsage
describe('Get current app usage', () => {
    beforeEach((done) => {
        done();
    });
    describe('/GET current app usage', () => {
        it('it should GET current app usage', (done) => {
            chai.request(httpServer)
                .get('/api/v0/test')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
});
