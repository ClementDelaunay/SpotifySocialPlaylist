/**
 * @file errors.js
 * @description
 * Utils errors methods
 */

module.exports = {

  /**
   * getError(string: slug)
   * Return json error for reply
   * @return
   * Error object
   */
  getSystemError: function(slug){
    var errors = {
      mongo: 'Database Error.',
      orm: 'ORM Error.',
      process: 'System process failed.'
    }
    return errors[slug];
  },

  /**
   * validation(request, reply, string: error)
   * Return validation error
   * @return
   * Response object
   */
  validation: function(request, reply, error){
    return reply({statusCode: 400, error: "Bad Request", validation: error}).code(400);
  }


};
