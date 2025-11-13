/* eslint-disable @typescript-eslint/no-var-requires */
const autoprefixer = require("autoprefixer");
const postcssNesting = require("postcss-nesting");

module.exports = {
  plugins: [postcssNesting, autoprefixer]
};

