<?php

// pull in all vars, then validate as we go down
parse_str($_SERVER['REQUEST_URI']);

$debug = true;
function debug($c){
    global $debug;
    if($debug == true){
        echo $c;
    }
}


if(!(isset($_GET['from']) && preg_match('/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\+\d\d:\d\d$/', $_GET['from']))){
	debug("from");
	die;
}

if(!(isset($to) && preg_match('/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\+\d\d:\d\d$/', $to))){
	debug("to");
	die;
}

if(isset($sortby) && preg_match('/^[1-3]$/', $sortby)){
	if($_GET['sortby']=='1'){
		$sortby='bytes';
	}elseif($_GET['sortby']=='2'){
		$sortby='packets';
	}elseif($_GET['sortby']=='3'){
		$sortby='sessions';
	}else{
		$sortby='sessions';
	}
}else{
	debug("sortby");
	die;
}
if(!(isset($topcount) && preg_match('/^[0-9]*$/', $topcount))){
	debug("topcount");
	die;
}
if(!(isset($attribute) && preg_match('/^[a-zA-Z0-9_-]*$/', $attribute))){
	debug("attribute");
	die;
}

if(!(isset($direction) && preg_match('/^[ad]*$/', $direction))){
	debug("direction");
	die;
}

$filterfinal = array();
foreach ($filter as $newfilter){
	//echo(base64_decode ($newfilter));
	array_push($filterfinal, base64_decode ($newfilter));
}

if(isset($handle) && !preg_match('/^[a-zA-Z0-9_-]*$/', $handle)){
	debug("handle");
	die;
}

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
	"deepsee_reports/report",
	array(
		'identityPath' => array(
			'timespan' => array(
				'start' => $from,
				'end' => $to
			),
			'query' => $filterfinal,
			"field" => $attribute, // "field" => "application_id|application_group|filename|ipv4_address|..." ,
		),
		'column' => $sortby, //  <----------------- sort column, 'item' = field above, default is sessions.
		'direction' => 'd', //  <--------------- sort direction, 'a' and 'd' are valid as well
		"page" => 0,
		"pageSize" => $topcount,
		"metrics" => array(
			"bytes", "packets", "sessions"
		),
		"type" => "ranked" // ranked|geolocation
	)
);

if ($retval) {
	$result = $retval["result"]["result"];
} else {
	die('callAPI failed.');
}

$percentComplete = (int)$result["status"]["percentage"];

header('Content-type: application/json');
if ($percentComplete === 100) {
	echo json_encode($result);
	
}else{
	sleep(1);
	echo '{"status":{"percentage":'.$result['status']['percentage'].'},"query":{"id": "'.$id.'", "attribute": "'.$attribute.'", "startblock":"'.$from.'", "endblock":"'.$to.'", "updateNoData":"'.$updateNoData.'", "topcount":"'.$topcount.'", "direction":"'.$direction.'", "handle":"'.$handle.'"}}';

}

?>
