/**
 * @file strings.js
 * @description
 * Utils users methods
 */

module.exports = {

  /**
   * generatePassword()
   * Return random password
   * @return
   * String
   */
   decodeEntities: function(str) {
     if(str && typeof str === 'string') {
       // strip script/html tags
       str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
       str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
       element.innerHTML = str;
       str = element.textContent;
       element.textContent = '';
     }

     return str;
   },
   stringGen: function(len){
      var text = " ";
      var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < len; i++ )
          text += charset.charAt(Math.floor(Math.random() * charset.length));

      return text;
    }
};
