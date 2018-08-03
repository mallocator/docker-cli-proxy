/* global describe, it, expect */

const proxy = require('../../lib');
const path = require('path');

describe('Unit Tests', () => {
  describe('resolveDockerFile', () => {
    function checkPath(path, expectation) {
      let result = proxy.resolveDockerfile(path);
      expect(result).toBe(expectation);
    }

    it('should resolve an absolute docker path', () => {
      checkPath('/this/is/a/test/Dockerfile', '/this/is/a/test/Dockerfile');
    });

    it('should resolve a relative docker path', () => {
      checkPath('test/Dockerfile', path.join(__dirname, '../..', 'test/Dockerfile'));
      checkPath('./test/Dockerfile', path.join(__dirname, '../..', 'test/Dockerfile'));
    });

    it('should resolve an absolute path without Dockerfile', () => {
      checkPath('/this/is/a/test', '/this/is/a/test/Dockerfile');
      checkPath('/this/is/a/test/', '/this/is/a/test/Dockerfile');
    });

    it('should resolve a relative path without Dockerfile', () => {
      checkPath('test', path.join(__dirname, '../..', 'test/Dockerfile'));
      checkPath('test/', path.join(__dirname, '../..', 'test/Dockerfile'));
      checkPath('./test', path.join(__dirname, '../..', 'test/Dockerfile'));
      checkPath('./test/', path.join(__dirname, '../..', 'test/Dockerfile'));
    });
  });
});
