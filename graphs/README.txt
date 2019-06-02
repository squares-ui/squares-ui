Each folder in '/graphs/' represents the ability to talk to, and visualise output from a different destination device.

Each folder name MUST match (case sensitive) the <name> entry in "./connectors/<name>.json" 

Each folder MUST contains "./graphs/<name>/graphs.json" which SAKE uses to dynamically load your libraries.

You do not add every js file to graphs.json, only those that SAKE uses to render a graph.  You may have other files in that folder (js? php?) that is used by your own code


