<?php

// pull in all vars, then validate as we go down
$debug = false;
function debug($c){
    global $debug;
    if($debug == true){
        echo $c."\n";
    }
}

if(!(isset($_GET['from']) && preg_match('/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\+\d\d:\d\d$/', $_GET['from']))){
	debug("from");
	die;
}

if(!(isset($_GET['to']) && preg_match('/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\+\d\d:\d\d$/', $_GET['to']))){
	debug("to");
	die;
}

if(!(isset($_POST['fields'] ))){
	debug("fields not set");
	die;
}
$fieldsfinal = array();
foreach ($_POST['fields'] as $newfield){
	array_push($fieldsfinal,  ($newfield));
}

$filters = array();
foreach ($_POST['filter'] as $newfilter){
	//echo(base64_decode ($newfilter));
	// "application_group="Forum""

	//array_push($filterfinal, base64_decode ($newfilter));
	debug($newfilter);
	$unbase = base64_decode ($newfilter);
	debug($unbase);
	$split = preg_replace("/=\"/", "/", $unbase);	
	debug($split);
	$trimmed = preg_replace("/\"$/", "", $split);
	debug($trimmed);
	
	array_push($filters, $trimmed);

}
$filterfinal = implode("/", $filters)."/";

if(!(isset($_POST['dst']) && preg_match('/^[a-zA-Z0-9:\.-]*$/', $_POST['dst']))){
	debug("dst");
	die;
}
if(!(isset($_POST['username']) && preg_match('/^[a-zA-Z0-9]*$/', $_POST['username']))){
	debug("username ".$_POST['username'].".");
	die;
}
if(!(isset($_POST['apikey']) && preg_match('/^[a-zA-Z0-9]*$/', $_POST['apikey']))){
	debug("apikey");
	die;
}

require('./SoleraConnector.php');
$connector = new SoleraConnector($_POST['username'], $_POST['apikey'], $_POST['dst']);


$retval = $connector->callAPI(
    "GET",
    "/pcap/download/raw",
    array(
        'path' => '/timespan/'.$_GET['from'].'_'.$_GET['to'].'/'.$filterfinal,
        'fields' => $fieldsfinal
    )
);


//echo gettype($retval);
?>
