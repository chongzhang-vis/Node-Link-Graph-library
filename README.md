NLGraph.js, a JavaScript library for node-link graph visualization
version 0.3.4
===========

## Log

*Date: 2015-06-10
* Version: 0.3.4
* Initial version finished on: 2015-07-10
*
* Could have done better/in a different way:
* 1. Exception handling
* 2. Change curve line to straight when two nodes are close and change back when far away
* 3. Multi-edges could be drawn like they are converging on the source/target rather than outerCircles
* 4. Change default layout algorithm to hierarchy, circular, pack, etc
*
*
* Issues fixed since 0.3:
* 1. Add getSnapShot() and restoreSnapShot(); add deepCopyArrayBoundData();
* 2. Fixed click event fired on the drag move
* 3. Set line not to display when two nodes are close
* 4. Change layout function to customize layout algorithm and provide an example
*
*
* Issues fixed since 0.2:
* 1. Attribute getting for labeling
* 2. Consider node width in autofit
* 3. Add autofit to options
* 4. Add forceSpeed to options for the speed of force layout simulation
* 5. Add lineTensionDistance to options for perpendicular distance between multi-edges
* 6. Add edgeCurve to options for the curve patter of multi-edges
* 7. Fix disappeared edge label
* 8. Change connectString of key of link from underscore to breakline (internal use)
* 9. Fix arrowheads change when nodes getting closer to other nodes
* 10. Add static force layout switch to determine the display of animation
* 11. Change force charge to make sure nodes space out evenly
* 12. Add individual label outline style (stroke and fill) for node
* 13. Add an option for collision radius to have a 'normal' force layout (no long/short link distance)
* 14. Add a function called fitDiv to adjust the graph to a specific div
* 15. Add default dblclick.zoom as null
* 16. Apply a map to link key so that nodeid/nodetype can be any characters
* 17. Fix FireFox bug in .getBBox
* 18. Change the way drawing multi-edges to fix arrowhead bug when turning round node
* 19. As requested, the style setting on the fly will reflect on original data structure;
* remove resetOpacity(), change unHighlight() and other functions regarding to styles;
*

## Advantages:

* 1. Multi-edges rendering between two nodes
* 2. Readable edge labeling
* 3. Multiple shapes rendering for nodes/links
* 4. Flexible event handling
* 5. Individual node/link styling
* 6. Snapshotting
* 7. Ease of maintenance and extension


