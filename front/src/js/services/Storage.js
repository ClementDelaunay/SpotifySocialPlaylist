app.factory('Storage', function() {

    var STORAGE_KEY = 'suw-storage-key',
      _cache = {};


    (function _restore() {
      _cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    })();

    function _save(obj) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    }

    return {

      has: function(key) {
        return !!_cache[key];
      },

      get: function(key) {
        return _cache[key];
      },

      set: function(key, value) {
        _cache[key] = value;
        _save(_cache);
      },

      extend: function(objectKey, object) {
        this.set(
          objectKey,
          angular.extend(
            (this.get(objectKey) || {}),
            object
          )
        );
        _save(_cache);
      },

      delete: function(key) {
        delete _cache[key];
        _save(_cache);
      }

    };

  })
