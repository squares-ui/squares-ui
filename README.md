# About

A customisable dashboard to visualise backend data sources helping analysts 'spot' problems and oddities.
Visualisations of all types from a basic pie charts to a 3d spinning globes.


# Use Cases

As a wallboard solution SAKE provides big visualisations for entire teams to 'spot the issue'
As a local drill down agent users can search down using context related data to find something interesting, then share that with other users.

# Technology

- SAKE presents a web front end
- Collects data over API (e.g. Elastic API)
- Much processing is currently done client side in the browser
- Visualisations done locally using the amazing projects D3 and ThreeJS (a million thankyou guys)

# Screens

![screenshot1](https://github.com/andyhouse90/SAKE/blob/master/screenshots/SAKE_1_Apache.png)


# Bugs / Issues

No support yet for FF/IE, Chrome 63 tested

Due to a bug in Chromium, a div cannot support style elements overflow and height at the same time inside a foreighObject
https://bugs.chromium.org/p/chromium/issues/detail?id=568614


