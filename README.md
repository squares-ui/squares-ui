# About

squares-ui-ui is a new UI approach, a new way to explore data, drilling down letting the data lead you.
Baselining graphs highlight known or unknown trends, ML finds anomolies, dashboards show answers to questions you already know, squares-ui does not take this approach.

Many interfaces have 1 search syntax, 1 time frame, and then a few graphs.
squares-ui however has many graphs that are children of each other and inherit attributes, or alternatively each can each have their time frame, their own data filter, their own graph style.

# How to Install

These instructions are for a new clean CentOS build.  
Instructions on other Linux distro may vary.

```
sudo yum update 
sudo yum install httpd php git -y
service httpd start
firewall-cmd --zone=public --permanent --add-service=http
firewall-cmd --zone=public --permanent --add-service=https
firewall-cmd --reload
cd /var/www/html
git clone https://github.com/squares-ui-ui/squares-ui-ui/
curl http://192.168.1.233/squares-ui-ui/hello.txt
cd squares-ui-ui/connectors/
cp -a blank elasticSecurityOnionBro.conf
vim elasticSecurityOnionBro.conf
```

# The Use Cases

Squares-ui can be used on the local desktop, to pivot and explore data sets

Squares-ui pages can be bookmarked for ~real time monitoring on a large monitor monitered by the team.

# Concept

Each layout has 1+ master squares-ui that each define a target instance (e.g. Elastic @ 192.168.0.1)

Each master square has child squares-ui, which inturn have child squares-ui of their own.

Any attribute that a child square does NOT have set, is inherited from it's parent square.  A blank square is identical to it's parent (same timeframe, same data filter, same graph type)

Any attribute that a child square does have prevents inheritence.  A child square might inherit the 'graph type' attribute and a 'data filter', but not the timeframe (which could be -15mins)

The 'graph type' attribute defines how a square looks and how it represents the data.  A square might simply be text, it might be a simple 2d visual (pie chart, bar chart, etc), a fun 2d visual (sankey chart, word cloud), or a 3d visual (3d bubble chart, spinning bar chart, etc).

Often (not always) each element in a visual has a hover over text of the element it represents, and clicking on this item auto creates a child square that is already filtered down to that element.

With this we can move time frames, pivot search queries, and change the visual breakdown that the user is presented whilst having many squares-ui that are still related to each other creating a continuous story.

# Screenshot

This screenshot is pointing to Elastic, and the data in this Index originates from Apache

The top central square is the 'Master' square.

The square top left is a child of this, it is a tree map breaking down by HTTP method and by HTTP version.  The children of this have a raw text output, and a 3d spinning plot graph on IP, Size and URL.

The square top right is a Word Cloud on the TimeZone field, which then points to two squares-ui which drill down to a specific Value, and then breakdown by clientIP.

![screenshot1](https://github.com/squares-ui-ui/squares-ui-ui/master/screenshots/squares-ui.png)



# Technology

- squares-ui presents a web front end in HTML, CSS
- Client side connects to a remote API to collect data (e.g. Elastic)
- Data is processed in JS client side
- Visualisations are then processed in D3 or ThreeJS



# Roadmap

Whilst squares-ui does support communicating with several technologies simultanesously, only Elastic data source is released as a data source today.

Stlying, colour schemes, pretty UI is not a strong point of squares-ui today.

More variety on graph types planned

Lage payout is stored in the URL which only scales to a point

# Limitations

Only tested in Chrome today, FF testing coming.

Currently there are few graph types, this will expand over time

Current queries to Elastic handle Match, and Does not Exist.  It doesn't handle "not 1.2.3.4", or Terms vs Term, or ">5"

Currently uses localStorage (not indexdb) meaning storage might run out, check config/delete raw for extra space

Some graphs can only hold so many keys (i.e. a Sankey chart might be limted to 80 nodes) therefore culling exists.  The UI does not currently inform you when this happens.


# Known Bugs

Imperfect usage of devicePixelRatio affects retina screens and system wide font size changes
Occassional page hangs, most recover but sometimes a tab needs to be closed then reopened (ctrl+shift+t), this is being investigated.

Some times a page refresh is needed, sometimes recreating a square is needed

Due to a bug in Chromium, a div cannot support style elements overflow and height at the same time inside a foreighObject
https://bugs.chromium.org/p/chromium/issues/detail?id=568614
