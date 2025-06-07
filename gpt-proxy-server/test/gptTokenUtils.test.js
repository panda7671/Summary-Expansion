const assert = require('assert');

// Add local test modules to resolution path
process.env.NODE_PATH = __dirname + '/node_modules';
require('module').Module._initPaths();

const { countTokens, countMessagesTokens } = require('../gptTokenUtils');

assert.strictEqual(countTokens('hello world'), 2, 'countTokens should split words');

const messages = [
  { role: 'system', content: 'hi there' },
  { role: 'user', content: 'hello world' }
];
// tokens: (4 + 1 + 2) + (4 + 1 + 2) + 2 = 16
assert.strictEqual(countMessagesTokens(messages), 16, 'countMessagesTokens should count tokens including overhead');

console.log('All tests passed');
