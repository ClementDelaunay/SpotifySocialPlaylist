app.service('Utils', function(Request, $window) {

    var self = this;

    (function Init() {
      Request.json('errors', function(json){self.errorStrings = json;})
    })();

    this.setAll = function(a, v) {
        var i, n = a.length;
        for (i = 0; i < n; ++i) {
            a[i] = v;
        }
        return a;
    };

    this.checkForm = function(data){
      var errors = {}, verifiedData = {};
      for(var i in data){

          var value = data[i].value;
          var type = data[i].type;

          if(type == 'number' && isNaN(parseFloat(value))) errors[i] = "required";
          else if ((type != 'number' && type != 'boolean') && value.trim() == '') errors[i] = "required";
          else if(type == 'boolean' && typeof(value) !== "boolean") errors[i] = "bad_data";

          if(type == 'email' && errors[i] == undefined){
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(!re.test(value)) errors[i] = "incorrect_format";
          }

          if(errors[i] == undefined) verifiedData[i] = value;
          else errors[i] = this.getError({key: i, slug: errors[i]});

      }
      if(Object.keys(errors).length == 0) errors = false;
      return {errors: errors, data: verifiedData};
    };

    this.checkApiErrors = function(error){
      if(error.statusCode == 400){
        if(error.validation.length > 0){
          var errorStrings = [];
          for(var i = 0, length = error.validation.length; i < length; i++){
            var err = error.validation[i];
            var type = "unknown";
            if(err.type == "string.min") type = "min";
            else if (err.type == "string.max") type = "max";
            else if (err.type == "string.email") type = "incorrect_format";
            else if(err.type == "any.required") type = "required";
            else if(err.type == "number.positive") type = "positive";

            var errorString = this.getError({key: err.context.key, slug: type});
            if(type == "max" || type == "min") errorString = errorString.replace("<<LIMIT>>", err.context.limit);
            errorStrings.push(errorString);
          }
          return errorStrings;
        }
        else{
          var errorString = this.getError({key: 'bad_request', slug: error.message});
          if(errorString == undefined) return [this.getError({key: 'bad_request', slug: 'unknown'})];
          else return [errorString];
        }
      }
      else if(error.statusCode == 401){
        var key = 'forbidden';
        if(error.message == "Invalid token" || error.message == "Invalid token format") var slug = 'token';
        else if(error.message == "Invalid credentials") var slug = 'credentials';
        else var slug = 'unknown';

        return [this.getError({key: 'forbidden', slug: slug})];
      }
      else if(error.statusCode == 409){
        return [this.getError({key: 'conflict', slug: error.message})];
      }
      else if(error.statusCode == 404){
        return [this.getError({key: 'not_found', slug: error.message})];
      }
    };

    this.getError = function(error){
      return this.errorStrings[error.key][error.slug];
    },
    this.historyBack = function(){
      $window.history.back();
    }
    return this;
  });
