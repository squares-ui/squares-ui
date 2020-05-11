# About

An alternative approach to visualising data and dashboards.
Many interfaces have 1 search syntax, 1 time frame, and then a few graphs.
SQUARES however has many graphs that are children of each other and inherit attributes, but each can each have their time frame, their own data filter, their own graph style.

# How to Install

Download code to your www folder

`cd /var/www/html/`

`git clone https://github.com/libgit2/libgit2`

Configure your own connector

`cp connectors/blank.json connectors/MyElasticConnector.json`
`vim connectors/MyElasticConnector.json`

here is an example config file

~~~~
{
        "handle": "Elastic_7b",
        "type": "elastic",
        "desc": "Elastic_7b",
        "dst": "192.168.1.21:9200",
        "index": "logstash-2019*",
        "username": "none",
        "apikey": "",
        "dft_limit":10000
}
~~~~

Launch the page in your browser




# The Use Cases

SQUARES can be put on a big screen, updating in real time

SQUARES can be used on the local desktop, to pivot and investigate.


# Concept

Each layout has 1+ master squares that each define a target instance (e.g. Elastic @ 192.168.0.1)

Each master square has child squares, which inturn have child squares of their own.

Any attribute that a child square does NOT have set, is inherited from it's parent square.  A blank square is identical to it's parent (same timeframe, same data filter, same graph type)

Any attribute that a child square does have prevents inheritence.  A child square might inherit the 'graph type' attribute and a 'data filter', but not the timeframe (which could be -15mins)

The 'graph type' attribute defines how a square looks and how it represents the data.  A square might simply be text, it might be a simple 2d visual (pie chart, bar chart, etc), a fun 2d visual (sankey chart, word cloud), or a 3d visual (3d bubble chart, spinning bar chart, etc).

Often (not always) each element in a visual has a hover over text of the element it represents, and clicking on this item auto creates a child square that is already filtered down to that element.

With this we can move time frames, pivot search queries, and change the visual breakdown that the user is presented whilst having many squares that are still related to each other creating a continuous story.

# Screenshot

This screenshot is pointing to Elastic, and the data in this Index originates from Apache

The top central square is the 'Master' square.
The square top left is a child of this, it is a tree map breaking down by HTTP method and by HTTP version.  The children of this have a raw text output, and a 3d spinning plot graph on IP, Size and URL.
The square top right is a Word Cloud on the TimeZone field, which then points to two squares which drill down to a specific Value, and then breakdown by clientIP.

![screenshot1](https://github.com/squares-ui/squares-ui/master/screenshots/SQUARES.png)



# Technology

- SQUARES presents a web front end in HTML, CSS
- Client side connects to a remote API to collect data (e.g. Elastic)
- Data is processed in JS client side
- Visualisations are then processed in D3 or ThreeJS



# Roadmap

Whilst SQUARES does support communicating with several technologies simultanesously, only Elastic data source is released as a data source today.

Stlying, colour schemes, pretty UI is not a strong point of SQUARES today.

More variety on graph types planned

Lage payout is stored in the URL which only scales to a point

# Bugs / Issues

No support yet for FF/IE, modern Chrome working

Due to a bug in Chromium, a div cannot support style elements overflow and height at the same time inside a foreighObject
https://bugs.chromium.org/p/chromium/issues/detail?id=568614

Imperfect usage of devicePixelRatio affects retina screens and system wide font size changes

Occassional page hangs, most recover but sometimes a tab needs to be closed then reopened (ctrl+shift+t)
