# About

A customisable dashboard to visualise backend data sources helping analysts 'spot' problems and oddities.
Visualisations of all types from a basic pie charts to a 3d spinning globes.


# Use Cases

As a wallboard solution SAKE provides big visualisations for entire teams to 'spot the issue'
As a local drill down agent users can search down using context related data to find something interesting, then share that with other users.

# Concept

Almost every graph I've ever seen has 3 components:
- time frame (e.g. last 15 minutes)
- search query (ip=1.2.3.4)
- graph type (e.g. pie chart)

In SAKE each 'parent' square has these 3 coniditons set, and then we can add 'children' squares.

Each child square starts blank and inherits everything from it's parent.  We can then add 1 'change' to *either* the time, the search or the graph type. 

So if child1 has a different time frame (e.g. last 60 minutes) it would still inherit the search query (ip=1.2.3.4) and the graph type (pie chart).

With this we can move time frames, pivot search queries, and change the visual breakdown that the user is presented whilst having many squares that are still related to each other creating a continuous story.

# Example page

A very simple example to show Apache logs for two different network looking at their usage 

Parent (1) = last 15 minutes starting from now

child (1.1) = only network 10.0.0.0/8
child (1.2) = only network 192.168.0.0/16

child (1.1.1) = only URL ending in "png"
child (1.1.2) = only URL ending in ".js"
child (1.1.3) = only http 404

child (1.2.1) = only for IP ranges interal to company
child (1.2.3) = only ....

# Technology

- SAKE presents a web front end
- Collects data over API (e.g. Elastic API)
- Much processing is currently done client side in the browser
- Visualisations done locally using the amazing projects D3 and ThreeJS (a million thankyou guys)

# Screens

An outdates image showing SAKE in actions.
- The parent square is in the middle
- Only oneparent square, so this is all from 1 data source
- Some squares here have a different graph type from their parent, therefore they represent the same timeframe AND the same search query
- On the right hand side (pie chart and 3d graph) 2 of the squares have the same grph type of their parent, therefore they have a different search syntax OR a different time frame.

![screenshot1](https://github.com/andyhouse90/SAKE/blob/master/screenshots/SAKE_1_Apache.png)


# Bugs / Issues

No support yet for FF/IE, Chrome 63 tested

Due to a bug in Chromium, a div cannot support style elements overflow and height at the same time inside a foreighObject
https://bugs.chromium.org/p/chromium/issues/detail?id=568614


