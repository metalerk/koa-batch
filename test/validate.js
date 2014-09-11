'use strict';
// Validation middleware tests

process.env.NODE_ENV = 'test';

var chance = require('chance').Chance(),
    expect = require('chai').expect,
    request = require('supertest');

describe('validate', function() {
    var app;
    var appAllowed;
    var batch;
    var validate;

    before(function() {
        app = require('./helpers/app')();
        appAllowed = require('./helpers/app')({
            port: 3001,
            allowedHosts: [
                'socialradar.com',
                'localhost:3001'
            ]
        });
        batch = require('..').batch();
        validate = require('..').validate();
    });

    after(function(done) {
        appAllowed.close();
        app.close(done);
    });

    describe('basic', function() {
        it('looks good', function() {
            expect(batch).to.be.a('function');
        });

        it('has a validate method', function() {
            expect(validate).to.be.a('function');
        });

        it('rejects non-object JSON', function(done) {
            request(app)
                .post('/batch')
                .send(chance.word())
                .expect(400, function(err, res) {
                    expect(err).to.be.null;
                    expect(res.error).to.exist;
                    expect(res.text).to.exist;
                    expect(res.text).to.equal('Koa Batch will only accept POST body as json');
                    done();
                });
        });

        it('rejects a blank request', function(done) {
            request(app)
                .post('/batch')
                .send({})
                .expect(400, function(err, res) {
                    expect(err).to.be.null;
                    expect(res.error).to.exist;
                    expect(res.text).to.equal('Cannot make a batch request with an empty request object');
                    done(err);
                });
        });
    });

    describe('options', function() {
        describe('allowed hosts', function() {
            it('will accept an allowed hosts parameter', function() {
                expect(require('..').batch({
                    allowedHosts: [
                        chance.domain(),
                        chance.domain()
                    ]
                })).to.be.ok;
            });

            it('will return a validation error if allowed hosts set and request url not allowed', function(done) {
                // Note, for the appAllowed app, the allowedHosts parameter contains "socialradar.com" and that's it.
                request(appAllowed)
                    .post('/batch')
                    .send({
                        disallowedUrl: {
                            url: 'http://www.google.com'
                        }
                    })
                    .expect(400, function(err, res) {
                        expect(res.error).to.exist;
                        expect(res.text).to.equal('Cannot make batch request to a host which is not allowed: www.google.com');
                        done(err);
                    });
            });

            it('will return a validation error if allowed hosts set and one request url not allowed', function(done) {
                request(appAllowed)
                    .post('/batch')
                    .send({
                        allowedUrl1: {
                            url: 'http://socialradar.com/developers'
                        },
                        allowedUrl2: {
                            url: 'http://socialradar.com/about'
                        },
                        disallowedUrl: {
                            url: 'http://www.google.com'
                        }
                    })
                    .expect(400, function(err, res) {
                        expect(res.error).to.exist;
                        expect(res.text).to.equal('Cannot make batch request to a host which is not allowed: www.google.com');
                        done(err);
                    });
            });

            it('will not return a validation error if all requests are to allowed', function(done) {
                request(appAllowed)
                    .post('/batch')
                    .send({
                        allowedUrl1: {
                            url: 'http://socialradar.com/developers'
                        },
                        allowedUrl2: {
                            url: 'http://socialradar.com/about'
                        },
                        allowedUrl3: {
                            url: 'http://socialradar.com/product'
                        }
                    })
                    .expect(200, function(err, res) {
                        expect(res.body.error).to.not.exist;
                        done(err);
                    });
            });

            it('will accept localhost as an allowedHost and obey it', function(done) {
                request(appAllowed)
                    .post('/batch')
                    .send({
                        allowedUrl1: {
                            url: 'http://socialradar.com/developers'
                        },
                        allowedUrl2: {
                            url: 'http://socialradar.com/about'
                        },
                        allowedUrl3: {
                            url: 'http://socialradar.com/product'
                        },
                        testingLocalhost: {
                            url: 'http://localhost:3001/users/test/name'
                        }
                    })
                    .expect(200, function(err, res) {
                        expect(res.body.error).to.not.exist;
                        done(err);
                    });
            });
        });
    });

    describe('other validation', function() {
        it('rejects request with bogus method', function(done) {
            request(app)
                .post('/batch')
                .send({
                    bogusMethod: {
                        method: chance.word() + chance.word(),
                        url: 'http://localhost:4000/users/1/name'
                    }
                })
                .expect(400, function(err, res) {
                    expect(err).to.be.null;
                    expect(res.error).to.exist;
                    expect(res.text).to.equal('Invalid method');
                    done(err);
                });
        });

        it('rejects request with bogus url', function(done) {
            request(app)
                .post('/batch')
                .send({
                    bogusUrl: {
                        url: chance.word()
                    }
                })
                .expect(400, function(err, res) {
                    expect(err).to.be.null;
                    expect(res.error).to.exist;
                    expect(res.text).to.equal('Invalid URL');
                    done(err);
                });
        });

        it('rejects get requests with request bodies', function(done) {
            request(app)
                .get('/batch')
                .send({
                    getRequestWithBody: {
                        method: 'get',
                        url: 'http://localhost:4000/users/1/name',
                        body: '{"foo":"bar"}'
                    }
                })
                .expect(400, function(err, res) {
                    expect(err).to.be.null;
                    expect(res.error).to.exist;
                    expect(res.text).to.equal('Request body not allowed for this method');
                    done(err);
                });
        });
    });
});
