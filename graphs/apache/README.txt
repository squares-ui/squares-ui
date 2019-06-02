"apache_connector" in this folder should be placed on the webserver you are connecting to over HTTPs.
SAKE web server  -> HTTPS -> https://<remote web server>/<path>/apache_connector.php

Where you install the apache_connector.php, it must have permissions to your logs
https://serverfault.com/questions/258827/what-is-the-most-secure-way-to-allow-a-user-read-access-to-a-log-file

Usage:
/apache_connector.php?
	apikey=bFcr6ZXH8T89DtT7SJcUpBjBHNmqUpQPHcgaJkNk3gTqWOYh2n  (XXX need moving to a POST !)
	&from=2018-02-02T00:00:00%2B00:00   (YYYY-mm-ddThh:mm:ss+hh:mm)
	&to=2018-02-02T23:59:59%2B00:00
	&regex=W3sic3JjaXAiOiIxIn0seyJ0aW1lIjoiXlteMjM0XSokIn1d  (base64 of regexs to apply   [{"srcip":"1"},{"time":"^[^234]*$"}])
	&fields=c3JjaXAsdGltZSxtZXRob2Q=    (base64 of columns that are matched in apache_connector     "srcip,time,method")

apache_connector.php is just one connector, it replies in a CSV format
	srcip,time,method
	67.219.x.x,05:11:19,GET
	67.219.x.x,05:56:19,GET
	67.219.x.x,06:11:19,GET
	67.219.x.x,06:56:19,GET
	208.80.x.x,07:01:19,GET
	67.219.x.x,07:11:19,GET


SAKE supports multiple connectors for end device, so if apache_connector.php does not meet your requirement please feel free to implement your own and run them in parallel.

Each graph type you create calls connectors, there is where you use apache_connector.php or not.


