//* ///////////   ALTERNATIVE GM API   ////////////// */
/*  REQUIRE: USERJS */
/*  założenia: funkcje gm api sa zadeklarowane w bloku z USERJS i kodem userjsu oraz kod userjsa bezpośrednio z nich korzysta, na razie zawsze deklarowane sa wszystkie funkcje gm api */
function GM_getResourceURL(_res_name) /*  full suppurt */
{
 var i;
 for (i = 0; i < USERJS.meta.resource.length; i++)
 {
  if (USERJS.meta.resource[i].name == _res_name)
   break;
 }
 return USERJS.meta.resource[i].url;
}
function GM_getResourceText(_res_name) /*  full suppurt */
{
 var i;
 for (i = 0; i < USERJS.resources.length; i++)
 {
  if (USERJS.resources[i].name == _res_name)
   break;
 }
 if(i === USERJS.resources.length)
  alert('Resource "'+_res_name+'": Not found in meta block');
 else if (USERJS.resources[i].status === 'OK')
  return USERJS.resources[i].text;
 else
  alert('Error when try downloaded resource "'+ _res_name+'": '+USERJS.resource.status);
}
function GM_addStyle(_style) /* full support */
{
 var new_style = document.createElement("style");
 new_style.src = _style.resource_url;
 document.head.appendChild(new_style);
}
window.unsafeWindow = window; /* to do: (pomysł) unsafeWindow w celu ominiecia cross-domain: mozna w getterze/setterze sprawdzać czy jest crossdomain jak tak to dawać warning (zakładanie jeśli crossdomain to w celu ominiecia unsafe.. jest używane */
/* from demo of https://github.com/Rob--W/cors-anywhere/ */
function GM__xhr_onload_handle_and_redirect( /* TO DO: shorten func name*/
 _xhr, /* dane przysyłane wraz otrzymaniem odpowiedzi (onload) */
 _request_data, /* dane requestu wysyłanego - wysyłane do _request_sender */
 _request_sender, /*przyjmuje dane requestu zamieniajac url na cors-anywhere.herokuapp.com*/
 _call_orginal_handler,
 _redirect_count /* do komunikacji z _request_sender (tu interpretowany/modyfikowany, z tamdąd przesyłany tu)*/)
{
 if (_xhr.status === 333)
 {
  _redirect_count = ( typeof _redirect_count === 'undefined')? 1 : _redirect_count+1;
  var url = _xhr.getResponseHeader('Location');
  if (url && _redirect_count <= 10)
  {
   var originalStatus = + (/d+/.exec(_xhr.statusText));
   if (originalStatus === 307 || originalStatus === 308)
   {
    /*  Correctly deal with method-preserving redirects */
    _request_data.url = url;
    _request_sender(_request_data, _redirect_count);
   }
   else
   {
    /*  Otherwise just change to GET */
    _request_data.method = 'GET';
    _request_sender(_request_data, _redirect_count);
   }
  }
  else
  {
   alert('limit redirections excedded'); /*  to do // call onerror ?? */
  }
 }
 else
 {
  return _call_orginal_handler();
 }
}
/*  konwertuje zapytanie GM_xmlhttpRequest na XMLHttpRequest przy czym zastępując url na url dla serwera CORS proxy  */
function GM_xmlhttpRequest(_details, /*for cors-anywhere*/ _redirectCount) /* to do: ew. odpornosc na bledy userjsów*/
{
/*for cors-anywhere*/
/* do przesyłania parametrów tylko wtedy gdy istnieja */
  var xhr = new XMLHttpRequest();
  function get_response_obj(req)
  {
   return {
    finalUrl:'' /* to do */,
    readyState:req.readyState,
    responseHeaders:req.getAllResponseHeaders(),
    responseText:req.responseText,
    status:req.status,
    statusText:req.statusText,
    abort : function() {/*xhr*/this.abort();}
   };
  }
  if(typeof _details.onerror !== 'undefined')xhr.onerror = function () { _details.onerror(get_response_obj(this));};;
  if(typeof _details.onabort !== 'undefined')xhr.onabort = function () { _details.onabort(get_response_obj(this));};;
  if(typeof _details.ontimeout !== 'undefined')xhr.ontimeout = function () { _details.ontimeout(get_response_obj(this));};;
  if (typeof _details.onload === 'undefined' && typeof _details.onreadystatechange === 'undefined' )
  {
   xhr.onload = function()
   {
    var xhr = this;
    return GM__xhr_onload_handle_and_redirect(xhr, _details, GM_xmlhttpRequest, function ()
    {
     return _details.onload(get_response_obj(xhr));
    }, _redirectCount);
   };
  }
  else if (typeof _details.onload !== 'undefined' && typeof _details.onreadystatechange !== 'undefined' )
  {
   xhr.onreadystatechange = xhr.onload = function()
   {
    if(this.readyState == 4)
    {
     var xhr = this;
     return GM__xhr_onload_handle_and_redirect(xhr, _details, GM_xmlhttpRequest, function ()
     {
      var response = get_response_obj(xhr);
      _details.onreadystatechange(response);
      _details.onload(response);
     }, _redirectCount);
    }
    else
    { /*_details.onreadystatechange();*/
    }
   };
  }
  else if (typeof _details.onload !== 'undefined' && typeof _details.onreadystatechange === 'undefined' )
  {
   xhr.onload = function()
   {
    var xhr = this;
    return GM__xhr_onload_handle_and_redirect(xhr, _details, GM_xmlhttpRequest, function ()
    {
     return _details.onload(get_response_obj(xhr));
    }, _redirectCount);
   };
  }
  else if (typeof _details.onload === 'undefined' && typeof _details.onreadystatechange !== 'undefined' )
  {
   xhr.onreadystatechange = function()
   {
    if(this.readyState == 4)
    {
     var xhr = this;
     return GM__xhr_onload_handle_and_redirect(xhr, _details, GM_xmlhttpRequest, function ()
     {
      return _details.onreadystatechange(get_response_obj(xhr));
     }, _redirectCount);
    }
    else
     _details.onreadystatechange();
   };
  }
  if(typeof _details.onprogress !== 'undefined')
   xhr.onprogress = function() {
    var response = get_response_obj(this);
    response.lengthComputable = this.lengthComputable;
    response.loaded = this.loaded;
    response.total = this.total;
    _details.onprogress(response);
   };
  if(typeof _details.overrideMimeType !== 'undefined') xhr.overrideMimeType = _details.overrideMimeType;;
  if(typeof _details.timeout !== 'undefined') xhr.timeout = _details.timeout;;
  function get_url(_org_url)
  {
   var protocol_re = /([a-z]+:)\/\/?(.*)/; /*  [1]-protocol, [2]-rest */
   var protocol = protocol_re.exec(_org_url)[1];
   return protocol+'//cors-anywhere.herokuapp.com/'+_org_url;
  }
  xhr.open(
   _details.method,
   get_url(_details.url),
   (( typeof (_details.synchronous) !== 'undefined') ? (_details.synchronous) : undefined),
   (( typeof (_details.user) !== 'undefined') ? (_details.user) : undefined),
   (( typeof (_details.password) !== 'undefined') ? (_details.password) : undefined)
  );
  for(var header in _details.headers)
   xhr.setRequestHeader(header, _details.headers[header]);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); /*  for cors-anywhere */
  if(typeof _details.binary === 'undefined' || _details.binary === false)
   xhr.send((( typeof (_details.data) !== 'undefined') ? (_details.data) : undefined));
  else if(_details.binary === true)
   xhr.sendAsBinary(_details.data/* ?? */);
  else
   alert('binary: bad value');
  var return_value = get_response_obj(xhr);
  return_value.abort = xhr.abort;
  return return_value;
}
/*  from http://userscripts.org/scripts/show/59373 */
var GM_getValue;
var GM_setValue;
/*----- GM_getValue ------*/
if (typeof window.localStorage == "object")
{
 GM_getValue = function(key, defaultValue)
 {
  var value = window.localStorage.getItem(key);
  if (value == null)
   value = defaultValue;
  else if (value == 'true')
   value = true;
  else if (value == 'false')
   value = false;
  return value;
 };
}
else
{
 alert('get value error');
 // TO DO: '//' w bookmarklecie jednolinijkowym może przeszkadzać
 // GM_getValue = function(cookieName, oDefault)
 // {
  // var cookieJar = document.cookie.split("; ");
  // for (var x = 0; x < cookieJar.length; x++)
  // {
   // var oneCookie = cookieJar[x].split("=");
   // if (oneCookie[0] == escape(cookieName))
   // {
    // try
    // {
     // eval('var footm = ' + unescape(oneCookie[1]));
    // }
    // catch (e)
    // {
     // return oDefault;
    // }
    // return footm;
   // }
  // }
  // return oDefault;
 // };
}
/*----- GM_setValue ------*/
if (typeof window.localStorage == "object")
{
 GM_setValue = function(key, value)
 {
  window.localStorage.setItem(key, value);
 };
}
else
{
 alert('get value error');
 // function getRecoverableString(oVar, notFirst)
 // {
  // var oType = typeof(oVar);
  // if ((oType == 'null') || (oType == 'object' && !oVar))
  // {
   // /* most browsers say that the typeof for null is 'object', but unlike a real */
   // /* object, it will not have any overall value */
   // return 'null';
  // }
  // if (oType == 'undefined')
  // {
   // return 'window.uDfXZ0_d';
  // }
  // if (oType == 'object')
  // {
   // /* Safari throws errors when comparing non-objects with window/document/etc */
   // if (oVar == window)
   // {
    // return 'window';
   // }
   // if (oVar == document)
   // {
    // return 'document';
   // }
   // if (oVar == document.body)
   // {
    // return 'document.body';
   // }
   // if (oVar == document.documentElement)
   // {
    // return 'document.documentElement';
   // }
  // }
  // if (oVar.nodeType && (oVar.childNodes || oVar.ownerElement))
  // {
   // return '{error:\'DOM node\'}';
  // }
  // if (!notFirst)
  // {
   // Object.prototype.toRecoverableString = function (oBn)
   // {
    // if (this.tempLockIgnoreMe)
    // {
     // return '{\'LoopBack\'}';
    // }
    // this.tempLockIgnoreMe = true;
    // var retVal = '{',
    // sepChar = '',
    // j;
    // for (var i in this)
    // {
     // if (i == 'toRecoverableString' || i == 'tempLockIgnoreMe' || i == 'prototype' || i == 'constructor')
     // {
      // continue;
     // }
     // if (oBn && (i == 'index' || i == 'input' || i == 'length' || i == 'toRecoverableObString'))
     // {
      // continue;
     // }
     // j = this[i];
     // if (!i.match(basicObPropNameValStr))
     // {
      // /* for some reason, you cannot use unescape when defining peoperty names inline */
      // for (var x = 0; x < cleanStrFromAr.length; x++)
      // {
       // i = i.replace(cleanStrFromAr[x], cleanStrToAr[x]);
      // }
      // i = '\'' + i + '\'';
     // }
     // else if (window.ActiveXObject && navigator.userAgent.indexOf('Mac') + 1 && !navigator.__ice_version && window.ScriptEngine && ScriptEngine() == 'JScript' && i.match(/^\d+$/))
     // {
      // /* IE mac does not allow numerical property names to be used unless they are quoted */
      // i = '\'' + i + '\'';
     // }
     // retVal += sepChar + i + ':' + getRecoverableString(j, true);
     // sepChar = ',';
    // }
    // retVal += '}';
    // this.tempLockIgnoreMe = false;
    // return retVal;
   // };
   // Array.prototype.toRecoverableObString = Object.prototype.toRecoverableString;
   // Array.prototype.toRecoverableString = function ()
   // {
    // if (this.tempLock)
    // {
     // return '[\'LoopBack\']';
    // }
    // if (!this.length)
    // {
     // var oCountProp = 0;
     // for (var i in this)
     // {
      // if (i != 'toRecoverableString' && i != 'toRecoverableObString' && i != 'tempLockIgnoreMe' && i != 'prototype' && i != 'constructor' && i != 'index' && i != 'input' && i != 'length')
      // {
       // oCountProp++;
      // }
     // }
     // if (oCountProp)
     // {
      // return this.toRecoverableObString(true);
     // }
    // }
    // this.tempLock = true;
    // var retVal = '[';
    // for (var i = 0; i < this.length; i++)
    // {
     // retVal += (i ? ',' : '') + getRecoverableString(this[i], true);
    // }
    // retVal += ']';
    // delete this.tempLock;
    // return retVal;
   // };
   // Boolean.prototype.toRecoverableString = function ()
   // {
    // return '' + this + '';
   // };
   // Date.prototype.toRecoverableString = function ()
   // {
    // return 'new Date(' + this.getTime() + ')';
   // };
   // Function.prototype.toRecoverableString = function ()
   // {
    // return this.toString().replace(/^\s+|\s+$/g, '').replace(/^function\s*\w*\([^\)]*\)\s*\{\s*\[native\s+code\]\s*\}$/i, 'function () {[\'native code\'];}');
   // };
   // Number.prototype.toRecoverableString = function ()
   // {
    // if (isNaN(this))
    // {
     // return 'Number.NaN';
    // }
    // if (this == Number.POSITIVE_INFINITY)
    // {
     // return 'Number.POSITIVE_INFINITY';
    // }
    // if (this == Number.NEGATIVE_INFINITY)
    // {
     // return 'Number.NEGATIVE_INFINITY';
    // }
    // return '' + this + '';
   // };
   // RegExp.prototype.toRecoverableString = function ()
   // {
    // return '\/' + this.source + '\/' + (this.global ? 'g' : '') + (this.ignoreCase ? 'i' : '');
   // };
   // String.prototype.toRecoverableString = function ()
   // {
    // var oTmp = escape(this);
    // if (oTmp == this)
    // {
     // return '\'' + this + '\'';
    // }
    // return 'unescape(\'' + oTmp + '\')';
   // };
  // }
  // if (!oVar.toRecoverableString)
  // {
   // return '{error:\'internal object\'}';
  // }
  // var oTmp = oVar.toRecoverableString();
  // if (!notFirst)
  // {
   // /* prevent it from changing for...in loops that the page may be using */
   // delete Object.prototype.toRecoverableString;
   // delete Array.prototype.toRecoverableObString;
   // delete Array.prototype.toRecoverableString;
   // delete Boolean.prototype.toRecoverableString;
   // delete Date.prototype.toRecoverableString;
   // delete Function.prototype.toRecoverableString;
   // delete Number.prototype.toRecoverableString;
   // delete RegExp.prototype.toRecoverableString;
   // delete String.prototype.toRecoverableString;
  // }
  // return oTmp;
 // }
 // GM_setValue = function(cookieName, cookieValue, lifeTime)
 // {
  // if (!cookieName)
  // {
   // return;
  // }
  // if (lifeTime == "delete")
  // {
   // lifeTime = -10;
  // }
  // else
  // {
   // lifeTime = 31536000;
  // }
  // document.cookie = escape(cookieName) + "=" + escape(getRecoverableString(cookieValue)) +
   // ";expires=" + (new Date((new Date()).getTime() + (1000 * lifeTime))).toGMTString() + ";path=/";
 // };
}
function GM_registerMenuCommand(caption, commandFunc, accessKey) {}
function GM_info() {}
function GM_log(message)
{
 console.log("BOOKMARKLET \"" + USERJS.meta.name + "\": " + message);
}
function GM_openInTab( url ) /*  partially support */
{
 return window.open(url); /*  zależnie od ustawień przeglądarki otwiera w nowej karcie, oknie, ... */
}
