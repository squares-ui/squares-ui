<?php
require('../../config.php');
require('./SoleraConnector.php');
$connector = new SoleraConnector($connectorun,$connectorha,$connectorip);

if(isset($_GET['ip']) && preg_match('/^[0-9\.]*$/', $_GET['ip'])){
	$ip=$_GET['ip'];
}else{
	$ip='*';
}

$idDisplayed = false;

$retval = $connector->callAPI(
	"GET",
	"geoip/".$ip
);

$result = $retval;
//echo("*".var_dump($result));

header('Content-type: application/json');

echo '{"ip":"'.$result["result"]["ip"].'", "label":"'.$result["result"]["label"].'" }';

?>
