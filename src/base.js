/**
 * Tencent weibo javascript library
 *
 * Provide the namespace with some core methods
 *
 * @author michalliu
 * @version 1.0
 * @module base
 */

/**
 * Constructor of SDK's error object
 *
 * Usage:
 *
 * throw QQWBError("message")
 *
 * //TODO: should we only export one variable in global namespace
 *
 * @access public
 *
 * function QQWBError(message) {
 *     this.message = message;
 *     this.stack = (new Error()).stack;
 * }
 * 
 * QQWBError.prototype = new Error;
 * QQWBError.prototype.name = "QQWBError";
 */

// base file
(function () {

    var 
        twb, // the internal namespace object
        originalT = window.T; // get a reference of window's T

    // Core base object
    twb = {

        /**
         * Human readable name for this sdk
         *
         * Used for debug propose
         *
         * @access private
         */
        _name: "Tencent weibo SDK",
        /**
         * Client appkey
         *
         * @access private
         */
        _appkey: "{APPKEY}"

        /**
         * Indicate appkey is valid or not
         *
         * Is the http referer matched with the url registered by this appkey?
         * If appkey is not verified,you may not use this sdk
         *
         * @access private
         */
       ,_appkeyVerified: "{APPKEY_VERIFIED}" === "verified" // validate appid with referer url

        /**
         * Debug mode
         *
         * Speak pointless babble
         *
         * @access private
         */
       ,_debug: true

        /**
         * Domain configration
         *
         * @access private
         */
       ,_domain: {
           api: "{API_URI}"
          ,cdn: "{CDN_URI}"
          ,auth: "{AUTH_URI}"
          ,exchange: "{EXCHANGE_TOKEN_URI}"
          ,query: "{QUERY_TOKEN_URI}"
          ,clientproxy: "{CLIENTPROXY_URI}" // auth redirect_url
          ,serverproxy: "{SERVERPROXY_URI}" // server html proxy
          ,flashproxy: "{FLASHPROXY_URI}" // flash proxy
        }
        /**
         * Cookie configration
         *
         * @access private
         */
       ,_cookie: {
           names: {
               accessToken: "QQWBToken"
              ,refreshToken: "QQWBRefreshToken"
           }
          ,path: "/"
          ,domain: ""
        }
        /**
         * Rollback window's T to its original value
         *
         * @access public
         * @return {Object} The internal twb object
         */
       ,noConflict: function () {
           originalT && (window.T = originalT);
           return twb;
       }

        /**
         * Copy things from source into target
         *
         * @access public
         * @return {Object} The *modified* target object
         */
       ,copy: function (target, source, overwrite, transform) {
           for (var key in source) {
               if (overwrite || typeof target[key] === "undefined") {
                   target[key] = transform ? transform(source[key]) : source[key];
               }
           }
           return target;
       }

        /**
         * Create sub namespace
         *
         * @access public
         * @return {Object} The created object 
         */
       ,create: function (name, value) {
           var 
               node = this, // this is our root namespace
               nameParts = name ? name.split(".") : [],
               c = nameParts.length;
           for (var i=0; i<c; i++) {
               var
                   part = nameParts[i],
                   nso = node[part];
               if (!nso) {
                   nso = (value && i + 1 === c) ? value : {};
                   node[part] = nso;
               }
               node = nso;
           }
           return node;
       }

        /**
         * Extends root namespace and create sub namespace if needs
         *
         * @access public
         * @return {Object} The *modified* target
         */
       ,extend: function (target, source, overwrite) {
           return twb.copy(
               typeof target === 'string' ? twb.create.call(this, target) : target
              ,source
              ,overwrite
           );
       }

       /**
        * Alias names
        *
        * @access private
        * @return {Void}
        */
       ,_alias: function (alias, origin) {
           origin = origin || twb;
           if(typeof alias === 'string') {
               this[alias] = origin;
           } else if (typeof alias === 'object' && alias.constructor === Array) {
               for (var i=0,l=alias.length;i<l;i++) {
                   this[alias[i]] = origin;
               }
           }
       }

       /**
        * Alias names for twb
        *
        * @deprecated not recommended
        * @access public
        * @return {Void}
        */
       ,alias: function (alias, origin) {
           twb._alias(alias, twb[origin]);
       }

       /**
        * Assign template vars with value
        *
        * Usage:
        *
        * 1). replace T._appkey from "{APPKEY}" to "123456"
        *     T.assign("_appkey","APPKEY","123456")
        * 
        * 2). search in namespace T replace all from "{APPKEY}" to "123456"
        *     T.assign("","APPKEY","123456")
        *
        * 3). replace T.test._appkey from "{APPKEY}" to "123456"
        *     T.assign("test._appkey","APPKEY","123456")
        * 
        * 4). search in namespace T.test replace all from "{APPKEY}" to "123456"
        *     T.assign("test","APPKEY","123456")
        *
        * @deprecated render template vars by js
        * @access public
        * @param name {String} namespace
        * @param replace {String} template vars
        * @param value {String} replaced value
        * @return {Void}
        * @throws {Error}
        */
       ,assign: function (name, key, value) {
            var
                node = this,
                lastNode = node,
                nameParts = name ? name.split(".") : [],
                c = nameParts.length;

            for (var i=0; i<c; i++) {
                var
                    part = nameParts[i],
                    nso = node[part];
                if (!nso) { // should we use break here?
                    throw new Error("Tencent weibo SDK: [ERROR] no such name " + part);
                }
                lastNode = node;
                node = nso;
            }

            // node is either value of name or namespace
            if (typeof node === "string") { // value goes here
                lastNode[part] = node.replace(new RegExp("\\{" + key + "\\}","ig"),value);
            } else if (typeof node === "object") { // namespace object goes here
                for (var prop in node) {
                    if (node.hasOwnProperty(prop) && typeof node[prop] === "string") {
                        node[prop] = node[prop].replace(new RegExp("\\{" + key + "\\}","ig"),value);
                    }
                }
            }
       }

        /**
         * Generate a random id
         *
         * @access public
         * @return {String} The ramdom ID
         */
       ,uid: function () {
           return Math.random().toString(16).substr(2);
       }

    };

    // alternative names for interal function
    twb.alias('provide','create'); // provide a specific function
    
    // expose variable
    twb._alias.call(window,["QQWB","T"],twb); // we probably should only export one global variable

    twb.assign("_domain","API_URI","http://test.svr.net/apphost/oauth/api.php"); // no trailer slash   
    twb.assign("_domain","AUTH_URI","http://test.svr.net/apphost/oauth/authorize.php");   
    twb.assign("_domain","EXCHANGE_TOKEN_URI","http://test.svr.net/apphost/oauth/exchangeToken.php");   
    twb.assign("_domain","QUERY_TOKEN_URI","http://test.svr.net/apphost/oauth/queryToken.php");   
    twb.assign("_domain","SERVERPROXY_URI","http://test.svr.net/apphost/proxy/proxy.html");   
    twb.assign("_domain","FLASHPROXY_URI","http://test.svr.net/apphost/proxy/proxy.swf");   

}());