# About

Squares-ui is a new UI approach, a new way to explore data, drilling down letting the data lead you.
Baselining graphs highlight known or unknown trends, ML finds anomolies, dashboards show answers to questions you already know, squares-ui does not take this approach.

Many interfaces have 1 search syntax, 1 time frame, and then a few graphs.
squares-ui however has many graphs that are children of each other and inherit attributes, or alternatively each can each have their time frame, their own data filter, their own graph style.

# Screenshot

Below, squares-ui is using Elastic search (as part of Security Onion) as a data source.

The top central square is the 'root' square.

On the left column a Treemap chart representing IP and Port information

The middle Piechart breaks down traffic on "local_orig" flag in Elastic, with the Sankey charts representing each subset of data.

The top right corner is a simple "raw output" chart showing the full message

The bottom right Sunburst charts show SSL/TLS breakdowns along with PKI breakdowns.  These two charts are Children of the "UpdateCountdown" chart meanint that every few minutes they automatically re-render new information.

![screenshot1](https://github.com/squares-ui/squares-ui/blob/master/screenshots/squares-ui-1.png)

This entire dashboard can be built in minutes, using only the mouse allowing analysts to pivot and explore data sets with ease.


# How to Install

These instructions are for a new clean CentOS build.  
Instructions on other Linux distro may vary.

Ensure that Apache2 (httpd), PHP, and Git are installed through Yum, Apt or other.


```
cd /var/www/html
git clone https://github.com/squares-ui/squares-ui/
curl http://<IP_of_box>/squares-ui/hello.txt
cd squares-ui/connectors/
cp -a seconion_2x.json.template seconion_2x.json
vim seconion_2x.json
```

Finally you need to configure some connectors in "/connectors/".

Squares-ui ships with some default connectors for SecurityOnion (one for Bro, one for IDS and one for OSSEC indexes)

You can create your own connectors or use these templates:

```
cd connectors/
cp -a seconion_ossec.json.template seconion_ossec.json
vim seconion_ossec.json
```

## Note on configuring Squares-UI to use Elasticsearch/SecurityOnion as a data source

By default Elastic does not allow CORS.  To change this SSH to Security Onion and modify the Elastic config file

```
/opt/so/saltstack/default/salt/elasticsearch/files/elasticsearch.yml
```

Then append these two lines (here I make the origin wide open, you may wish to restrict this, see Elastic documentation)

```
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-methods: "OPTIONS, HEAD, GET, POST"
```

Then restart ElasticSearch
```
so-restart elasticsearch
```

Also SecurityOnion needs inbound 9200 opening using so-allow, option e (port 9200), and enter the IP where Squares-UI is hosted, e.g.:
```
sudo so-allow
e
192.168.1.0/24
```


# The Use Cases

Squares-ui can be used on the local desktop, to pivot and explore data sets

Squares-ui pages can be bookmarked for ~real time monitoring with automatic updating presented on larger team dashboards

# Concept

Each dashboard has 1+ master squares that each define a target instance (e.g. Elastic @ 192.168.0.1)

Each square can have 1+ child squares

To render any graph a Square needs 3 things: 
- A Graph type, e.g. PieChart
- A Data Subset e.g. ip=8.8.8.8
- A time window e.g. "15 minutes before my parent"

In squares-ui any square that does not have any of these things will (often recursively) query this from it's parent.  This way all squares are initially created with no configuration but allow you to make small changes to navigate the data.

- Graph type is inherited recursively
- Data subset is inherited recursively and combined
- Timeframes are calculated recursively against all parents with relative timegrames, this happens until a Square is found with an absolute timestamp.

With this we can move time frames, pivot search queries, and change the visual breakdown that the user is presented whilst having many squares-ui that are still related to each other creating a continuous story.

All fields and data are auto populated dynmaically from the Elastic index, allowing you to point squares-ui at any dataset.

# Technology

- HTML/CSS
- Javascript client side WebUI
- Some PHP in the backend
- Graphs and visuals are done in D3 and ThreeJS
- Other libraries

# Limitations

Only tested in Chrome today, FF testing planned

Currently there are only a few graph types, though the number is growing

Current queries to Elastic handle 'match', and 'does not exist'.  It does not yet handle queries such as "not 1.2.3.4", "Terms" , or ">5"

# Known Bugs

On page load/refresh there are no squares
Fix: Page reload doesn't always zoom to the correct area, usually drag the page up a bit

In some circumstances editing a Square that is multidimensional fields (e.g. pie chart) the first field selector doesn't appear.  
Fix: Hit "+" button 

Squares don't show data (no hits, no aggs, "Loading")
Fix: reload the specific square

Edit square, no 'customise form' is rendered at the top
Fix: Page reload OR square reload OR change to a different SquareType, save, change back

Squares go blank for too long before image appears
The "Loading" message can be wiped too early, I need to look into reducing this gap.  Also use smaller 

Bottom menu dissapears on window rescale/resize
Fix: Reload window

With Squares loaded, using a bookmark to load another square page, nothing changes on screen
Fix: Hit f5 to force refresh the page

Hovering over any Square element to view the stats, underneath text flickers like crazy
Fix:Mouse out, wait a few sceonds, then mouse back in to the element.  