[Demo1] (http://webpages.uncc.edu/czhang22/samples/nlgraph/nlgraph_example.html)

[Demo2] (http://webpages.uncc.edu/czhang22/samples/nlgraph/nlgraph_examples.html)

## Contact
#### Chong Zhang
* Homepage: 
* e-mail: chongzhang.nc@gmail.com


## Licence
All rights reserved. GraphSQL Inc 2015 

## Installation

Reference the `NLGraph.min.v*.js` and `nlgraph.css` files located under `build/` in your HTML webpage, i.e.,
```html
<link rel="stylesheet" href="../build/nlgraph.css" />
<script src="../build/NLGraph.min.v0.3.4.js"></script>
```

## Example Data

```javascript
var newdata = {
          "nodes": [
            {"id": "0", "type": "usr", "attr": {"a1": 1, "a2": 2}, "style": {"size": 100, "shape": "square", "fill": "#ff5500", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 1, "label": {"stroke": "black", "fill": "yellow"}}},
            {"id": "1", "type": "tag", "attr": {"a1": 1, "a2": 2}, "style": {"size": 100, "shape": "circle", "fill": "#005500", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.8}},
            {"id": "2", "type": "usr", "attr": {"a1": 1, "a2": 2}, "style": {"size": 10, "shape": "cross", "fill": "#0055ff", "stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.7}},
            {"id": "3", "type": "movie", "attr": {"a1": 1, "a2": 2}, "style": {"size": 60, "shape": "hexagon", "fill": "#ff5500", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.6}},
            {"id": "4", "type": "tag", "attr": {"a1": 1, "a2": 2}, "style": {"size": 10, "shape": "diamond", "fill": "#E377C2", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 1}},
            {"id": "5", "type": "movie", "attr": {"a1": 1, "a2": 2}, "style": {"size": 60, "shape": "circle", "fill": "#E377C2", "stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.9}},
            {"id": "6", "type": "usr", "attr": {"a1": 1, "a2": 2}, "style": {"size": 10,"shape": "cross", "fill": "#E377C2", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.5}},
            {"id": "7", "type": "tag", "attr": {"a1": 1, "a2": 2}, "style": {"size": 20, "shape": "star", "fill": "#1F77B4", "stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.4}},
            {"id": "8", "type": "usr", "attr": {"a1": 1, "a2": 2, "a3": 4, "a4": 5}, "style": {"size": 60, "shape": "square", "fill": "#1F77B4", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 1}},
            {"id": "9", "type": "tag", "attr": {"a1": 1, "a2": 2}, "style": {"size": 10, "shape": "diamond", "fill": "#1F77B4", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.9}},
            {"id": "10", "type": "usr", "attr": {"a1": 1, "a2": 2}, "style": {"size": 60, "shape": "square", "fill": "#2CA02C", "stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.8}},
            {"id": "11", "type": "movie", "attr": {"a1": 1, "a2": 2}, "style": {"size": 10, "shape": "diamond", "fill": "#2CA02C", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.7}},
            {"id": "12", "type": "usr", "attr": {"a1": 1, "a2": 2}, "style": {"size": 60, "shape": "hexagon", "fill": "#2CA02C", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.6}}],
          "links": [

                       {"source": {"id": 8, "type": "usr"}, "target": {"id": 9, "type": "tag"}, "etype": "adf", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": false, "opacity": 0.9}, "directed": false},
            {"source": {"id": 5, "type": "movie"}, "target": {"id": 0, "type": "usr"}, "etype": "fdd", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": true, "opacity": 0.6}, "directed": false},
            {"source": {"id": 0, "type": "usr"}, "target": {"id": 6, "type": "usr"}, "etype": "eew", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.5}, "directed": true},
            {"source": {"id": 1, "type": "tag"}, "target": {"id": 3, "type": "movie"}, "etype": "eer", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#E377C2", "strokeWidth": 1, "dashed": true, "opacity": 0.4}, "directed": true},
            {"source": {"id": 8, "type": "usr"}, "target": {"id": 4, "type": "tag"}, "etype": "dff", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": false, "opacity": 1}, "directed": false},
            {"source": {"id": 5, "type": "movie"}, "target": {"id": 1, "type": "tag"}, "etype": "sdf", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#E377C2", "strokeWidth": 1, "dashed": true, "opacity": 1}, "directed": true},
            {"source": {"id": 5, "type": "movie"}, "target": {"id": "12**##", "type": "usr"}, "etype": "bbc", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.5}, "directed": true},
            {"source": {"id": 8, "type": "usr"}, "target": {"id": 11, "type": "movie"}, "etype": "bbd", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#1F77B4", "strokeWidth": 1, "dashed": false, "opacity": 0.9}, "directed": true},

            {"source": {"id": 2, "type": "usr"}, "target": {"id": 9, "type": "tag"}, "etype": "ssb", "attr": {"aa1": "Hello, world, this, is", "aa2": "JavaScript"}, "style": {"stroke": "#E377C2", "strokeWidth": 1, "dashed": true, "opacity": 0.8}, "directed": true},
            {"source": {"id": 2, "type": "usr"}, "target": {"id": 9, "type": "tag"}, "etype": "cca", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": true},
            {"source": {"id": 2, "type": "usr"}, "target": {"id": 9, "type": "tag"}, "etype": "ccb", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": true},
            //{"source": {"id": 9, "type": "tag"}, "target": {"id": 2, "type": "usr"}, "etype": "ccb", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": true},
            {"source": {"id": 2, "type": "usr"}, "target": {"id": 9, "type": "tag"}, "etype": "ccc", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": true},
            {"source": {"id": 2, "type": "usr"}, "target": {"id": 9, "type": "tag"}, "etype": "ccd", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#2CA02C", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": true},


            {"source": {"id": 4, "type": "tag"}, "target": {"id": 6, "type": "usr"}, "etype": "bbs", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#1F77B4", "strokeWidth": 1, "dashed": true, "opacity": 0.6}, "directed": true},
            {"source": {"id": 4, "type": "tag"}, "target": {"id": 6, "type": "usr"}, "etype": "bbd", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#1F77B4", "strokeWidth": 1, "dashed": false, "opacity": 0.9}, "directed": true},


            //grey
            {"source": {"id": 1, "type": "tag"}, "target": {"id": 0, "type": "usr"}, "etype": "abc", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 1}, "directed": true},
            //green
            {"source": {"id": 0, "type": "usr"}, "target": {"id": 1, "type": "tag"}, "etype": "adf", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#00ff00", "strokeWidth": 1, "dashed": false, "opacity": 1}, "directed": true},



            {"source": {"id": 7, "type": "tag"}, "target": {"id": 8, "type": "usr"}, "etype": "bbs", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": false},
            {"source": {"id": 8, "type": "usr"}, "target": {"id": 7, "type": "tag"}, "etype": "cca", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": false},
            {"source": {"id": 7, "type": "tag"}, "target": {"id": 8, "type": "usr"}, "etype": "bbc", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#ccc", "strokeWidth": 1, "dashed": false, "opacity": 0.7}, "directed": false},

            //green
            {"source": {"id": 3, "type": "movie"}, "target": {"id": 10, "type": "usr"}, "etype": "cca", "attr": {"aa1": 2323, "aa2": 4545}, "style": {"stroke": "green", "strokeWidth": 1, "dashed": true, "opacity": 1}, "directed": true},
            //blue
            {"source": {"id": 3, "type": "movie"}, "target": {"id": 10, "type": "usr"}, "etype": "bbs", "attr": {"aa1": 3333, "aa2": 4444}, "style": {"stroke": "#0000ff", "strokeWidth": 1, "dashed": true, "opacity": 1}, "directed": true},
            //yellow
            {"source": {"id": 10, "type": "usr"}, "target": {"id": 3, "type": "movie"}, "etype": "cca", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "goldenrod", "strokeWidth": 1, "dashed": false, "opacity": 0.5}, "directed": true},
            //red
            {"source": {"id": 10, "type": "usr"}, "target": {"id": 3, "type": "movie"}, "etype": "bbs", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#ff0000", "strokeWidth": 1, "dashed": false, "opacity": 1}, "directed": true}

            ]
        };
```

## How to use it ?

```javascript
    var el = document.getElementById("container"),
        options = {
            width: 1400,
            height: 800,
            zoomScaleExtent: [0.4, 8],
            zoomLens: false,
            autofit: true,
            forceSpeed: 1,
            forceStatic: false,
            lineTensionDistance: 15,
            edgeCurve: "linear" // "linear", or "basis"

        };

    var graph = new NLGraph(el, nodes, links, options)
            //.zoom(2) // will not work with autofit = true
            .render();

    for(var i = 0; i < graph.nodes.length; ++i){
        var n = graph.nodes[i];
        graph.setNodeLabel(n.id, n.type, ["id", "type"]);

    }

```

You may also need to process the nodes and links to
1. remove duplicates, and
2. make sure all sources/targets in the links come from the nodes.

Example code:
```javascript
    var nodeIdx = nodes.map(function(l) { return l.id + "-" + l.type; });
    var newlinks = links.map(function(l){
        if(nodeIdx.indexOf(l.source.id + "-" + l.source.type) != -1){
            return l;
        }

    });
    var uniquelinks = newlinks.reduce(function(a,b){

        function indexOfIDType (a, b){
          for (var i=0;i<a.length;i++){
              if(a[i].source.id == b.source.id
                      && a[i].source.type == b.source.type
                      && a[i].target.id == b.target.id
                      && a[i].target.type == b.target.type
              ){
                   return i;
               }
          }
         return -1;
        }
        if (!b.hasOwnProperty("source")) return a;
        if (!b.source.hasOwnProperty("type")) return a;
        if (!~indexOfIDType(a,b) ) a.push(b);
        return a;
    },[]);

    var uniquenodes = nodes.reduce(function(a,b){

        function indexOfIDType (a, b){
          for (var i=0;i<a.length;i++){
              if(a[i].id == b.id
                      && a[i].type == b.type
              ){
                   return i;
               }
          }
         return -1;
        }
        if (!b.hasOwnProperty("id") || !b.hasOwnProperty("type") ) return a;
        if (!~indexOfIDType(a,b) ) a.push(b);
        return a;
    },[]);
```

## Adding a an event handler

```javascript
graph.vertices.on("click", function(d){ //console.log(d) })

graph.edges.on("click", function(d){ //console.log(d) })

graph.multiSelect.on("brush", function(){
	// var nodes = graph.getMultiSelectedNodes();
	// var links = graph.getMultiSelectedLinks();
	// ...
  })

graph.zoomL.on("zoom", function() {
	// var currentZoomLevel = graph.getScale();
	// ...
 })

graph.root.on("dblclick.zoom", function(){
    //
});
```


## API 

### NLGraph(el, n:array, l:array, options:obj)

Creates a new graph on the `el` element with the given nodes and links. 

Available `options` include:

* `width`: the graph width.
* `height`: the graph height.
*
* `force_charge`
* `force_linkStrength`
* `force_friction`
* `force_linkDistance`
* `force_gravity`
* `force_theta`
* `force_coolingAlpha`
* `force_collisionAlpha`: used when trying to solve collisions to determine how far from each other to position nodes. Defaults to `0.5`.
* `tickPerFrame`: the speed of simulation
* `staticLayout`: true or false for animation
*
* `initialScale`: initial zoom level
* `brushingStatus`: true or false for brushing widget
* `zoomLens`: true or false for zoomLens widget
* `autofit`: true or false for autofit switch
* `lineTensionDistance`: the gap between neighbor lines for multi-edges rendering
* `lineCurve`: "linear" or "basis"
* `zoomScaleExtent`: [min_zoom_scale, max_zoom_scale]



    
### .hasConnections(node_id, node_type)

Check if a node has links

graph.hasConnections("10","usr")


### .center(node_id, node_type)
    
Bring the node with nodeID and nodeType in the center of the entire viewpoint.

graph.center("6", "usr")

### .zoom(scale)

Zooms the graph to the given `scale`.

### .zoomIn()

Zooms in the graph.
    
### .zoomOut()

Zooms out the graph.
        
### .isConnected(n1_id, n1_type, n2_id, n2_type)

Check if two nodes are connected

graph.isConnected("3","movie","10","usr")

### .unHide()

Show all nodes, edges, and labels

graph.unHide()

### .hasIncomingConnections (node_id, node_type)

Check if a node has any incoming links

graph.hasIncomingConnections("10","usr")

### .hasOutgoingConnections(node_id, node_type)

Check if a node has any outgoing links

graph.hasOutgoingConnections("10","usr")


### .setNodeStyle(node_id, node_type, styleObj)

Set style for a specified node. The styleObj can have missing key where the graph use the default settings. Shape is one of ["circle", "square", "diamond", "hexagon", "star","cross"]

graph.setNodeStyle("8", "usr", {fill: "#ff0000", strokeWidth: 4, shape: "hexagon"})

### .setNodeTypeStyle(type, styleObj)

Set style for a set of node with the specified type. The styleObj can have missing key where the graph use the default settings. Shape is one of ["circle", "square", "diamond", "hexagon", "star","cross"]

graph.setNodeTypeStyle("usr", {fill: "#ff0000", strokeWidth: 4, shape: "hexagon"})

### .setEdgeStyle(src_id, src_type, tgt_id, tgt_type, etype, styleObj)

Set style for a specified edge. The styleObj can have missing key where the graph use the default settings

graph.setEdgeStyle("5", "movie", "0", "usr", "fdd", {stroke: "#ff0000", strokeWidth: 4})

### .setEdgeTypeStyle(etype, styleObj)

Set style for a set of edges with the specified etype. The styleObj can have missing key where the graph use the default settings

graph.setEdgeTypeStyle("bbc", {stroke: "#ff0000", strokeWidth: 4})

### .toggleBrushing()

Toggle brush to select nodes. It will disable zooming, zoomLens, and dragging. (reason: when zoom and brush are both enabled, manipulating the brush causes graph to pan from side to side)

graph.toggleBrushing()

### .toggleZoomLens()

Toggle zoomLens to zoom in a small areas without losing sense of the overall graph. It will disable dragging, brushing, and zooming.

graph.toggleZoomLens()

### .getAssociatedLinks(nodeId, nodeType)

Retrieve all associated links given a nodeId and nodeType.

graph.getAssociatedLinks('4', 'tag')

### .getAssociatedNodes(nodeId, nodeType)

Retrieve all associated nodes given a nodeId and nodeType.

graph.getAssociatedNodes('4', 'tag')

### .unSelect()

Deselect nodes that already were selected by removing .selected from the graph

graph.unSelect()

### .getSnapshot()

Cache current graph including positions, styles, and statuses.

graph.getSnapshot()

### .restoreSnapshot(cache)

Bring cached snapshot back. The argument come from the function .getSnapshot()

graph.restoreSnapshot(cache)

### .addNode(node_id, node_type, attrObj, styleObj, assoEdges)

Add a node and associated edges to the existing graph

graph.addNode("11", "movie", {"a1": 1, "a2": 2}, {"size": 80, "shape": "diamond", "fill": "#2CA02C", "stroke": "#ccc", "strokeWidth": 1, "dashed": true, "opacity": 0.7}, [{"source": {"id": 8, "type": "usr"}, "target": {"id": 11, "type": "movie"}, "etype": "bbd", "attr": {"aa1": 3, "aa2": 4}, "style": {"stroke": "#1F77B4", "strokeWidth": 1, "dashed": false, "opacity": 0.9}, "directed": true}])

### .addEdge(src_id, src_type, tgt_id, tgt_type, etype, attrObj, styleObj, direc)

Add an edge to the existing graph

graph.addEdge("8", "usr", "11", "movie", "bbd", {"aa1": 3, "aa2": 4}, {"stroke": "#1F77B4", "strokeWidth": 1, "dashed": false, "opacity": 0.9}, true)

### .autoFit()

Center the viewport and scale it so that everything fits in the window defined by width and height

graph.autoFit()

### .fitDiv(divSelector)

Fit the graph in the specified div

graph.fitDiv("#fit")


### .highLight(nodes, edges)

Highlight the specified nodes and edges by applying .unhighlighted to the rest nodes and edges, no others ndoes/edges

graph.highLight([["1", "tag"], ["5", "movie"]], [["8", "usr", "4", "tag", "dff"]])

### .unHighlight()

Cancel the .unhighlighted from nodes or edges

graph.unHighlight()

### .removeNode(node_id, node_type)

Remove a node with id and type from the graph

graph.removeNode("11", "usr")

### .removeEdge(src_id, src_type, tgt_id, tgt_type, etype)

Remove an edge from the graph

graph.removeEdge("8", "usr", "11", "movie", "bbd")

### .hideNodes(nodes)

Hide the specified nodes

graph.hideNodes([["1", "tag"], ["7", "tag"]])

### .hideEdges(edges)

Hide the specified edges

graph.hideEdges([["4", "tag", "0", "usr", "adx"]])

### .setNodeLabel(node_id, node_type, listLabel)

Display a set of attribute values for a specified node

graph.setNodeLabel("6", "usr", ["a1"])

### .setEdgeLabel(src_id, src_type, tgt_id, tgt_type, list_of_labels)

Display a set of attribute values for a specified edge

graph.setEdgeLabel("2", "usr", "9", "tag", "ssb", ["aa1", "aa2"])

### .setNodeTypeLabel(type, listLabel)

Display a set of attribute values for a set of node with the same type

graph.setNodeTypeLabel("usr", ["type"]), or graph.setNodeTypeLabel("usr", ["a1", "a2"])

### .setEdgeTypeLabel(type, list_of_labels)

Display a set of attribute values for a set of edges with the same type

graph.setEdgeTypeLabel("bbc", ["aa1", "aa2"])

### .applyLayout(layoutAlgorithm)

Apply a new layout algorithm to the graph;

layoutAlgorithm is a function including how to assign new positions for nodes. It could be defined outside of the library, for example,

   function hierarchyLayout(nodes) {
       // find root node
       // can change on your own
       var root = nodes.filter(function(n){ return n.index == 6})[0]; //1, 5, 6
       // root node will be on the top of window
       root.fixed = true;
       root.x = 700; // could be width / 2;
       root.y = 120; // the top y position

       var separation_x = 130,
           separation_y = 80;

       var secondLvNodes = graph.getAssociatedNodes(root.id, root.type);
       var deepLv = 2;
       recursiveSetPosition(secondLvNodes, deepLv);

       function recursiveSetPosition(curNodes, depth) {

           var nextDepthNodes = [];

           var widthCount = 0;

           curNodes.forEach(function(n, i) {
               if (!n.fixed) {
                   n.fixed = true;
                   n.x = (i - widthCount) * separation_x + root.x;
                   n.y = separation_y * depth + root.y;

                   nextDepthNodes = nextDepthNodes.concat(graph.getAssociatedNodes(n.id, n.type));

               } else {
                   widthCount += 1;
               }

           });

           if (nextDepthNodes.length > 0) {

               recursiveSetPosition(nextDepthNodes, ++depth);

           }
       }
    }

    Then, we can update the layout of the graph with

    graph.applyLayout(hierarchyLayout, graph.nodes);


## Extension

### Add methods to NLGraph

```javascript
NLGraph.prototype.newMethod = function() {
    // ...
}
```

### Add properties to NLGraph

```javascript
NLGraph.prototype.newProp = "new_property";
```

## Integration

### Add it to GraphFactory

```javascript
var GraphFactory = (function (graph) {
    // would be private
    var oldPublicMethod = graph.publicMethod;

    graph.NLGraph = NLGraph;
     
    graph.TimeLine = ...;
 
    // export
    return graph;
}(GraphFactory));
```

### GraphFactory definition

```javascript
var GraphFactory = (function () {
    var graphFactory = {},
        privateVariable = 1;
 
    function privateMethod() {
        // ...
    }
 
    graphFactory.publicProperty = 1;
    // this is just a simple example
    graphFactory.NLGraph = NLGraph;
    // We can also use Factory Pattern to create different types of graph
    };
 
    // export
    return graphFactory;
}());
```


## NOTES

### Changing node/edge styles

Even apis can do it, I recommend using css to do so. I have left the node.type/edge.etype as class name of the svg element. For example, in the nlgraph.css, you can modify 

```html
.nl_graph .node .movie {
   fill: ...!important;
   stroke: ... !important;
   ...
}
```
Do not forget to append "!important" to the end of each style.

### Brushing, Zooming, and Dragging

Only one of them can work at a time.
