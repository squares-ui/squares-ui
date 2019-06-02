function classOf(o){
    if(o === null) return "Null";
    if(o === undefined) return "Undefined";
    return Object.prototype.toString.call(o).slice(8,-1);
}

function ISNAN(num){
  // IsNaN double negative
  if (num === parseInt(num, 10))
    return false
  else
    return true
}

// quick dirty debug
function qq(log){
	console.log("          "+JSON.stringify(log));
	
}

// internal syslog level
function ww(level, log){
	var seperator = "||";
	if(level <= GLB.qqLogging){
		console.log("          ("+qqLoggingDesc[level]+") "+JSON.stringify(log));
	}
}
// logs functions calling functions
function ee(log){
//	console.log(JSON.stringify(log));
	console.log(log);
}

// Stringify that can handle nested things
function simpleStringify (object){
    var simpleObject = {};
    for (var prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue;
        }
        if (typeof(object[prop]) == 'object'){
            continue;
        }
        if (typeof(object[prop]) == 'function'){
            continue;
        }
        simpleObject[prop] = object[prop];
    }
    return JSON.stringify(simpleObject); // returns cleaned up JSON
};




// Sort the data array, used mostly for initial_data that is async order
function sortFunction(a, b) {
	if (a[0] === b[0]) {
		return 0;
	}
	else {
		return (a[0] < b[0]) ? -1 : 1;
	}
}
function epochtostring(epoch){
	var d = new Date(epoch);
	return d.toLocaleString();
}

function sort_unique(arr){
    var hash = {}, result = [];
    for ( var i = 0, l = arr.length; i < l; ++i ) {
        if ( !hash.hasOwnProperty(arr[i]) ) { //it works with objects! in FF, at least
            hash[ arr[i] ] = true;
            result.push(arr[i]);
        }
    }
    return result;
}


ipSort = function( ipAddressArray ){
	return ipAddressArray.sort( function( a, b )
	{
		a = a.split( '.' );
		b = b.split( '.' );
		for( var i = 0; i < a.length; i++ )
		{
			if( ( a[i] = parseInt( a[i] ) ) < ( b[i] = parseInt( b[i] ) ) )
				return -1;
			else if( a[i] > b[i] )
				return 1;
		}
		return 0;
	} );
}


function getCookie(c_name) {
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1) {
				c_end = document.cookie.length;
			}
			return unescape(document.cookie.substring(c_start, c_end));
		}
	}
	return "";
}

// get url param 'name', used to know which file to fetch
$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (results==null){
	   return null;
	}
	else{
	   return results[1] || 0;
	}
}


function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function countSeconds(i){
	i = Math.abs(i);

	var day = (60*60*24);
	var hour = (60*60);
	var minute = 60;
	var second = 1;

	var days = Math.floor(i/day);
	var hours = Math.floor((i-(day*days))/hour);
	var minutes = Math.floor((i - (day*days) - (hour*hours))/minute);
	var seconds = Math.floor(i - (day*days) - (hour*hours) - (minute*minutes));

	var toReturn = "";

	if(days>0){
		toReturn += days+"d "+hours+"h ";
	}else if(hours>0){
		toReturn += hours+"h ";
	}else if(minutes>0){
		toReturn += minutes+"m "+seconds+"s ";
	}else if(seconds>0){
		toReturn += seconds+"s ";
	}else if(i == 0){
		toReturn = "0"
	}
	
	return toReturn;
}


			
function countBytes(i){
	i = Math.abs(i);

	var B = 1;
	var KB = B * 1024;
	var MB = KB * 1024;
	var GB = MB * 1024;
	var PB = GB * 1024;



	var PBs = Math.floor(i/PB);
	var GBs = Math.floor((i - (PB*PBs))/GB);
	var MBs = Math.floor((i - (PB*PBs) - (GB*GBs))/MB);
	var KBs = Math.floor((i - (PB*PBs) - (GB*GBs) - (MB*MBs))/KB);
	var Bs  = Math.floor((i - (PB*PBs) - (GB*GBs) - (MB*MBs) - (KB*KBs)));

	var toReturn = "";

	if(PBs>0){
		return PBs+"PB "+GBs+"GB";
	}else if(GBs>0){
		return GBs+"GB ";
	}else if(MBs>0){
		return MBs+"MB ";
	}else if(KBs>0){
		return KBs+"KB ";
	}else{
		return Bs+"B";
	}
}


			
//http://codeaid.net/javascript/convert-size-in-bytes-to-human-readable-format-(javascript)#comment-1
function stringToBytes(bytes, precision){  
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;
   
    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';
 
    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';
 
    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' MB';
 
    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';
 
    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';
 
    } else {
        return bytes + ' B';
    }
}

//http://stackoverflow.com/questions/4816099/chrome-sendrequest-error-typeerror-converting-circular-structure-to-json
function censor(censor) {
  var i = 0;

  return function(key, value) {
    if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
      return '[Circular]'; 

    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';

    ++i; // so we know we aren't using the original object anymore

    return value;  
  }
}


//http://stackoverflow.com/questions/14962018/detecting-and-fixing-circular-references-in-javascript
function isCyclic (obj) {
  var seenObjects = [];

  function detect (obj) {
    if (obj && typeof obj === 'object') {
      if (seenObjects.indexOf(obj) !== -1) {
        return true;
      }
      seenObjects.push(obj);
      for (var key in obj) {
        if (obj.hasOwnProperty(key) && detect(obj[key])) {
          console.log(obj, 'cycle at ' + key);
          return true;
        }
      }
    }
    return false;
  }

  return detect(obj);
}

function getOffset(el) {
    el = el.getBoundingClientRect();
    return {
        left: el.left,
        top: el.top,
	right: el.right,
	bottom: el.bottom,
	width: el.right - el.left,
	height: el.bottom - el.top
    }
}


// https://gist.github.com/syntagmatic/4076122#file_burrow.js
var burrow = function(table) {
  // create nested object
  var obj = {};
  table.forEach(function(row) {
    // start at root
    var layer = obj;

    // create children as nested objects
    row.taxonomy.forEach(function(key) {

	 layer[key] = key in layer ? layer[key] : {};

	 layer = layer[key];

	});
  });

  // recursively create children array
  var descend = function(obj, depth) {
    var arr = [];
    var depth = depth || 0;
    for (var k in obj) {
	  var child = {
        name: k,
        depth: depth,
        children: descend(obj[k], depth+1)
      };
      arr.push(child);
    }
    return arr;
  };

  // use descend to create nested children arrys

  return {
    name: "root",
    children: descend(obj, 1),
    depth: 0
  }
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

//https://bl.ocks.org/EfratVil/99462577a475bbad4be1146caca75a58
function Random_normal_Dist(mean, sd) {
	data = [];
	for (var i = mean - 4 * sd; i < mean + 4 * sd; i += 1) {
		q = i
		p = jStat.normal.pdf(i, mean, sd);
		arr = {
			"q": q,
			"p": p
		}
		data.push(arr);
	};
	return data;
}