'use strict';

// Test app
/**
 * npm dependencies
 */
var bodyparser = require('koa-bodyparser'),
    chance = require('chance').Chance(),
    koa = require('koa'),
    router = require('koa-router'),
    wait = require('co-wait');

/**
 * our dependencies
 */
var koaBatch = require('../..');

module.exports = function getApp(options) {
    var batch = koaBatch.batch(options);
    var validate = koaBatch.validate(options);

    var app = koa();

    app.use(bodyparser());
    app.use(router(app));

    app.get('/test', function* () {
        this.body = 'test';
    });

    // A POST endpoint to use the batch middleware 
    app.post('/batch', validate, batch);

    // A GET endpoint to use the batch middleware
    app.get('/batch', validate, batch);

    // Let's make some fake endpoints
    app.get('/users/:id/name', function* () {
        this.body = chance.name();
    });

    app.post('/users/:id/name', function* () {
        // If a first name is sent in, we will reflect it so we can test that it was
        // received correctly.
        var name = chance.name();
        if (this.request.body && this.request.body.first) {
            name = this.request.body.first;
        }
        this.body = name;
    });

    app.put('/users/:id/name', function* () {
        this.body = chance.name();
    });

    app.post('/users/:id/deep', function* () {
        this.body = {
            email: chance.email(),
            mixed: {
                name: chance.name(),
                deep: {
                    foo: 'bar'
                }
            }
        };
    });

    app.get('/users/:id/email', function* () {
        this.body = chance.email();
    });

    app.get('/users/:id/company', function* () {
        this.body = chance.capitalize(chance.word());
    });

    app.get('/users/:id/hammertime', function* () {
        this.body = new Date().getTime();
    });

    app.get('/users/:id/delay', function* () {
        yield wait(250);
        this.body = new Date().getTime();
    });

    app.get('/header/:name', function* () {
        if (this.params.name in this.header) {
            this.body = {
                name: this.params.name,
                value: this.header[this.params.name]
            };
        } else {
            this.status = 404;
        }
    });

    var port = 3000;
    if (options && 'port' in options) {
        port = options.port;
    }

    return app.listen(port);
};
