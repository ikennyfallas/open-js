/**
 * Tencent weibo javascript library
 *
 * Token management
 *
 * @author michalliu
 * @version 1.0
 * @package core
 * @module token
 * @requires base
 * @includes util.queryString
 *           util.cookie
 */

QQWB.extend("_token",{
    /**
     * Save access token to cookie
     *
     * @access public
     * @param accessToken {String} access token string
     * @param expireIn {Number} expire after seconds from now
     * @param optUsername {String} username associate with accesstoken
     * @param optNickname {String} nickname associate with accesstoken
     * @return {Object} QQWB object
     */
    setAccessToken: function (accessToken, expireIn, optUsername, optNickname) {

		var _ = QQWB,

		    _b = _.bigtable,

		    _c = _.cookie,

			_t = _.time,

			user;

        user = this.getTokenUser(true);

        _c.set(_b.get("cookie","accesstokenname")

                       ,[accessToken, _t.now() + expireIn * 1000, optUsername || (user && user.name) || "", optNickname || (user && user.nick) || ""].join("|")

                       ,365 * 24 * 3600

                       ,QQWB.bigtable.get("cookie","path")

                       ,QQWB.bigtable.get("cookie","domain")
            );

        return _;
    }

    /**
     * Get access token saved before
     *
     * @access public
     * @param optRaw {Boolean} if set to true, will not consider about accesstoken expiration
     * @return {String|undefined} a string represent access token if available
     */
   ,getAccessToken: function (optRaw) {

        var _ = QQWB,

		    _b = _.bigtable,

		    _c = _.cookie,

			_t = _.time,

			token;

         token = _c.get(_b.get("cookie","accesstokenname"));

         if (token) {

             token = token.split("|",2);

             if (optRaw || parseInt(token[1],10) > _t.now()) {

                 return token[0];

             }

         }

    }

    /**
     * Get user infomation associated with access token
     *
     * @access public
     * @param optRaw {Boolean} if set to true, will not consider about expiration
     * @return {Object|undefined} an user object associated with access token if available
     */
   ,getTokenUser: function (optRaw) {

        var _ = QQWB,

		    _b = _.bigtable,

		    _c = _.cookie,

			_t = _.time,

			token;

         token = _c.get(_b.get("cookie","accesstokenname"));

         if (token) {

             token = token.split("|",4);

             if (optRaw || parseInt(token[1],10) > QQWB.time.now()) {

                 return {

                     name: token[2]

                    ,nick: token[3]

                 };

             }

         }

    }

    /**
     * Clear access token
     *
     * @access public
     * @return {Object} QQWB object
     */
   ,clearAccessToken: function () {

        var _ = QQWB,

		    _b = _.bigtable,

		    _c = _.cookie;

        return _c.del(_b.get("cookie","accesstokenname"),_b.get("cookie","path"),_b.get("cookie","domain"));
    }

    /**
     * Save refresh token to cookie
     *
     * @param refreshToken {String} refresh token string
     * @return {Object} QQWB object
     */
   ,setRefreshToken: function (refreshToken) {

        var _ = QQWB,

		    _b = _.bigtable,

		    _c = _.cookie;

         _c.set(_b.get("cookie","refreshtokenname")

                ,refreshToken

                ,365 * 24 * 3600

                ,_b.get("cookie","path")

                ,_b.get("cookie","domain")
            );

        return _;

    }

    /**
     * Get refresh token saved before
     *
     * @return {String|undefined} a string represent refresh token if available
     */
   ,getRefreshToken: function () {

        return QQWB.cookie.get(QQWB.bigtable.get("cookie","refreshtokenname"));

    }

    /**
     * Clear refresh token
     *
     * @access public
     * @return {Object} QQWB object
     */
   ,clearRefreshToken: function () {

        return QQWB.cookie.del(QQWB.bigtable.get("cookie","refreshtokenname"),QQWB.bigtable.get("cookie","path"),QQWB.bigtable.get("cookie","domain"));

    }

    /**
     * Use refresh token to obtain an access token
     *
     * @access public
     * @param optCallback {Function} callback function when result returned
     */
   ,exchangeForToken: function (optCallback) {

	   var _ = QQWB,

	       _b = _.bigtable,

		   _q = _.queryString,

		   _l = _.log,

		   _i = _.io,

		   _s = _.String,

		   appkey = _b.get("base", "appkey");

       _i.jsonp({

                url: _b.get("uri","exchangetoken")

               ,data: _q.encode({

                          response_type: "token"

                         ,client_id: appkey

                         ,scope: "all"

                         ,state: "1"

                         ,refresh_token: this.getRefreshToken()

                         ,access_token: this.getAccessToken(true)

                      })

       }).success(function (response) {

           var _response = response;

           _s.isString(response) && (response = _q.decode(response));

           if(response.access_token){

               !response.expires_in && _l.error("accesstoken expires_in not returned");

               !response.wb_name && _l.warning("weibo username not retrieved, will not update username");

               !response.wb_nick && _l.warning("weibo nick not retrieved, will not update nick");

               _._token.setAccessToken(response.access_token, parseInt(response.expires_in,10), response.wb_name, response.wb_nick);

               if (response.refresh_token) {

                    _._token.setRefreshToken(response.refresh_token);

               } else {

                   _l.warning("refresh token not retrieved");

               }

               _l.info("exchange token succeed");

           } else if (response.error) {

               _l.error("exchange token error " + response.error );

           } else {

               _l.error("unexpected result returned from server " + _response + " while exchanging for new accesstoken");

           }

       }).error(function (status, statusText) {

           if (status === 404) {

               _l.error("exchange token has failed, script not found");

           } else {

               _l.error("exchange token has failed, " + statusText);

           }

       }).complete(function (arg1, arg2, arg3) {

           optCallback && optCallback(arg1, arg2, arg3);

       });

       return _;

    }

    /**
     * Obtain an access token
     *
     * @access public
     * @param optCallback {Function} callback function when result returned
     */
   ,getNewAccessToken: function (optCallback) {

	   var _ = QQWB,

	       _b = _.bigtable,

		   _q = _.queryString,

		   _l = _.log,

		   _i = _.io,

		   _s = _.String,

		   appkey = _b.get("base", "appkey");

       _i.jsonp({

               url: _b.get("uri","autotoken")

              ,data: _q.encode({

                   response_type: "token"

                  ,client_id: appkey

                  ,scope: "all"

                  ,state: "1"

               })

       }).success(function (response) {

           var _response = response;

           _s.isString(response) && (response = _q.decode(response));

           if(response.access_token){

               !response.expires_in && _l.error("token expires_in not retrieved");

               !response.wb_name && _l.warning("weibo username not retrieved");

               !response.wb_nick && _l.warning("weibo usernick not retrieved");

               _._token.setAccessToken(response.access_token, parseInt(response.expires_in,10), response.wb_name, response.wb_nick);

               if (response.refresh_token) { // which should exists if accesstoken exists

                    _._token.setRefreshToken(response.refresh_token);

               } else {

                   _l.warning("refresh token not retrieved");

               }

               _l.info("retrieve new access token succeed");

           } else if (response.error) {

               _l.error("retrieve new access token error " + response.error );

           } else {

               _l.error("unexpected result returned from server " + _response + " while retrieving new access token");

           }

       }).error(function (status, statusText) {

           if (status === 404) {

               _l.error("get token has failed, script not found");

           } else {

               _l.error("get token failed, " + statusText);

           }

       }).complete(function (arg1, arg2, arg3) {

           optCallback && optCallback(arg1, arg2, arg3);

       });

       return _;
    }

    /**
     * Auto resolve response from server
     *
     * @param responseText {String} the server response
     */
   ,resolveResponse: function (responseText) {
	   var _ = QQWB,

	       _b = _.bigtable,

		   _q = _.queryString,

		   _l = _.log,

		   _s = _.String,

           loginStatus,

           response = _s.isString(responseText) ? _q.decode(responseText) : responseText;

       if (response.access_token) {

           _._token.setAccessToken(response.access_token, parseInt(response.expires_in,10), response.wb_name, response.wb_nick);

           if (response.refresh_token) {

               _._token.setRefreshToken(response.refresh_token);

           } else {

               _l.error("refresh token not retrieved");

           }

           loginStatus = _.loginStatus();

		   if (loginStatus) {

               _l.info("user " + loginStatus.name + " logged in");

               _.trigger(_b.get("nativeevent","userloggedin"),loginStatus);

		   } else {

			   _l.error("resolve response error, loginStatus is " + loginStatus);

		   }

       } else if (response.error) {

           _l.error("login error occurred " + response.error);

           response.message = response.error;

           _.trigger(_b.get("nativeevent","userloginfailed"),response);

       } else {

           _l.error("unexpected result returned from server " + responseText);

           response.message = response.error = "server error";

           _.trigger(_b.get("nativeevent","userloginfailed"),response);
       }

    }

});