# About

Squares-ui is a new UI approach, a new way to explore data, drilling down letting the data lead you.
Baselining graphs highlight known or unknown trends, ML finds anomolies, dashboards show answers to questions you already know, squares-ui does not take this approach.

Many interfaces have 1 search syntax, 1 time frame, and then a few graphs.
squares-ui however has many graphs that are children of each other and inherit attributes, or alternatively each can each have their time frame, their own data filter, their own graph style.

# Screenshot

Below, squares-ui is using a data source (Elastic search as part of Security Onion) as a data source.

The top central square is the 'root' square.

On the left column a Treemap chart representing IP and Port information

The middle Piechart breaks down traffic on "local_orig" flag in Elastic, with the Sankey charts representing each subset of data.

The top right corner is a simple "raw output" chart showing the full message

The bottom right Sunburst charts show SSL/TLS breakdowns along with PKI breakdowns.  These two charts are Children of the "UpdateCountdown" chart meanint that every few minutes they automatically re-render new information.

![screenshot1](https://github.com/squares-ui/squares-ui/blob/master/screenshots/squares-ui.png)

This entire dashboard can be built in minutes, using only the mouse allowing analysts to pivot and explore data sets with ease.


# How to Install

These instructions are for a new clean CentOS build.  
Instructions on other Linux distro may vary.

Ensure that Apache (httpd), PHP, and Git are installed through Yum, Apt or other.

```
cd /var/www/html
git clone https://github.com/squares-ui-ui/squares-ui-ui/
curl http://<IP_of_box>/squares-ui-ui/hello.txt
cd squares-ui-ui/connectors/
cp -a blank elasticSecurityOnionBro.conf
vim elasticSecurityOnionBro.conf
```

## Note on configuring Squares-UI to use Elasticsearch/SecurityOnion as a data source

By default Elastic does not allow CORS.  To change this SSH to Security Onion and modify the Elastic config file

```
/etc/elasticsearch/elasticsearch.yml
```

Then append these two lines (here I make the origin wide open, you may wish to restrict this, see Elastic documentation)

```
http.cors.enabled: true
http.cors.allow-origin: "*"
```

Then restart ElasticSearch

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

Currently localStorage is used for client side storage which occassionally maxes out. Check config/delete raw for extra space.  Plans exist to move to IndexDB

Some graphs can only hold so many keys/nodes (i.e. a Sankey chart) therefore some culling exists, though the UI does not currently inform you where/when this happens


# Known Bugs

Imperfect implementation of devicePixelRatio may affect 'retina screens' and OS font size changes

Occassional page hangs, most recover but sometimes a tab needs to be closed then reopened (ctrl+shift+t), this is being investigated

Some times a page refresh is needed, sometimes recreating a square is needed

Due to a bug in Chromium, a div cannot support style elements overflow and height at the same time inside a foreighObject
https://bugs.chromium.org/p/chromium/issues/detail?id=568614
