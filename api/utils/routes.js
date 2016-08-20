/**
 * @file routes.js
 * @description
 * Utils routes methods
 */

module.exports = {

  /**
   * success(object: data, request, reply, boolean: isGuest)
   * Return success response withsome  data
   * @return
   * Response object 
   */
  success: function(request, reply, data, isGuest){
    if(isGuest) var token = request.payload.token;
    else var token = request.headers.authorization;
    return reply({statusCode: 201, data:data}).code(201).header("Authorization", token);
  }

};