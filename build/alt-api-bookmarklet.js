/* funkcja core uruchamiana w bookmarklecie */
function bookmarklet(USERJS)
{
function randomString(length, chars)
{
 var result = '';
 for (var i = length; i > 0; --i)
  result += chars[Math.round(Math.random() * (chars.length - 1))];
 return result;
}
/* JSON sending to callback functions:

{

    "contents": "..."

    "status": {

        "url": "http://translate.google.com/",

        "content_type": "text/html; charset=ISO-8859-1",

        "http_code": 200

    }

}

*/
function get_file_by_jsonp(_url, _call_success, _call_failed, _attempts_number)
{
 /* get callback name */
 var callback_name;
 do {
  var callback_name = "callback_"+randomString(5, 'abcdefghijklmnopqrstuvwxyz');
 } while ( typeof window[callback_name] !== 'undefined' );
 /* callback function */
 window[callback_name] = function(_data)
 {
  var http_error_code = _data.status.http_code;
  switch(http_error_code)
  {
  case 200:
   _call_success(_data);
   break;
  default:
   if(attempts_number > 0) /*try again*/
   {
    attempts_number--;
    get_file_by_jsonp(_url, _call_success, _call_failed, _attempts_number);
   }
   else
   {
    call_failed(_data);
   }
   break;
  }
 };
 /* send jsonp request */
 var new_script = document.createElement("script");
 new_script.src = 'http://whateverorigin.org/get?url=' + encodeURIComponent(_url) + '&callback='+callback_name;
 document.head.appendChild(new_script);
}
 /* Require: USERJS */
/* BUG przekierowywuje corsproxy.com/... --> raw.github.com/... */
function load_script(_win, _url)
{
 var new_script = _win.document.createElement('script');
 new_script.src = _url;
 _win.document.head.appendChild(new_script);
 return new_script;
}
function call_func_when_processed_all(to_processed_array, to_run_next, _start_counting) /* start counting=true MUSI wystapic */
{
 if (typeof _start_counting !== 'undefined' && _start_counting === true) /*  variable with default value */
  call_func_when_processed_all . loaded_counter = 0;
 else
  call_func_when_processed_all . loaded_counter++; /* static variable */
 if (call_func_when_processed_all . loaded_counter === to_processed_array.length)
  to_run_next();
}
/*  to do: gdy niepowodzenie wczytania resource, require */
function download_file(_url, _callback_success) /*  ew. TO DO: nie wiem czy corsproxy bedzie działać z ftp */
{ /* TO DO: corsproxy miał problemy z protokołem https (przy https://raw.github.com )*/
 var xhr = new XMLHttpRequest();
 var protocol_re = /([a-z]+:\/\/)?(.*)/; /*  [1]-protocol, [2]-rest */
 var re_result = protocol_re.exec(_url);
 var url_get = "http://www.corsproxy.com/" + re_result[2];
 xhr.onload = function () /*  readyState == 4 and success */
 {
  switch(this.status)
  {
  case 200:
   _callback_success(this.responseText);
   break;
  default:
   alert(url_get+"\n" + this.status + " " + this.statusText);
  }
 };
 xhr.onerror = function () /*  readystate == 4 , error network level  or  cross-domain error */
 {
  alert(url_get+"\n"+"onerror"); /*  to do */
 };
 xhr.open("GET", url_get, /* async = */ true);
 xhr.send();
}
function userjs_init(_win, _userjs_source)
{ /* zał: gm_api, userjs - wczytywane jako string - sposob na izolacje zmiennej USERJS i dostep do niej z gm api (i z kolei gm_api z userjs) */
 function load_userjs()
 {
  get_file_by_jsonp(
   "https://raw.github.com/piotrex/Bookmarkleter/unstable/build/alt-api.js",
   function(data)
   {
    var api_functions = data.contents;
    var script_to_loaded = '(function(){' + 'var USERJS=' + JSON.stringify(USERJS) + ';' + api_functions + _userjs_source + '})();';
    /*alert(script_to_loaded);*/
    eval(script_to_loaded);
   },
   function(data)
   {
    alert("load " + data.status.url + "\n" + data.status.httpcode);
   },
   3
  );
 }
/*  zał: wczytywane asynchronicznie (bo wydajnosć) */
 function load_resources() /*  .. i poźniej userjs */
 {
  USERJS.resources = [];
  call_func_when_processed_all(USERJS.meta.resource, load_userjs, /* _start_counting = */ true);
  for (var i = 0; i < USERJS.meta.resource.length; i++)
  {
   download_file(
    USERJS.meta.resource[i].url,
    function download_handler(_data)
    {
     if (typeof USERJS.resources_counter == 'undefined')
      USERJS.resources_counter = 0;
     USERJS.resources.push({"name": USERJS.meta.resource[ USERJS.resources_counter ++ ].name, "text": _data, "status": 'OK'}) ;
     call_func_when_processed_all( USERJS.meta.resource, load_userjs);
    });
  }
 }
/*  zał: requiresy wczytywane jako <script src=..> + event przy wczytywaniu (by wykorzystywać cache) */
 call_func_when_processed_all(USERJS.meta.require, load_resources, /* _start_counting = */ true);
 var loaded_require;
 for (var i = 0; i < USERJS.meta.require.length; i++)
 {
  loaded_require = (load_script(_win, USERJS.meta.require[i])); /*  ew. bug: 1.wczyt script 2. dodanie event listenera 3. wykona sie event?? */
  loaded_require.addEventListener('load', /*  TO DO: wsparcie dla IE (to nie dla IE) */
   function(){
    call_func_when_processed_all(USERJS.meta.require, load_resources);
   }, false);
 }
}
/*  BUG wait_for_loading */
/*  REQUIRE: userjs_init, USERJS */
/*  ew. TO DO: zapewnienie cichej aktualizacji bookmarkletów (by nie trzebabyło ich reistalować) */
function main() /*  uruchomienie bookmarkletu */
{/*  to do: lepsza nazwa userjs source */
 get_file_by_jsonp(
  USERJS.userjs_url,
  function(_data)
  {
   var source_of_userjs = _data.contents;
   userjs_init(window, source_of_userjs);
   var win_frame, success, checker;
   for (var i = 0; i < window.frames.length; i++)
   {
    try {
     win_frame = window.frames[i];
     /*  access to document denied when frame is other domain */
     checker = win_frame.document.location; /*  check access permissions	 */
     success = true;
    }
    catch (ex){
     success=false;
    }
    if(success)
     userjs_init(win_frame, source_of_userjs); /*  tekst jest przekazywany jako referencja */
   }
  },
  function(data)
  {
   alert("error download file " + data.status.url + "\n" + data.status.httpcode);
   throw null;
  },
  5 /* uso often errors happens*/
 );
}
 main();
}
