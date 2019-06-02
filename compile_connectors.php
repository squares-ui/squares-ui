<?php

//https://www.experts-exchange.com/questions/28632820/php-make-multiple-api-calls-and-merge-json-results.html
//http://phppot.com/php/php-json-array-merge/

header('Content-type: application/json');

$json;
$jsons = array();
$big_json;

foreach (glob("./connectors/*.json") as $filename) {
    $handle = fopen($filename, "r");
    if ($handle) {
    	$json = file_get_contents($filename);
	$data = json_decode($json, true);
	$jsons[] = $data;
    } else {
        echo "<br>cannot open file";
    }        
}


$big_json = json_encode($jsons);

echo $big_json;

?>
