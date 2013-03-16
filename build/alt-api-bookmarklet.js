function bookmarklet(USERJS)
{
 /* Require: USERJS */
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
{
 var xhr = new XMLHttpRequest();
 var protocol_re = /([a-z]+:\/\/)?(.*)/; /*  [1]-protocol, [2]-rest */
 var re_result = protocol_re.exec(_url);
 var url_get = "http://www.corsproxy.com/" + re_result[2];
 xhr.onload = function () /*  readyState == 4 and success */
 {
  if(this.status == 200)
   _callback_success(this.responseText);
 };
 xhr.onerror = function () /*  readystate == 4 , error network level  or  cross-domain error */
 {
  alert("onerror"); /*  to do */
 };
 xhr.open("GET", url_get, /* async = */ true);
 xhr.send();
}
function userjs_init(_win, _userjs_source)
{ /* zał: gm_api, userjs - wczytywane jako string - sposob na izolacje zmiennej USERJS i dostep do niej z gm api (i z kolei gm_api z userjs) */
 function load_userjs()
 {
  download_file("https://raw.github.com/piotrex/Bookmarkleter/unstable/build/alt-api.js", function(api_functions)
  {
   var script_to_loaded = '(function(){' + 'var USERJS=' + JSON.stringify(USERJS) + ';' + api_functions + _userjs_source + '})();';
   /*alert(script_to_loaded);*/
   eval(script_to_loaded);
  });
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
{/*  to do: lepsza nazwa userjs source; obsługa błędu pobrania, reakcja na pobranie;  */
 window.catch_downloaded_file = function(_data)/*  wykonywane po próbie pobrania */
 {
  if(typeof catch_downloaded_file.counter === 'undefined')
   catch_downloaded_file.counter = 1;
  else
   catch_downloaded_file.counter ++;
  var http_error_code = _data.status.http_code;
  switch(http_error_code)
  {
  case 200:
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
  break;
  default: /* often error on uso */
   if(catch_downloaded_file.counter <= 10) /*try again*/
   {
    var new_script = document.createElement("script");
    new_script.src = 'http://whateverorigin.org/get?url=' + encodeURIComponent(USERJS.userjs_url) + '&callback=catch_downloaded_file';
    document.head.appendChild(new_script);
   }
   else
   {
    alert('error download file '+USERJS.userjs_url+' \n '+ http_error_code);
    throw null;
   }
  break;
  }
 };
 var new_script = document.createElement("script");
 new_script.src = 'http://whateverorigin.org/get?url=' + encodeURIComponent(USERJS.userjs_url) + '&callback=catch_downloaded_file';
 document.head.appendChild(new_script);
}
 main();
}
