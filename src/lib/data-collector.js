'use strict';

var braintreeWebVersion = require('braintree-web/client').VERSION;
var constants = require('../constants');
var analytics = require('./analytics');
var assets = require('@braintree/asset-loader');

function DataCollector(config) {
  this._config = Object.assign(config, {
    useDeferredClient: true
  });
}

DataCollector.prototype.initialize = function () {
  var self = this;

  return Promise.resolve().then(function () {
    if (global.braintree && global.braintree.dataCollector) {
      return Promise.resolve();
    }

    return assets.loadScript({
      src: 'https://js.braintreegateway.com/web/' + braintreeWebVersion + '/js/data-collector.min.js',
      id: constants.DATA_COLLECTOR_SCRIPT_ID
    });
  }).then(function () {
    return global.braintree.dataCollector.create(self._config);
  }).then(function (instance) {
    self._instance = instance;
  }).catch(function (err) {
    // TODO we need a way to bubble up errors
    // back to the merchant in the case where
    // something goes wrong when setting up data collector
    // instead of silently failing
    analytics.sendEvent('data-collector.setup-failed');
    // log the Data Collector setup error
    // but do not prevent Drop-in from loading
    self.log(err);
  });
};

DataCollector.prototype.log = function (message) {
  console.log(message); // eslint-disable-line no-console
};

DataCollector.prototype.getDeviceData = function () {
  if (!this._instance) {
    return Promise.resolve('');
  }

  return this._instance.getDeviceData();
};

DataCollector.prototype.teardown = function () {
  if (!this._instance) {
    return Promise.resolve();
  }

  return this._instance.teardown();
};

module.exports = DataCollector;
