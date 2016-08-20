/**
 * @file files.js
 * @description
 * Utils files methods
 */

const fs = require('fs');

module.exports = {

  /**
   * getFiles(string: path)
   * Return files list presents in `path`
   * @return
   * Absolute files path array
   */
  getFiles: function(path) {
    path = path[path.length-1] !== '/' ? path + '/' : path;
    var files = [];
    try {
      files = fs.readdirSync(__dirname + '/../' + path);
    } catch (e) {
      log(colors.error((e)));
      process.exit();
    }
    return files.map(function(file) {
      return __dirname + '/../' + path + file;
    });
  }


};