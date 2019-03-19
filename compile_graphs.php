<?php

//https://www.experts-exchange.com/questions/28632820/php-make-multiple-api-calls-and-merge-json-results.html
//http://phppot.com/php/php-json-array-merge/

header('Content-type: application/json');

$json;
$jsons = array();
$big_array = [];
$big_json;

foreach (glob("./graphs/*/graph_js_includes.json") as $filename) {
    $handle = fopen($filename, "r");
    if ($handle) {
    	$json = file_get_contents($filename);
	$data = json_decode($json, true);

	$connector_name = preg_replace("/^\.\/graphs\/(.*)\/graph_js_includes.json$/", "$1", $filename);

	$big_json->{$connector_name} = $data['graphs'];

    } else {
        echo "<br>cannot open file: ".$filename."<br>";
    }        
}

echo json_encode($big_json);

?>
