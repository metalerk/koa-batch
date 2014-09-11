'use strict';

// Batch Request

/**
 * npm dependencies
 */
var _ = require('lodash'),
    bPromise = require('bluebird'),
    debug = require('debug')('koa-batch:batch'),
    request = bPromise.promisify(require('request'));

/**
 * our dependencies
 */
var util = require('./util');

module.exports = function (p) {
    // Set default option values
    var params = util.defaults(p);

    debug('fetching batch generator');

    return function* batch (next) {
        var ctx = this;
        debug('batch middleware called');

        if (!ctx.request.body) {
            ctx.throw(400, 'cannot make a batch request without a body specifying that request');
        }

        // Here we assume it the request has already been validated, either by
        // our included middleware or otherwise by the app developer.

        // We also assume it has been run through some middleware like
        // koa-bodyparser to parse the requests

        var requests = ctx.request.body;

        // First, let's fire off all calls without any dependencies, accumulate their promises
        var requestPromises = _.reduce(requests, function(promises, r, key) {
            if (!r.dependency || r.dependency === 'none') {
                r.headers = r.headers || {};

                r.url = util.getFinalUrl(ctx.request, r);

                _.each(params.defaultHeaders, function(headerV, headerK) {
                    // copy defaults if not already exposed
                    if (!(headerK in r.headers)) {
                        r.headers[headerK] = headerV;
                    }
                });

                _.each(params.forwardHeaders, function(headerK) {
                    // copy forward if not already exposed
                    if (!(headerK in r.headers) && ctx.get(headerK)) {
                        var forwardValue = ctx.get(headerK);
                        r.headers[headerK] = forwardValue;
                    }
                });

                promises[key] = request(r).spread(function(response, body) {
                    return {
                        'statusCode': response.statusCode,
                        'body': body,
                        'headers': response.headers
                    };
                });
            }
            // And while we do that, build the dependency object with those items as keys
            // { key: Promise }
            return promises;
        }, {});

        // Then recursively iterate over all items with dependencies, resolving some at each pass
        var recurseDependencies = function (reqs) {
            // End state hit when the number of promises we have matches the number
            // of request objects we started with.
            if (_.size(requestPromises) >= _.size(reqs)) {
                return;
            } else {
                _.each(requestPromises, function(rp, key) {
                    var dependentKey = null;
                    var dependent = _.find(reqs, function(request, dKey) {
                        dependentKey = dKey;
                        return request.dependency === key && (typeof requestPromises[dKey] === 'undefined');
                    });
                    if (dependent) {
                        requestPromises[dependentKey] = rp.then(function() {
                            return request(dependent);
                        }).spread(function(response) {
                            return response;
                        });
                    }
                });
                recurseDependencies(reqs);
            }
        };

        // Recurse dependencies
        recurseDependencies(requests);

        // Wait for all to complete before responding
        var result = yield bPromise.props(requestPromises);

        // remove all properties, except status, body, and headers
        var output = {};
        for(var prop in result){
            if (result[prop]) {
                output[prop] = { statusCode: result[prop].statusCode, body: result[prop].body, headers: result[prop].headers};
            }
        }
        ctx.body = output;
        yield* next;
    };
};
