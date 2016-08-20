"use strict"
module.exports = [

  /**
   * GET /
   *
   * @description
   *   API Index
   *
   * @return
   *   200
   */

  {
    method: 'GET',

    path: '/{file*}',

    config: {
      auth: false
    },

    handler: {
      directory: {
          path: require('path').join(__dirname, '../../front/public')
      }
    }
  }
];
