"use strict";

/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./production.min.js");
} else {
  module.exports = require("./dev.js");
}
