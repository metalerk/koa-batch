'use strict';

var _ = require('lodash');

exports.getFinalUrl = function (req, r) {
    // Accept either uri or url (this is what request does, we just mirror)
    r.url = r.url || r.uri;

    // Convert relative paths to full paths
    if (typeof r.url === 'string' && /^\//.test(r.url) === true) {
        return req.protocol + '://' + req.get('host') + r.url;
    }

    return r.url;
};

exports.defaults = function(p) {
    // Clone so we don't alter the original object
    var params = _.clone(p);

    params = params || {};
    params.localOnly = (typeof params.localOnly === 'undefined') ? true : params.localOnly;
    params.httpsAlways = (typeof params.localOnly === 'undefined') ? false : params.localOnly;
    params.max = (typeof params.max === 'undefined') ? 20 : params.max;
    params.validateRespond = (typeof params.validateRespond === 'undefined') ? true : params.validateRespond;
    params.allowedHosts = (typeof params.allowedHosts === 'undefined') ? null : params.allowedHosts;
    params.defaultHeaders = (typeof params.defaultHeaders === 'undefined') ? {} : params.defaultHeaders;
    params.forwardHeaders = (typeof params.forwardHeaders === 'undefined') ? [] : params.forwardHeaders;

    return params;
};
