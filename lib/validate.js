'use strict';

/**
 * Validate middleware for batch
 *
 * @param {Object} [params]
 * @return {Function}
 * @api public
 */

/**
 * npm dependencies
 */
var _ = require('lodash'),
    check = require('validator').check,
    debug = require('debug')('koa-batch:validate'),
    methods = require('methods'),
    url = require('url');

/**
 * our dependencies
 */
var util = require('./util');

module.exports = function (params) {
    debug('fetching validate generator');

    // Set default option values
    params = util.defaults(params);

    return function *validate (next) {
        var ctx = this;
        debug('validate middleware called');

        var err = null,
            requests = ctx.request.body,
            requestHost;

        // Validation on Request object as a whole
        try {
            check(_.size(requests), 'Cannot make a batch request with an empty request object').min(1);
            check(_.size(requests), 'Over the max request limit. Please limit batches to ' + params.max + ' requests').max(params.max);
            if (ctx.request.method === 'POST' && !ctx.request.is('json')) {
                throw new Error('Koa Batch will only accept POST body as json');
            }
        } catch (e) {
            ctx.throw(400, e.message);
        }

        // Validation on each request object
        _.each(requests, function(r) {

            // If no method provided, default to GET
            r.method = (typeof r.method === 'string') ? r.method.toLowerCase() : 'get';

            r.url = util.getFinalUrl(ctx.request, r);

            try {
                check(r.url, 'Invalid URL').isUrl();
                check(r.method, 'Invalid method').isIn(methods);
                if (r.body !== undefined) {
                    check(r.method.toLowerCase(), 'Request body not allowed for this method').isIn(['put', 'post', 'options']);
                }
            } catch (e) {
                ctx.throw(400, e.message);
            }

            if (params.allowedHosts !== null) {
                requestHost = url.parse(r.url).host;
                if (params.allowedHosts.indexOf(requestHost) === -1) {
                    ctx.throw(400, 'Cannot make batch request to a host which is not allowed: ' + requestHost);
                }
            }
        });

        if (err !== null) {
            ctx.body = err;
            ctx.throw(err.message, 400, err);
        }

        yield* next;
    };
};
