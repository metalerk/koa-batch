Batch Request middleware for [koa](http://koajs.com). Turn one request into many!
=======

Looking for [the ExpressJS version of this module](https://github.com/socialradar/batch-request)?

A simple library for batching HTTP requests

[View Documentation](http://batch-request.socialradar.com)

[![Build Status](https://travis-ci.org/socialradar/koa-batch.png?branch=master)](https://travis-ci.org/socialradar/koa-batch) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## QuickStart

Download via [NPM](http://npmjs.org)

[![NPM](https://nodei.co/npm/koa-batch.png?compact=true)](https://nodei.co/npm/koa-batch/)

then in your app

    var batch = require('koa-batch').batch();

    // Use Batch Request as middleware on an endpoint you want to service batch requests (example using [koa-router](https://github.com/alexmingoia/koa-router))
    app.post('/batch', batch);


Optionally use our included middleware to check the validity of your batch request

    var batch = require('koa-batch').batch(),
        validate = require('koa-batch').validate();

    // Include the validate middleware before batch middleware
    app.post('/batch', validate, batch);

And that's it!

Proudly written in Washington, D.C. by:

[![SocialRadar](https://raw.github.com/socialradar/koa-batch/master/social-radar-black-orange.png)](http://socialradar.com)
