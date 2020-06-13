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






//https://stackoverflow.com/questions/11616630/how-can-i-print-a-circular-structure-in-a-json-like-format
const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key, value) => {
	  if (typeof value === "object" && value !== null) {
		if (seen.has(value)) {
		  return;
		}
		seen.add(value);
	  }
	  return value;
	};
  };
// quick dirty debug
function qq(log){
  //console.log("          "+JSON.stringify(log));
  console.log("          "+JSON.stringify(log, getCircularReplacer()));
	
}


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

// follows syslog levels.  i.e. 0=Emergency -> 7=Debug
var qqLoggingDesc = ["EMERGCY", "Alert  ", "Critical", "Error ", "Warning", "Notice ", "Info   ", "Debug  "];
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
function Random_normal_Distoo(mean, sd, deviations) {
  
  
  data = [];
	for (var i = mean - deviations * sd; i < mean + deviations * sd; i += 1) {
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

// https://stackoverflow.com/questions/4025893/how-to-check-identical-array-in-most-efficient-way
function arraysEqual(arr1, arr2) {
  if(arr1.length !== arr2.length)
      return false;
  for(var i = arr1.length; i--;) {
      if(arr1[i] !== arr2[i])
          return false;
  }

  return true;
}

//https://stackoverflow.com/questions/4391575/how-to-find-the-size-of-localstorage
function localStorageSpace(){
  var allStrings = '';
  for(var key in window.localStorage){
      if(window.localStorage.hasOwnProperty(key)){
          allStrings += window.localStorage[key];
      }
  }
  return allStrings ? 3 + ((allStrings.length*16)/(8*1024)) + ' KB' : 'Empty (0 KB)';
};


//https://stackoverflow.com/questions/20913689/complex-d3-nest-manipulation/61403767#61403767
function arrayOfArrayToFlareChildren(data, root, scale){
  // IN
  // data : array of arrays to flare  e.g. [["Mondays", "Sunny"], ["Mondays", "Rainy"], ["Tuesdays", "Rainy"]]
  // root : basic object to start with, typically {"name":"", "children":[]}

  // realSize = the real count
  // size (aka value) = the real count that has been linear/log/inverse from realSize, this value is used in D3/SQUARES rendering
  


  //var root = {"name":"", "children":[]} // the output
	var node
	var row
  var qqq = false

  qqq && qq("#######")


	for(var i=0;i<data.length;i++){
    qqq && qq("#####")
    
    row = data[i];
    node = root;  // for each row start at the beginning?
    
		for(var j=0;j<row.length;j++){
      qqq && qq("###")

      
      
      if (typeof row[j] !== 'undefined' && row[j] !== null) {
				attribute = row[j]
			}else{
				attribute = "null"
			}

      qqq && qq("fld - "+j +": "+attribute)

			if(_.where(node.children, {name:attribute}) == false  ){
				qqq && qq("not found: "+attribute)
				
				if(j < row.length -1){
					var oobj = {"name":attribute, "children":[] }
					node.children.push(oobj)
					node = node.children[node.children.length-1]
				}else{
					// last attribute, set to value1, or increment
          // linear = 1, log(1) = 1, 1/1 = 1.... so regardesss, start at 1
          node.children.push({"name":attribute, "realSize": 1, "size":1 })
				}
        

			}else{
        qqq && qq("found: "+attribute)

        // this one exists, but where?
        found = false
				pos = 0

				for(var k=0;k< node.children.length ;k++){
					if(node.children[k]['name'] == attribute){
						pos = k
            found = true
            qqq && qq("attribute: "+attribute+" found at pos:"+pos )
            qqq && qq(root)
            break
					}
				}

				if(!node.children[pos]['children']){      
          qqq && qq(node.children[pos]['size']+" => "+parseInt(node.children[pos]['size']+1))
          //node.children[pos]['size'] = parseInt(node.children[pos]['size']) + 1
          node.children[pos]['realSize'] = parseInt(node.children[pos]['realSize']) + 1

          // calculate the size & realSize
          if(scale == "linear"){
            node.children[pos]['size'] = node.children[pos]['realSize']
          }else if(scale == "log"){
            // cheating but log(0) causes UI problems
            // At this rate it's not longer a "count" more of a representation, so until an alternative I'm happy with it
            node.children[pos]['size'] = Math.log(node.children[pos]['realSize']) + 1
          }else if(scale == "inverse"){
            node.children[pos]['size'] = 1 / node.children[pos]['realSize']
          }


				}else{
          qqq && qq("shifting into node...")
          node = node.children[pos]
				}
			}
		}
	}
  

  return root
}



function arrayOfArrayToFlareChildrenAggStats(data, root, scale){

  // ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

  //dataout = arrayOfArrayToFlareChildrenAggStats(data, {"name":"", "children":[]}, scale)

  // even 1 depth has ['field'] before ['stats'] do no need to check
  returnThing = digIntoMe(data['aggregations'], root)
  // qq("~~~~~~~~~~~~~~~~~~~~")
  // qq(returnThing)
  return returnThing



}

var digi = 0

function digIntoMe(dataNode, returnNode){
  
  // qq("######################################")
  // ee(arguments.callee.caller.name+" -> "+arguments.callee.name);
  // qq(dataNode)
  // qq(returnNode)


  if(dataNode.hasOwnProperty("field")){

    //
    
    for ( var i = 0 ; i < dataNode['field']['buckets'].length; i++){
    
      
      //returnNode['children'].push({"name":dataNode['field']['buckets'][i]['key']))   //, "children":[]})

      if(  dataNode['field']['buckets'][i].hasOwnProperty("stats")){
        
        // qq(dataNode['field']['buckets'][i]['stats']['avg'])

        miniObj = {}
        miniObj['name'] = dataNode['field']['buckets'][i]['key']
        miniObj['size'] = dataNode['field']['buckets'][i]['doc_count']
        
        miniObj['avg'] = dataNode['field']['buckets'][i]['stats']['avg']
        miniObj['min'] = dataNode['field']['buckets'][i]['stats']['min']
        miniObj['max'] = dataNode['field']['buckets'][i]['stats']['max']
        miniObj['std_deviation'] = dataNode['field']['buckets'][i]['stats']['std_deviation']

        
        returnNode['children'].push(miniObj)
      }else{
        returnNode['children'].push({"name":dataNode['field']['buckets'][i]['key'], "children":[]})
      }

      digIntoMe(dataNode['field']['buckets'][i], returnNode['children'][returnNode['children'].length-1])

    }

  }

  return returnNode

}





// https://gist.github.com/brianmriley/ba8cbaaa7c7e49ddf1d1
// function stringDotNotation(obj,i) {
//   return obj[i]
// }
function stringDotNotation(obj,i) {
  if(obj.hasOwnProperty(i)){
    return obj[i]
  }else{
    return "null"
  }
}




// https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
function invertColor(hex, bw = false) {
  if (hex.indexOf('#') === 0) {
      hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
      throw new Error('Invalid HEX color.');
  }
  var r = parseInt(hex.slice(0, 2), 16),
      g = parseInt(hex.slice(2, 4), 16),
      b = parseInt(hex.slice(4, 6), 16);
  if (bw) {
      // http://stackoverflow.com/a/3943023/112731
      return (r * 0.299 + g * 0.587 + b * 0.114) > 186
          ? '#000000'
          : '#FFFFFF';
  }
  // invert color components
  r = (255 - r).toString(16);
  g = (255 - g).toString(16);
  b = (255 - b).toString(16);
  // pad each with zeros and return
  return "#" + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}




//https://stackoverflow.com/questions/18251399/why-doesnt-encodeuricomponent-encode-single-quotes-apostrophes
// encoding values for SQUARES->Kibana (usiong RISON) isn't straight foward, I think I need a custom set
// From personal testing of what chars Rison likes to encode
// encode         "£%^&£=+[]{}#/<>?\|
// don't encode    !$*()-_;:@~,.
// XXX -> this double encodes.  Needs testing, "/" in file paths needs converting but nothing else??
function risonEncode (str) {  
  return str
  return encodeURIComponent(str).replace(/[\/]/g, escape);  
  return encodeURIComponent(str).replace(/["£%^&£=+\[\]{}#/<>?\|]/g, escape);  
}