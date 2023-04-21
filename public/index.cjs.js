"use strict";

/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./production.cjs.js");
} else {
  module.exports = require("./dev.cjs.js");
}
