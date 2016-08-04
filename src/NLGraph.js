/**
 * NLGraph JavaScript Library
 * http://www.graphsql.com
 *
 * NLGraph stands for node-link graph. It was built on top of D3.js
 *
 * Copyright 2015 GraphSQL, Inc.
 *
 * @author Chong Zhang
 *
 * @module GraphFactory/NLGraph
 *
 * Date: 2015-06-10
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
 *
 *
 *
 * Advantages:
 *
 * 1. Multi-edges rendering between two nodes
 * 2. Readable edge labeling
 * 3. Multiple shapes rendering for nodes/links
 * 4. Flexible event handling
 * 5. Individual node/link styling
 * 6. Snapshotting
 * 7. Ease of maintenance and extension
 *
 * Extension:
 *
 * 1. Add methods to NLGraph
 *  NLGraph.prototype.newMethod = function() {
 *      // ...
 *  }
 *
 * 2. Add properties to NLGraph
 *  NLGraph.prototype.newProp = "new_property";
 *
 * Integration:
 *
 * Add it to GraphFactory
 * var GraphFactory = (function (graph) {
 *   // would be private
 *   var oldPublicMethod = graph.publicMethod;
 *
 *   graph.NLGraph = NLGraph;
 *
 *   graph.TimeLine = ...; // TOOD
 *
 *   // export
 *   return graph;
 * }(GraphFactory));
 *
 *
 * GraphFactory definition
 * var GraphFactory = (function () {
 *   var graphFactory = {},
 *       privateVariable = 1;
 *
 *   function privateMethod() {
 *       // ...
 *   }
 *
 *   graphFactory.publicProperty = 1;
 *
 *   // this is just a simple example
 *   graphFactory.NLGraph = NLGraph;
 *
 *   // We can also use Factory Pattern to create different types of graph
 *
 * };
 *
 * // export
 * return graphFactory;
 * }());
 *
*/

/**
 * Node-link graph class
 * @param {string} container    - The target element with CSS selector
 * @param {object[]} n      - The node array {
 *                                          id: string,
 *                                          type: string,
 *                                          attr: {key, val},
 *                                          style: {key, val}, key: [
 *                                                                      size,
 *                                                                      shape,
 *                                                                      fill,
 *                                                                      stroke,
 *                                                                      strokeWidth,
 *                                                                      dashed,
 *                                                                      opacity,
 *                                                                      label: {stroke, fill}
 *                                                                  ]
 *                                         }
 * @param {object[]} l      - The link array {
 *                                          source: {id, type},
 *                                          target: {id, type},
 *                                          etype: string,
 *                                          attr: {key, val},
 *                                          style: {key, val}, key: [
 *                                                                      stroke,
 *                                                                      strokeWidth,
 *                                                                      dashed,
 *                                                                      opacity
 *                                                                  ]
 *                                          directed: bool
 *                                        }
 * @param {object[]} options - The default settings
 * @constructor
 */
var NLGraph = function(container, n, l, options) {
    'use strict';

    /**
     *
     * Default settings
     * @private
     */
    this.defaults_= {
        width: 1000,
        height: 800,

        force: {
            charge: -240,
            linkStrength: 1,
            friction: 0.9,
            linkDistance: 100,
            gravity: 0.05,
            theta:0.1,
            coolingAlpha: 0,
            collisionAlpha: 0.9,
            collisionRadius: 0,
            // the speed of simulation
            // tested values: 1000 for static layout, 10 for dynamic layout
            tickPerFrame: 10,
            // tickPerFrame and staticLayout together determine the display of animation
            staticLayout: false
        },

        initialScale: 1,
        brushingStatus: false,
        zoomLens: false,
        autofit: false,
        lineTensionDistance: 25,
        lineConvergingOffset: 5,
        lineDispearDistance: 72,
        //linear, basis
        lineCurve: "liner",
        // [min_scale, max_scale]
        zoomScaleExtent: [0.2, 10]

    };

    /**
     * container element
     * @private
     */
    this.container_ = container;

    /**
     * option cache
     * @private
     */
    this.opts_ = {};

    options = options || {};

    this.opts_.width = options.width || this.defaults_.width;
    this.opts_.height = options.height || this.defaults_.height;

    this.opts_.color = d3.scale.category20();
    this.opts_.colors = options.colors || {};

    this.opts_.initialScale = options.initialScale || this.defaults_.initialScale;
    this.opts_.zoomScaleExtent = options.zoomScaleExtent || this.defaults_.zoomScaleExtent;

    this.opts_.zoomLens = options.zoomLens || this.defaults_.zoomLens;
    this.opts_.autofit = options.autofit || this.defaults_.autofit;

    this.opts_.lineTensionDistance = options.lineTensionDistance || this.defaults_.lineTensionDistance;
    this.opts_.lineConvergingOffset = options.lineConvergingOffset || this.defaults_.lineConvergingOffset;

    this.opts_.lineCurve = options.edgeCurve || this.defaults_.lineCurve;

    this.opts_.lineDispearDistance = options.lineDispearDistance || this.defaults_.lineDispearDistance;

    this.opts_.force = {};
    this.opts_.force.linkStrength = options.forceLinkStrength || this.defaults_.force.linkStrength;
    this.opts_.force.friction = options.forceFriction || this.defaults_.force.friction;
    this.opts_.force.linkDistance = options.forceLinkDistance || this.defaults_.force.linkDistance;
    this.opts_.force.charge = options.forceCharge || this.defaults_.force.charge;
    this.opts_.force.gravity = options.forceGravity || this.defaults_.force.gravity;
    this.opts_.force.theta = options.forceTheta || this.defaults_.force.theta;
    this.opts_.force.coolingAlpha = options.forceCoolingAlpha || this.defaults_.force.coolingAlpha;
    this.opts_.force.collisionAlpha = options.forceCollisionAlpha || this.defaults_.force.collisionAlpha;
    this.opts_.force.collisionRadius = options.collisionRadius || this.defaults_.force.collisionRadius;
    this.opts_.force.tickPerFrame = options.forceSpeed || this.defaults_.force.tickPerFrame;
    this.opts_.force.staticLayout = options.forceStatic || this.defaults_.force.staticLayout;


    this.opts_.brushingStatus = options.brushing || this.defaults_.brushingStatus;


    this.nodes = n;
    this.links = l;

    this.nodeIdTypeConcChar_ = "-";
    this.linkKeyConcChar_ = "_";


    this.shiftKey = null;

    this.nodeRadiusScale = d3.scale.sqrt().range(NLGraph.NODE_RADIUS_RANGE);


    var line = d3.svg.line()
            .interpolate(this.opts_.lineCurve)
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; });


    /**
     * Initialize zoom, widgets according to options, create containers, and read data to bind
     *
     * @private
     */
    this.init_ = function() {
        var self = this;

        var container = this.getContainer_();
        container.html("");


        this.initZoom_();


        this.fisheye = d3.fisheye.circular()
            .radius(100);

        //Also, I see a self.shiftKey usage.. please clarify what this means.
        //Also, please explain what previouslySelected means and how it is used
        //Are you using highlight color to render selected nodes and edges?
        //
        // self.shiftKey is used as a control key to select/deselect multiple nodes
        // previouslySelected is to store whether a node was selected previously. Specifically,
        // if the node was selected in previous brushing
        //      and if shiftKey was pressed at this time (multi-select mode),
        //           then the previouslySelected would be true,
        //               so if the node is within the brushing extent in next time,
        //                  then the node will be deselected (deselect works on already selected nodes).
        //               so if the node is NOT within the brushing extent in next time,
        //                  then the node will still be selected
        //      and if shiftKey was NOT pressed at this time (single-select mode),
        //           then the previouslySelected would be false,
        //               so if the node is within the brushing extent in next time,
        //                  then the node will be selected.
        //               so if the node is NOT within the brushing extent in next time,
        //                  then the node will still be deselected
        //
        // if the node was NOT selected in previous brushing
        //      and if shiftKey was pressed at this time (multi-select mode),
        //           then the previouslySelected would be false,
        //               so if the node is within the brushing extent in next time,
        //                  then the node will be selected.
        //               so if the node is NOT within the brushing extent in next time,
        //                  then the node will still be deselected
        //      and if shiftKey was NOT pressed at this time (single-select mode),
        //           then the previouslySelected would be false,
        //               so if the node is within the brushing extent in next time,
        //                  then the node will be selected.
        //               so if the node is NOT within the brushing extent in next time,
        //                  then the node will still be deselected
        //
        // The predefined CSS class "selected" would be applied when a node was selected
        this.multiSelect = d3.svg.brush()
            .x(d3.scale.identity().domain([0, this.opts_.width]))
            .y(d3.scale.identity().domain([0, this.opts_.height]))
            .on("brushstart", function() {

                self.vertices.each(function(d) {
                    d.previouslySelected = self.shiftKey && d.selected;
                });
                self.edges.each(function(d) { d.previouslySelected = self.shiftKey && d.selected; });
            })
            .on("brush", function() {

                var extent = d3.event.target.extent();
                self.vertices.select(".shape").classed("selected", function(d) {

                    return d.selected = d.previouslySelected ^ checkSelExtent(extent, d.x, d.y);

                });


                self.edges.classed("selected", function(d) {
                    var isToSel = d.previouslySelected ^
                            (checkSelExtent(extent, d.srcOuterPoint[0], d.srcOuterPoint[1]) &&
                             checkSelExtent(extent, d.tgtOuterPoint[0], d.tgtOuterPoint[1]));


                    var marker_start = "arrow_s" + d.key,
                        marker_end = "arrow_e" + d.key;

                    d3.select("#" + marker_end).select("path").classed("selected", isToSel);
                    d3.select("#" + marker_start).select("path").classed("selected", isToSel);

                    return d.selected = isToSel;

                });

            })
            .on("brushend", function() {
                d3.event.target.clear();
                d3.select(this).call(d3.event.target);


            });

        this.trueZoomLens = function() {
            d3.event.stopPropagation();
            self.fisheye.focus(d3.mouse(this));

            self.vertices.each(function(d){
                d.fisheye = self.fisheye(d);
            })
            .attr("transform", function(d) {
                return "translate(" + d.fisheye.x + "," + d.fisheye.y + ") scale(" + d.fisheye.z + ")";
            });

            self.linkDrawing_();

        };


        var zoomWidth = (this.opts_.width - this.opts_.initialScale * this.opts_.width)/ 2,
            zoomHeight = (this.opts_.height - this.opts_.initialScale * this.opts_.height)/2;

        // Please clarify what trueZoom and nullZoom stand for

        // trueZoom_ is a d3 zoom behavior. It register the specified listener to receive events of
        // the specified type from the zoom behavior. The event types can be zoomstart, zoom, zoomend.
        // The signature is d3.behavior.zoom().on(type, listener)
        // It can be applied to selected SVG using selection.call e.g, svg.call(this.trueZoom_)
        // So if want to disable zooming, just empty the listener by setting it to null.
        // For more details about d3 zoom, please refer to https://github.com/mbostock/d3/wiki/Zoom-Behavior
        // PS: zoom and brush can't work at the same time, reference is https://github.com/dc-js/dc.js/wiki/Zoom-Behaviors-Combined-with-Brush-and-Range-Chart
        this.trueZoom_ = this.zoomL.on("zoom", bind(this, this.refreshZoom_));
        this.nullZoom_ = d3.behavior.zoom().on("zoom", null);

        var svg = container.append("svg")
            .attr("viewBox", "0 0 " + this.opts_.width + " " + this.opts_.height)
            .attr("class", NLGraph.BASE_CONTAINER_CLASS)
            .attr("preserveAspectRatio", "xMinYMin meet");


        // why are you appending g here? Please clarify in comments

        // The SVG <g> element is used to group nodes or links together.
        // The purpose of grouping is:
        // 1. child elements may have a same CSS class, e.g. nodes
        // 2. we can transform the whole group of elements as if it was a single element, then the attributes applied would be inherited by all of its child elements.
        // 3. we can reuse/select it as if it was a single element
        // The <svg> because it is the root element of all SVG shapes
        // For more details, please refer to https://developer.mozilla.org/en-US/docs/Web/SVG or http://www.w3.org/TR/SVG/
        this.parent = svg.append("g");
        this.mouseEvtTargetRect = this.parent.append("rect")
            .attr("width", this.opts_.width)
            .attr("height", this.opts_.height)
            .style("fill", "none")
            .style("pointer-events", "all");


        // Please explain what is happening here
        // brushing appears to involve g and this needs further clarification

        // Zoom and brush can't work at the same time, reference is https://github.com/dc-js/dc.js/wiki/Zoom-Behaviors-Combined-with-Brush-and-Range-Chart
        // so if the current brushingStatus is true, we have to disable the zoom associated with the <svg> in a way like the above comments, calling the behavior with null listener;
        //    if the current brusthingStatus is false, we need to enable the zoom and call the behavior with actual listener
        // brushing or zooming will involve the root <svg>, not <g>
        //
        if (this.opts_.brushingStatus) {
            svg.call(this.nullZoom_);

            this.brush_ = this.parent.append("g")
                .datum(function() { return {selected: false, previouslySelected: false}; })
                .attr("class", "brush")
                .call(this.multiSelect );



        } else {
            svg.call(this.trueZoom_);
            d3.select(".brush").remove();


        }

        if(this.opts_.zoomLens){
            this.parent.on("mousemove", this.trueZoomLens);

        } else {

        }
        svg.on("dblclick.zoom", null);

        this.root = svg;

        if (!this.opts_.autofit) {
            this.zoomL.translate([zoomWidth, zoomHeight]).scale(this.opts_.initialScale || 1);
        }

        d3.select("body")
            .attr("tabindex", 1)
            .on("keydown.brush", bind(this, this.keyDown_))
            .on("keyup.brush", bind(this, this.keyUp_))
            .each(function() { this.focus() });

        this.readData_(this.nodes, this.links);

        this.initStatus_ = true;


    };

    /**
     * Keyboard press down event handling
     * for multi-select
     *
     * @private
     */
    this.keyDown_ = function () {
        this.shiftKey = d3.event.shiftKey;
    };

    /**
     * Keyboard press up event handling
     * for multi-select
     *
     * @private
     */
    this.keyUp_ = function () {
        this.shiftKey = d3.event.shiftKey;
    };


    /**
     * Toggle brush to select nodes.
     * It will disable zooming and dragging.
     * (reason: when zoom and brush are both enabled, manipulating the brush causes graph to pan from side to side)
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.toggleBrushing = function (){

        if (!this.opts_.brushingStatus ) {
            this.opts_.brushingStatus = true;
            this.mulSelMode = true;
            this.root.call(this.nullZoom_);

            // please document the need for selected and previouslySelected.
            // what do these variables indicate
            //
            // Please refer to init_() for more explanations.
            this.brush_ = this.parent.append("g")
                .datum(function() { return {selected: false, previouslySelected: false}; })
                .attr("class", "brush")
                .call(this.multiSelect );

        } else {
            this.mulSelMode = false;
            this.opts_.brushingStatus = false;
            this.root.call(this.trueZoom_);
            d3.select(".brush").remove()
        }

        return this;

    };

    /**
     * Toggle zoomlens to zoom in small area.
     * It will disable dragging and brushing.
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.toggleZoomLens = function() {

        if (this.opts_.zoomLens ) {
            this.opts_.zoomLens = false;

            this.vertices
                .each(function(d) { d.fisheye = false; });

            this.parent.on("mousemove", null);

        } else {
            this.opts_.zoomLens = true;
            this.parent.on("mousemove", this.trueZoomLens);

        }

        return this;
    };

    /**
     * Check if x,y is within the extent
     *
     * @param extent, [[topLeft.x, topLeft.y], [bottomRight.x, bottomRight.y]]
     * @param x, x coordinates
     * @param y, y coordinates
     * @returns {boolean}
     */
    function checkSelExtent(extent, x, y) {
        if(extent){
            return extent[0][0] <= x && x < extent[1][0]
            && extent[0][1] <= y && y < extent[1][1]
        }

    }

    /**
     * Get bound data of nodes in multi-select mode
     *
     * @returns {Array}
     *
     * @export
     */
    this.getMultiSelectedNodes = function (){
        var sel = [];
        if (this.mulSelMode) {
            this.vertices.each(function(d) {
                if(d.selected) {
                    sel.push(d);
                }
            });
        }

        return sel;
    };

    /**
     * Get bound data of links in multi-select mode
     *
     * @returns {Array}
     *
     * @export
     */
    this.getMultiSelectedLinks = function (){
        var sel = [];
        if (this.mulSelMode) {
            this.edges.each(function(d) {
                if(d.selected) {
                    sel.push(d);
                }
            });

        }

        return sel;

    };


    /**
     * Center the graph on a node, if no node specified,
     * the mass center of the graph is used.
     *
     * @param node
     *
     * @private
     */
    this.center_ = function(node) {

        if (!node) {
            if (!this.massCenter) {
                this.computeCenterCoords_();
            }

            node = this.massCenter;
        }

        this.translateTo([this.opts_.width/2, this.opts_.height/2], node);
        return this;
    };


    /**
     * Center the graph on a node, if no node specified,
     * the mass center of the graph is used.
     *
     * @param nodeId
     * @param nodeType
     * @returns {NLGraph}
     *
     * @export
     */
    this.center = function(nodeId, nodeType) {
        if (!this.isRendered()) {
            return this;
        }

        var node = this.getNodeByKey(nodeId, nodeType);

        if (node) {
            this.center_([node.x, node.y]);
        } else {
            this.center_();
        }

        this.refreshZoom_(true);

        return this;
    };

    /**
     * Calculate the mass center of the graph
     *
     * @private
     */
    this.computeCenterCoords_ = function() {

        var xMass=0, yMass=0, totalSize=0;

        this.vertices.select(".shape").each(function(d) {
          var size = d.shapeSize;
          xMass += d.x * size;
          yMass += d.y * size;
          totalSize += size;
        });

        this.xCenter = xMass / totalSize;
        this.yCenter = yMass / totalSize;
        this.massCenter = [this.xCenter, this.yCenter];

        return this.massCenter;
    };

    /**
     * Init the zoom listener
     *
     * @private
     */
    this.initZoom_ = function() {
        var self = this;

        var x_scale = d3.scale.linear().domain([0, this.opts_.width]).range([0, this.opts_.width]);
        var y_scale = d3.scale.linear().domain([0, this.opts_.height]).range([0, this.opts_.height]);

        this.zoomL = d3.behavior.zoom().x(x_scale).y(y_scale);
        if (this.opts_.initialScale) {
            this.zoomL = this.zoomL.scale(this.opts_.initialScale);
        }


    };


    /**
     * Read, extract, and parse the data structure
     *
     * @param nodes
     * @param links
     *
     * @private
     */
    this.readData_ = function(nodes, links) {
        //Please document exactly what these data structures contain with examples
        //Folks should be able to look at the structures and code to understand what is happening
        //
        // First, the key for node is a concatenated string of the value from the map of node.id and the value from the map of node.type
        // e.g., node_1 = {id: "123**#", type: "ty-45**&"} and nodeIdTypeConcChar_ = "-"
        // we will have a map with {key: node.id, val: unique index counter},
        // the key for the node would be "1-1"
        //
        // Similarly, we will have a map for link.etype
        //
        // Then, because a link connects source and target,
        // the key for a link is a concatenated string of source.key, target.key, and etype,
        // e.g., link_1 connects node_1 and node_2,
        //       node_1.key is 1-1, node_2.key is 2-1 (they have the same nodeType),
        //       the key for the etype "1", and
        //       linkKeyConcChar_ is "_"
        // then the key for the link would be "1-1_2-1_1"
        var self = this,
            // {key: node.key, val: original node i.e. {id: ..., type: ..., attr: ..., style: ...}}
            nodesObj = {},
            // {key: link.key, val: original link}
            linksObj = {},
            // {key: node.key val:{key: nodei.key, val: true}}
            incoming = {},
            // {key: node.key val:{key: nodei.key, val: true}}
            outgoing = {},
            // {key: source.key + self.linkKeyConcChar_ + target.key, val: index counter of link}
            connectedMap = {},
            // {key: id of node, val: unique index counter of node}
            nodeIDsMap = {},
            // {key: type of node, val: unique index counter of node}
            nodeTypesMap = {},
            // {key: type of link, val: unique index counter of node}
            linkTypesMap = {},

            maxNodeSize = 0;

        var nodeSizeFunc = function(size) {
            var sizeScale = d3.scale.pow().exponent(1)
                .domain([1,100])
                .range([8,24]);

            return Math.PI * Math.pow( sizeScale(size) || NLGraph.NORMAL_BASE_NODE_SIZE, 2);


        };


        nodes.forEach(function (d, i) {
            d.shapeSize = nodeSizeFunc(d.style.size);
            d.radius = Math.sqrt(d.shapeSize/2.0);
            if (!nodeIDsMap.hasOwnProperty(d.id)) nodeIDsMap[d.id] = i;
            if (!nodeTypesMap.hasOwnProperty(d.type)) nodeTypesMap[d.type] = i;
            d.key = nodeIDsMap[d.id] + self.nodeIdTypeConcChar_ + nodeTypesMap[d.type];
        });

        nodes.forEach(function(node) {
            maxNodeSize = Math.max(maxNodeSize, +node.radius);
            nodesObj[node.key] = nodesObj[node.key] || node;

        });


        // read link info, record outgoing and incoming nodes, and build link list
        links.forEach(function(link, i) {
            var n0 = link["source"],
                n1 = link["target"],
                n0Key = nodeIDsMap[n0.id] + self.nodeIdTypeConcChar_ + nodeTypesMap[n0.type],
                n1Key = nodeIDsMap[n1.id] + self.nodeIdTypeConcChar_ + nodeTypesMap[n1.type],
                source = nodesObj[n0Key],
                target = nodesObj[n1Key];

            if (!linkTypesMap.hasOwnProperty(link.etype)) linkTypesMap[link.etype] = i;

            link.key = n0Key + self.linkKeyConcChar_ + n1Key + self.linkKeyConcChar_ + linkTypesMap[link.etype];

            linksObj[link.key] = linksObj[link.key] || link;

            connectedMap[n0Key + self.linkKeyConcChar_ + n1Key] = i;



            // if not find any node in a link, the passed data has a problem.
            if (!source || !target) return;

            // add the source node to the outgoing nodes
            if (!(n0.key in outgoing)) {
                outgoing[n0Key] = {};
            }

            // add the target node to the the incoming nodes
            if (!(n1.key in incoming)) {
                incoming[n1Key] = {};
            }

            outgoing[n0Key][n1Key] = true;
            incoming[n1Key][n0Key] = true;

            // associate node with link
            link.source = source;
            link.target = target;


        });


        // Count links between two nodes
        // e.g., {0-usr_1-tag: 2, 0-usr_2-usr: 1, ...}
        // Note: only store one of 5-movie_7-tag or 7-tag_5-movie
        var multiLinksNumCoord = links.map(function(l){
            return [l.source.key, l.target.key];
             })
            .reduce(function(last, now) {
                var src_tgt_key = now[0] + self.linkKeyConcChar_ + now[1],
                    tgt_src_key = now[1] + self.linkKeyConcChar_ + now[0];
                var existingKey = last.hasOwnProperty(src_tgt_key) ? src_tgt_key : tgt_src_key;

                if (last.hasOwnProperty(existingKey) ) {
                    last[existingKey] += 1;

                } else {
                    last[existingKey] = 1;
                }
                return last;
            }, {});



        // used to assign index for each link
        var copymultiLinksNumCoord = {};
        Object.keys(multiLinksNumCoord).forEach(function(key) {
            copymultiLinksNumCoord[key] = multiLinksNumCoord[key];
        });

        links.forEach(function (l){
            var prefixKey_src_tgt = l.source.key + self.linkKeyConcChar_ + l.target.key,
                prefixKey_tgt_src = l.target.key + self.linkKeyConcChar_ + l.source.key;
            var existingKey = copymultiLinksNumCoord.hasOwnProperty(prefixKey_src_tgt) ? prefixKey_src_tgt : prefixKey_tgt_src;

            l.linkIndex = --copymultiLinksNumCoord[existingKey];
            l.totalNoLinks = multiLinksNumCoord[existingKey];
            var posAry = computeLinePos(l.totalNoLinks);
            l.linkPos = posAry[l.linkIndex];

        });


        this.nodes = nodes;
        this.links = links;
        this.incomingNodes = incoming;
        this.outgoingNodes = outgoing;
        this.nodesObj = nodesObj;
        this.linksObj = linksObj;
        this.nodeIDsMap = nodeIDsMap;
        this.nodeTypesMap = nodeTypesMap;
        this.linkTypesMap = linkTypesMap;


        this.connectedMap = connectedMap;

        this.multiLinksNumCoord = multiLinksNumCoord;

        this.nodeRadiusScale.domain(d3.extent(nodes, function(d){ return d.radius}));
    };


    /**
     * Add a node and associated edges to the existing graph
     *
     * @param id
     * @param type
     * @param attrObj
     * @param styleObj
     * @param assoEdges
     * @returns {NLGraph}
     *
     * @export
     */
    this.addNode = function (id, type, attrObj, styleObj, assoEdges) {
        var isExisting = false;
        // will skip style settings
        var fakeObj = {id: id, type: type, attr: attrObj};
        for (var i = 0; i < this.nodes.length; ++i) {
            var curNode = this.nodes[i];
            if(objectEquals(fakeObj, curNode)){
                isExisting = true;
                break;
            }
        }

        if(isExisting) return this;

        this.nodes.push({
            "id": id,
            "type": type,
            "attr": attrObj,
            "style": {
                "size": styleObj.size || 100,
                "shape": styleObj.shape || "square",
                "fill": styleObj.fill || "#ff5500",
                "stroke": styleObj.stroke || "#ccc",
                "strokeWidth": styleObj.strokeWidth || 1,
                "dashed": styleObj.dashed || true,
                "opacity": styleObj.opacity || 1
            }
        });

        for (var j = 0; j < assoEdges.length; ++j) {
            var l = assoEdges[j];
            this.links.push({
                "source": {"id": l.source.id, "type": l.source.type },
                "target": {"id": l.target.id, "type": l.target.type},
                "etype": l.etype,
                "attr": l.attr,
                "style": {
                    "stroke": l.style.stroke || "#ccc",
                    "strokeWidth": l.style.strokeWidth || 1,
                    "dashed": l.style.dashed || true,
                    "opacity": l.style.opacity || 1
                },
                "directed": l.directed || false
            })
        }

        this.readData_(this.nodes, this.links);

        this.updateGraph_();

        return this;

    };

    /**
     * Remove a node and associated links
     *
     * @param id
     * @param type
     * @returns {NLGraph}
     *
     * @export
     */
    this.removeNode = function (id, type) {
        var self = this;

        var removeIdx = this.nodes.map(function(item) { return item.key; }).indexOf(self.nodeIDsMap[id] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[type]);

        if (removeIdx == -1) return this;

        this.nodes.splice(removeIdx, 1);

        // document what is happening here
        //
        // Obviously, the below code is to remove associated edges
        for(var i = 0; i < this.links.length; ++i) {
            var l = this.links[i];
            if ((l.source.id == id && l.source.type == type) || (l.target.id == id && l.target.type == type)) {
                this.links.splice(i, 1);
            }
        }



        this.readData_(this.nodes, this.links);

        this.updateGraph_();

        return this;

    };


    /**
     * Add an edge to the graph
     *
     * @param srcid
     * @param srctype
     * @param tgtid
     * @param tgttype
     * @param etype
     * @param attrObj
     * @param styleObj
     * @param direc
     * @returns {NLGraph}
     *
     * @export
     */
    this.addEdge = function (srcid, srctype, tgtid, tgttype, etype, attrObj, styleObj, direc) {
        var isExisting = false;
        for (var i = 0; i < this.links.length; ++i) {
            if (this.links[i].source.id == srcid
                    && this.links[i].source.type == srctype
                    && this.links[i].target.id == tgtid
                    && this.links[i].target.type == tgttype
                    && this.links[i].etype == etype) {

                isExisting = true;
                break;
            }
        }

        if(isExisting) return this;

        this.links.push({
            "source": {"id": srcid, "type": srctype },
            "target": {"id": tgtid, "type": tgttype},
            "etype": etype,
            "attr": attrObj,
            "style": {
                "stroke": styleObj.stroke || "#ccc",
                "strokeWidth": styleObj.strokeWidth || 1,
                "dashed": styleObj.dashed || true,
                "opacity": styleObj.opacity || 1
            },
            "directed": direc || false

        });

        this.readData_(this.nodes, this.links);

        this.updateGraph_();

        return this;

    };

    /**
     * Remove a edge from the graph
     *
     * @param srcid
     * @param srctype
     * @param tgtid
     * @param tgttype
     * @param etype
     * @returns {NLGraph}
     *
     * @export
     */
    this.removeEdge = function(srcid, srctype, tgtid, tgttype, etype) {
        var self = this;

        var removeIdx = this.links.map(function(item) {return item.key; })
            .indexOf(self.nodeIDsMap[srcid] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[srctype]
            + self.linkKeyConcChar_
            + self.nodeIDsMap[tgtid] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[tgttype]
            + self.linkKeyConcChar_ + self.linkTypesMap[etype]);

        if (removeIdx == -1) return this;

        this.links.splice(removeIdx, 1);

        this.readData_(this.nodes, this.links);

        this.updateGraph_();

        return this;

    };

    /**
     * Fit the graph to a specific div
     * @param divSelector
     * @returns {NLGraph}
     *
     *
     * @export
     *
     */

    this.fitDiv = function(divSelector){
        var w = +d3.select(divSelector).style("width").replace("px", ""),
            h = +d3.select(divSelector).style("height").replace("px", "");
        if(w == 0 || h == 0) return;

        var
        min_x = d3.min(this.nodes.map(function(d) {return d.x - d.bbox.width / 2.0;})),
        min_y = d3.min(this.nodes.map(function(d) {return d.y - d.bbox.height / 2.0;})),

        max_x = d3.max(this.nodes.map(function(d) {return d.x + d.bbox.width / 2.0;})),
        max_y = d3.max(this.nodes.map(function(d) {return d.y + d.bbox.height / 2.0;})),

        mol_width = max_x - min_x,
        mol_height = max_y - min_y,

        // how much larger the drawing area is than the width and the height
        width_ratio = this.opts_.width / mol_width,
        height_ratio = this.opts_.height / mol_height,

        // we need to fit it in both directions, so we scale according to
        // the direction in which we need to shrink the most
        min_ratio = Math.min(width_ratio, height_ratio) * 0.8,

        // the new dimensions of the molecule
        new_mol_width = mol_width * min_ratio,
        new_mol_height = mol_height * min_ratio,

        // translate so that it's in the center of the window
        x_trans = -(min_x) * min_ratio + (w - new_mol_width) / 2,
        y_trans = -(min_y) * min_ratio + (h - new_mol_height) / 2;

         // do the actual moving
        this.parent.transition().attr("transform",
            "translate(" + [x_trans, y_trans] + ")" + " scale(" + min_ratio + ")");

        // tell the zoomer what we did so that next we zoom, it uses the
        // transformation we entered here
        this.zoomL.translate([x_trans, y_trans]).scale(min_ratio);

        return this;
    };

    /**
     * Center the viewport and scale it so that everything fits in the window defined by width and height
     * Adapted from https://gist.github.com/pkerpedjiev/0389e39fad95e1cf29ce
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.autoFit = function(){

        //no molecules, nothing to do
        if (this.nodes.length === 0)
            return this;

        // what does this method do? Please describe
        //
        // adapted from Adapted from https://gist.github.com/pkerpedjiev/0389e39fad95e1cf29ce
        // store fitCenter and zoomScale
        this.computeFitCenterAndScale();

        // do the actual moving
        this.parent.transition().attr("transform",
            "translate(" + this.fitCenter + ")" + " scale(" + this.fitScale + ")");

        // tell the zoomer what we did so that next we zoom, it uses the
        // transformation we entered here
        this.zoomL.translate(this.fitCenter).scale(this.fitScale);

        return this;

    };


    this.computeFitCenterAndScale = function() {
        var
        min_x = d3.min(this.nodes.map(function(d) {return d.x - d.bbox.width / 2.0;})),
        min_y = d3.min(this.nodes.map(function(d) {return d.y - d.bbox.height / 2.0;})),

        max_x = d3.max(this.nodes.map(function(d) {return d.x + d.bbox.width / 2.0;})),
        max_y = d3.max(this.nodes.map(function(d) {return d.y + d.bbox.height / 2.0;}));

        //console.log("minX: "+ min_x + ", minY: "+min_y + ", maxX: "+max_x + ", maxY: "+ max_y);
        // The width and the height of the graph
        var
        mol_width = max_x - min_x,
        mol_height = max_y - min_y,

        // how much larger the drawing area is than the width and the height
        width_ratio = this.opts_.width / mol_width,
        height_ratio = this.opts_.height / mol_height,

        // we need to fit it in both directions, so we scale according to
        // the direction in which we need to shrink the most
        min_ratio = Math.min(width_ratio, height_ratio) * 0.8,

        // the new dimensions of the molecule
        new_mol_width = mol_width * min_ratio,
        new_mol_height = mol_height * min_ratio,

        // translate so that it's in the center of the window
        x_trans = -(min_x) * min_ratio + (this.opts_.width - new_mol_width) / 2,
        y_trans = -(min_y) * min_ratio + (this.opts_.height - new_mol_height) / 2;

        this.fitCenter = [x_trans, y_trans];
        this.fitScale = min_ratio;
    };




    // Hierarchical layout algorithm
    // It should be put outside of the library, because
    // here is just an example to show the usage
    //
    // suppose you have the layout algorithm outside the library,
    // then call: graph.applyLayout(hierarchyLayout, graph.nodes);
    // will update the layout
    /*
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
    */


    /**
     * Change the default force layout
     *
     * Suppose you have a layout algorithm called 'hierarchyLayout' outside the library (see the above example),
     * then call: graph.applyLayout(hierarchyLayout, graph.nodes);
     * will update the layout
     *
     * @param layoutAlg
     *
     * @export
     */
    this.applyLayout = function(layoutAlg) {
        layoutAlg.apply(null, [].slice.call(arguments, 1));

        this.vertices.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        this.linkDrawing_();
        this.autoFit();


    };



    /**
     * Initialize arrowhead markers, nodes, links, labels, and zoom, and update graph with force layout
     * @returns {NLGraph}
     *
     * @export
     */
    this.render = function() {
        var self = this;

        this.init_();

         // force layout as an example
        var force = d3.layout.force()
            // nodes could space out evenly
            // defined outside or default charge
            .charge(function(d){
                return d.charge || self.opts_.force.charge;
            })
            .linkDistance(this.opts_.force.linkDistance)
            .gravity(this.opts_.force.gravity)
            .friction(this.opts_.force.friction)
            .theta(this.opts_.force.theta)
            .alpha(this.opts_.force.coolingAlpha)
            .size([this.opts_.width, this.opts_.height]);

        force.nodes(this.nodes)
            .links(this.links);

        var predefs = this.parent.append("defs"),
            arrowhead_end = predefs.selectAll(".marker_e"),
            arrowhead_start = predefs.selectAll(".marker_s");

        var vertices = this.parent.append("g").selectAll(".node");

        var edgeGroup = this.parent.append("g"),
            edges = edgeGroup.selectAll(".link"),
            edgeLabel = edgeGroup.selectAll(".label");




        this.arrowhead_end = arrowhead_end;
        this.arrowhead_start = arrowhead_start;


        this.vertices = vertices;


        this.edges = edges;
        this.edgeLabel = edgeLabel;


        this.layout = force;

        this.updateGraph_();


        return this;

    };


    /**
     * Not only update the graph, but
     * Do several things: add, update, and remove
     *
     * @private
     */
    this.updateGraph_ = function() {
        var self = this;

        // The data() operator in D3.js is probably the most important concept.
        // The data() joins a dataset with an element and returns element selection which include
        // two references called enter and exit sub-selections. Enter() and exit() allow us to deal with
        // changes to the attached data dynamically.
        //
        // enter().append creates new element
        // for data items that are already attached by the element(s), the attributes will be updated according to the datum
        // for data items that are not attached by the element(s), the new element will be created and the attributes will also be updated accordingly
        //
        // exit() selection contains data items that will be removed from the bound dataset
        // exit().remove() removes elements from the DOM, it affects only elements that don't have bound data to them
        //
        // For more information about enter(), please refer to https://github.com/mbostock/d3/wiki/Selections#enter
        // about exit(), refer to https://github.com/mbostock/d3/wiki/Selections#exit
        this.arrowhead_end = this.arrowhead_end.data(this.layout.links(), function(d) { return d.key; });

        this.arrowhead_end.enter().append("marker")
            .attr("class", "marker_e")
            .attr("id", function(d) {
                return "arrow_e" + d.key;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 9)
            .attr("refY", -0.1)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class", function(d) { return d.etype; })
            .style("fill", function(d) { return d.style.stroke; });


        this.arrowhead_end.exit().remove();

        this.arrowhead_start = this.arrowhead_start.data(this.layout.links(), function(d) { return d.key; });

        this.arrowhead_start
            .enter().append("marker")
            .attr("class", "marker_s")
            .attr("id", function(d) {
                return "arrow_s" + d.key;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 9)
            .attr("refY", -0.1)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0L10,-5L10,5")
            .attr("class", function(d) { return d.etype; })
            .style("fill", function(d) { return d.style.stroke; });

        this.arrowhead_start.exit().remove();


        this.edges = this.edges.data(this.layout.links(), function(d) { return d.key; });

        this.edges.enter().insert("path", ".node")
            .attr("class", function(d) { return d.etype; })
            .attr("id", function(d) {
                return "link_" + d.key;

            })
            .style("stroke", function(d) { return d.style.stroke})
            .style("stroke-width", function (d) { return d.style.strokeWidth + "px"; })
            .style("opacity", function(d) { return d.style.opacity; })
            .classed("link", true); // internal use


        this.edges.exit().remove();

        this.edgeLabel = this.edgeLabel.data(this.layout.links(), function(d) { return d.key; });

        this.edgeLabel.enter()
            .append("g")
            .attr("class", "label");


        this.edgeLabel.exit().remove();

        // It would be better if all event handling is specified in a separate function
        // Try to break down code into a) display code and b) event handling code
        //
        // I don't think so
        // 1. it is not good to have all event handling in a big function
        // 2. The event handling in this library does not involve business logic. "var drag" is because
        // drag will be a private variable and it will not be used by anywhere else, so we don't have to separate it,
        // also, the drag is inside of UpdateGraph_ because every time when the graph is updated, the drag is needed to call again
        var drag = d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);
        function dragstarted() {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
            //force.start();
        }
        function dragged(d) {
            var selectedVertices = self.vertices.filter(function (d) {
                return d.selected
            });

            // multiple nodes dragging
            selectedVertices.each(function(d){
                d.x += d3.event.dx;
                d.y += d3.event.dy;
            });

            selectedVertices.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            self.linkDrawing_();
        }
        function dragended() {
            d3.select(this).classed("dragging", false);
        }


        this.vertices = this.vertices.data(this.nodes, function(d) { return d.key; });

        // why do you create a vertex group
        //
        // Obviously,
        // 1. Have all child elements have a same CSS class called "node"
        // 2. Each group of vertex includes node shape, label background, and label
        // 3. Some events work on the whole group not only a specific element, e.g. drag, click
        var vertexGroup = this.vertices.enter().append("g")
            .attr("class", "node")
            .call(drag);



        this.vertices
            .on("click", bind(this, this.highLightConnectedEdgesNodes_))

            .on("mousedown", function(d){
                 if (!d.selected) {
                     if (!self.shiftKey) {
                         self.vertices.classed("selected", function(e){ return e.selected = (d.id == e.id && d.type == e.type)});
                     } else{
                         d3.select(this).classed("selected", d.selected = true);
                     }
                 }

            })
            .on("mouseup", function(d) {
                if (d.selected && self.shiftKey) {
                    d3.select(this).classed("selected", d.selected = false);
                }
            });


        var vertexShape = vertexGroup.append("path")
            .attr("id", function (d) { return "shape_" + d.key})
            .attr("d", function(d) { return genNodeShapePath(d.style.shape, d.shapeSize) })
            .style("fill", function(d) { return d.style.fill; })
            .style("stroke", function(d) { return d.style.stroke; })
            .style("stroke-width", function(d) { return d.style.strokeWidth; })
            .style("opacity", function(d) { return d.style.opacity; })
            .attr("class", function(d) { return d.type})
            .classed("shape", true); // internal use

        vertexShape.each(function(d) {
            if (d.style.dashed) {
                d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);
            }

        });



        vertexGroup.append("text")
            .attr("dy", "0.4em")
            .attr("y", 0)
            .classed("label", true) // internal use
            .text(function(d) { return d.attr.label || null; })
	        .style("text-anchor", "middle")
            .each(function (d) {
                var bbox;
                try{
                    bbox = this.getBBox();
                } catch(e) {
                    //mimic bbox bcz FireFox has a bug
                    bbox = {
                        x: this.clientLeft,
                        y: this.clientTop,
                        width: this.clientWidth,
                        height: this.clientHeight
                    }
                }
                d.bbox = bbox;
            });



        vertexGroup
            .insert("rect", "text")
            .classed("outline", true) // internal use
            .style("fill", function(d) {return d.style.hasOwnProperty("label") ? d.style.label.fill : "none"})
            .style("stroke", function(d) {return d.style.hasOwnProperty("label") ? d.style.label.stroke : "gray"})
            .attr("x", function(d) { return d.bbox.x})
            .attr("y", function(d) { return d.bbox.y})
            .attr("width", function(d) { return d.bbox.width})
            .attr("height", function(d) { return d.bbox.height});



        this.vertices.exit().transition().remove();



        this.layout.on("start", function() {


            requestAnimationFrame(function frame(){
                for (var i = self.opts_.force.tickPerFrame; i > 0; --i){
                    self.layout.tick();
                    if (self.layout.alpha() < self.opts_.force.collisionAlpha) {
                        self.handleCollisions_();
                    }

                }


                if (self.opts_.force.staticLayout){
                    self.layout.stop();
                }

                self.vertices.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

                self.linkDrawing_();

                self.computeFitCenterAndScale();


                if (self.layout.alpha() > 0){
                    requestAnimationFrame(frame);

                } else {
                    if(self.opts_.autofit && self.initStatus_){
                        self.parent.transition().attr("transform",
                            "translate(" + self.fitCenter + ")" + " scale(" + self.fitScale + ")");

                        self.zoomL.translate(self.fitCenter).scale(self.fitScale);
                        self.initStatus_ = false;
                    }
                }

            });


        });

        this.layout.start();


    };


    /**
     * Draw edges between two nodes,
     * support multi-edges rendering with 4 control points,
     * wrap multi-line labels
     *
     * @private
     */
    this.linkDrawing_ = function() {
        var self = this;

        this.edges
            .each(function(d) {
                d.srcOuterPoint = getSourceNodeOuterCircumferencePoint(d);
                d.tgtOuterPoint = getTargetNodeOuterCircumferencePoint(d);


                // Have multiple edges between two nodes have the same src/tgt coordinates
                var prefixKey_src_tgt = d.source.key + self.linkKeyConcChar_ + d.target.key,
                    prefixKey_tgt_src = d.target.key + self.linkKeyConcChar_ + d.source.key;
                var existingKey = self.multiLinksNumCoord.hasOwnProperty(prefixKey_src_tgt) ? prefixKey_src_tgt : prefixKey_tgt_src;

                var objOrNum = self.multiLinksNumCoord[existingKey];

                self.multiLinksNumCoord[existingKey] = {
                    "num": objOrNum.hasOwnProperty("num") ? objOrNum["num"]: objOrNum,
                    "src": d.srcOuterPoint,
                    "tgt": d.tgtOuterPoint
                };



            })
            .attr("d", function(d) {
                // please document how you determine links
                //
                // Each link has source and target node,
                // after running readData_(), each link includes a deep copy of source and target.
                // For representation of HTML5, link here is drawn with <path>.
                // <path> has an important attribute d, so in the below code, we will generate
                // the path commands according the number of links between two nodes.
                // If only one link between two nodes, we only need a straight line from source to target.
                // If multiple links between two nodes, we have to draw the line(path) based on generated control points.
                // For more information about HTML5 SVG standard,
                //      for <line>, please refer to http://www.w3.org/TR/SVG/shapes.html#LineElement
                //      for <path>, please refer to http://www.w3.org/TR/SVG/paths.html

                // Single edge between two nodes
                if (d.totalNoLinks == 1) {
                    var srcX = d.srcOuterPoint[0],
                        srcY = d.srcOuterPoint[1],
                        tgtX = d.tgtOuterPoint[0],
                        tgtY = d.tgtOuterPoint[1];

                    // please document what this variable indicates
                    //
                    // isSrc2TgtAscending is used to check if the source node of a link is on the left of the target node
                    // then decide how we draw the arrowhead if the direction option of the link is on.
                    // Specifically,
                    //      if the source node is on the left of the target, we will add an arrowhead to the end of the line/path
                    //      if the source node is on the right of the target, we will add an arrowhead to the start of the line/path
                    d.isSrc2TgtAscending = true;

                    var tmpx = srcX,
                        tmpy = srcY;

                    if (srcX > tgtX) {
                        //swap srcX and srcY
                        srcX = tgtX;
                        srcY = tgtY;
                        tgtX = tmpx;
                        tgtY = tmpy;
                    }

                    if(d.source.x > d.target.x) d.isSrc2TgtAscending = false;

                    var dr = Math.sqrt((tgtY - srcY) * (tgtY - srcY) + (tgtX - srcX) * (tgtX - srcX));

                    d.c0 = [srcX + NLGraph.CONTROL_POINT_POS * dr, srcY];
                    d.c1 = [tgtX - (dr * NLGraph.CONTROL_POINT_POS), tgtY];

                    return  "M" + srcX + "," + srcY + "L" + tgtX + "," + tgtY;
                }

                // Multiple edges between two nodes
                var controlpts = self.genControlPoints4MultiLinks_(d);

                d.c0 = controlpts[1];
                d.c1 = controlpts[2];
                return line(controlpts);

            });

        // please document approach to drawing markers
        //
        // <marker-start> and <marker-end> defines a polygon marker to be drawn at the first/end vertex of the given path/line.
        // When the web page loaded, I predefined arrowheads represented as <marker> with different directions.
        // Each arrowhead has an unique HTML id which in part contains sourceNode.key and targetNode.key
        // Then, the next logic is documented in the above comment line.
        // For more information about marker, please refer to
        // http://www.w3.org/TR/SVG11/painting.html#MarkerStartProperty , and
        // http://www.w3.org/TR/SVG/painting.html#MarkerElement
        this.edges.each(function(d) {
            // calculate the distance between d.srcOuterPoint and d.tgtOuterPoint
            // if the distance < predefined threshold, draw nothing

            var smallDis = Math.sqrt((d.target.y - d.source.y) * (d.target.y - d.source.y) + (d.target.x - d.source.x) * (d.target.x - d.source.x));
            if(smallDis <= self.opts_.lineDispearDistance){ //70
                d3.select(this).style("display", "none");
            } else {
                d3.select(this).style("display", function(d){return d.style.display});
            }


            if (d.directed ) {

                if (d.isSrc2TgtAscending) {

                    d3.select(this).attr("marker-start", null);
                    d3.select(this).attr("marker-end", "url(#arrow_e" + d.key + ")");


                } else {

                    d3.select(this).attr("marker-end", null);
                    d3.select(this).attr("marker-start", "url(#arrow_s" + d.key + ")");

                }

            }

            if (d.style.dashed) {
                d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);
            }

        });

        // please document approach to drawing text
        //
        // <text> is a HTML5 SVG element, link is http://www.w3.org/TR/SVG/text.html
        // If you don't understand the data binding concept with D3, please have a look the paper
        // http://doi.ieeecomputersociety.org/10.1109/TVCG.2011.185
        // 1. this.edgeLabel has already attached links
        // 2. Remove old <text> because the label in the element could be changed due to previous wrapping
        // 3. Wrap label
        //      a. get the path length and compare it with the label length,
        //      b. decide how many <text> be be drawn on the associated edge
        //      c. from top to bottom in the list of <text>, draw the wrapped label
        this.edgeLabel.each(function(d) {
            var totalText = d3.select(this).selectAll("text")[0].length;

            if(totalText != 0) {

                d3.select(this).selectAll("text").remove();

                var pathLen = d3.select("#link_" + d.key).node().getTotalLength();


                d3.select(this).call(wrapEdgeLabel, d.label, pathLen);

                // Change dy for multi text tags to make sure the multi-lines follow one after another for the same attr
                var dyAry = computeEdgeLabelDy(-0.2, NLGraph.LABEL_LINE_HEIGHT, d3.select(this).selectAll("text")[0].length);

                dyAry.sort(function (a, b) {
                    return a - b;
                });

                d3.select(this).selectAll("text").each(function (d, i) {

                    d3.select(this).attr("dy", dyAry[i] + "em");

                })
            }

        });

    };

    /**
     * Create an array for line position, positive value means up, negative is down.
     * e.g. [0, -1, 1, -2, 2]
     *
     * @param totalNum
     * @returns {*}
     */
    function computeLinePos(totalNum) {
        // need more details for what is happening here
        // If this a method that is well known, then please point to the page
        // If this is purely your method, we need detailed documentation saying what is happening exactly
        //
        // It is purely my method for multiEdges drawing
        // The multiple edges between two nodes have positions, say,
        // the central edge is 0,
        // the edges below the central edge have negative positions, in a descending order, they are -1, -2, -3, ... etc.
        // the edges above the central edge have positive positions, in a ascending order, they are 1, 2, 3, ..., etc.
        // The position of an edges determine how many gaps between it and the central edge.
        // The gap is parametrized.
        var dr = -1;

        var t1 = [0],
            t2 = [dr, -dr];

        if(totalNum == 1){
            return t1;
        } else if (totalNum == 2) {
            return t2;
        } else {
            if (totalNum % 2 == 0) {
                for(var i = 1; i < totalNum / 2; ++i) {
                    t2.push.apply(t2, [(i + 1) * dr, -(i + 1) * dr]);
                }
                return t2;

            } else {
                for(var j = 1; j < Math.ceil(totalNum / 2); ++j) {
                    t1.push.apply(t1, [j * dr, -j * dr]);
                }
                return t1;

            }

        }

    }

    /**
     * The computeTspanDy is used to generate an array containing dy attribute of <tspan>
     *
     * @param baseDy, the shift from the node center,
     * @param lineHeight, line height,
     * @param tspanNo, the number of <tspan>
     * @returns {Array}
     */
    // Need details documentation of what this method does
    function computeTspanDy(baseDy, lineHeight, tspanNo) {
        var dyArray = [],
            lowerBound;

        if(tspanNo % 2 != 0) {
            lowerBound = baseDy - Math.floor(tspanNo/2) * lineHeight;
        } else {
            lowerBound = -(baseDy + (tspanNo/2 - 1) * lineHeight);
        }

        for (var i = 0; i < tspanNo; ++i) {
            dyArray.push(lowerBound + i * lineHeight);
        }
        return dyArray;
    }

    /**
     *
     * @param baseDy
     * @param lineHeight
     * @param totalNum
     * @returns {Array} e.g, [-0.2, 0.8, -1.2, 1.8, -2.2, 2.8, -3.2]
     */

    function computeEdgeLabelDy (baseDy, lineHeight, totalNum) {
        // Need details documentation of what this method does
        //
        // When drawing edge label, we need multiple <text> to wrap if the label is longer than the path/line it relys on,
        // for example, a typical edge label consists of :
        // <text multline="attr_0-0" dy="-20.2em">
        //      <textPath text-anchor="middle" startOffset="50%" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#link_3-3_10-0_9">Wrapped label1</textPath>
        // </text>
        //<text multline="attr_1-0" dy="-19.2em">
        //      <textPath ...>Wrapped label2</textPath></text>
        // See, we need a "dy" for each text to indicate a shift along y-axis
        // So this method is to generate an array including all dys from top to bottom for mutlple <text>
        // For more information, please refer to http://www.w3.org/TR/SVG/text.html#TSpanElementDYAttribute
        var upDy = baseDy, downDy = lineHeight + baseDy;

        var dyAry = [];

        for (var i = 0; i < totalNum; ++i) {

            dyAry.push(i % 2 == 0 ? -(i / 2 * lineHeight + Math.abs(upDy)) :
                Math.floor(i / 2) * lineHeight + downDy);
        }
        return dyAry;
    }


    /**
     * Generate node shape command with d3 plugin
     *
     * @param shapeName
     * @param size
     * @returns {*}
     */
    // Need details documentation of what this method does or point to the page
    function genNodeShapePath(shapeName, size) {
        // adapted code from https://github.com/d3/d3-plugins/blob/master/superformula/superformula.js
        return d3.superformula().type(shapeName).size(size)();
    }

    /**
     * Calculate target coordinates of a link, which is in the circumference of the outer circle
     * @param d
     * @returns {*[]}
     */
    function getTargetNodeOuterCircumferencePoint(d){
        var tgtRadius = d.target.radius,
            tgtX = d.target.x,
            srcX = d.source.x,
            tgtY = d.target.y,
            srcY = d.source.y;

        if (d.target.fisheye) {
            tgtRadius = d.target.fisheye.z * tgtRadius;
            tgtX = d.target.fisheye.x;
            srcX = d.source.fisheye.x;
            tgtY = d.target.fisheye.y;
            srcY = d.source.fisheye.y;
        }


        // 5 is the space between arrowhead and the border of the shape
        var t_radius = tgtRadius + 5;

        var dx = tgtX - srcX,
            dy = tgtY - srcY;
        var angle = Math.atan2(dy,dx);
        var tx = tgtX - (Math.cos(angle) * t_radius),
            ty = tgtY - (Math.sin(angle) * t_radius);


        return [tx,ty];
    }

    /**
     * Calculate source coordinates of a link, which is in the circumference of the outer circle
     * @param d
     * @returns {*[]}
     */
    function getSourceNodeOuterCircumferencePoint(d){
        var srcRadius = d.source.radius,
            tgtX = d.target.x,
            srcX = d.source.x,
            tgtY = d.target.y,
            srcY = d.source.y;

        if (d.source.fisheye) {
            srcRadius = d.source.fisheye.z * srcRadius;
            tgtX = d.target.fisheye.x;
            srcX = d.source.fisheye.x;
            tgtY = d.target.fisheye.y;
            srcY = d.source.fisheye.y;
        }


        // 5 is the space between arrowhead and the border of the shape
        var s_radius = srcRadius + 5;

        var dx = tgtX - srcX,
            dy = tgtY - srcY;
        var angle = Math.atan2(dy,dx);
        var sx = srcX + (Math.cos(angle) * s_radius),
            sy = srcY + (Math.sin(angle) * s_radius);


        return [sx, sy];
    }


    /**
     * Create SVG text for multi-line link label rendering
     *
     * @param thisTextGroup
     * @param labels
     * @param pathLen
     *
     */
    function wrapEdgeLabel(thisTextGroup, labels, pathLen) {

        var d = thisTextGroup.datum();

        for(var i = 0; i < labels.length; ++i) {
            var words = labels[i].toString().split(/\s+/).reverse(),
                word,
                line = [];

            var sameAttrLineNo = 0;

            var textPath = thisTextGroup
                .append("text")
                .attr("multline", "attr_" + i + "-" + sameAttrLineNo++)
                .append("textPath")
                .attr("text-anchor", "middle")
                .attr("startOffset", "50%")
                .attr("xlink:href", "#link_" + d.key )
                .text(null);


            while(word = words.pop()) {
                line.push(word);
                textPath.text(line.join(" "));
                if(textPath.node().getComputedTextLength() > pathLen) {

                    line.pop();
                    textPath.text(line.join(" "));
                    line = [word];
                    textPath = thisTextGroup.append("text")
                        .attr("multline", "attr_" + i + "-" + sameAttrLineNo++)
                        .attr("text-anchor", "middle")
                        .append("textPath")
                        .attr("startOffset", "50%")
                        .attr("xlink:href", "#link_" + d.key )
                        .text(word);

                }
            }
        }

    }

    /**
     * Rotate a point [x, y] in a certain angle
     *
     * @param cx, rotation center x
     * @param cy, rotation center y
     * @param x, current x
     * @param y, current y
     * @param angle
     * @returns {*[]}
     */
    function rotate(cx, cy, x, y, angle) {

		var radians = (Math.PI / 180) * angle,
		    cos = Math.cos(radians),
		    sin = Math.sin(radians),
		    nx = (cos * (x - cx)) - (sin * (y - cy)) + cx,
		    ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;

		return [nx, ny];
	}


    /**
     *
     * @param link, edge object including positions, e.g., 0, 1, -1, 2, -2
     * @returns {*[]}
     */
    this.genControlPoints4MultiLinks_ = function(link) {
        // some high level comments here will be helpful for each of the steps.
        //
        // the ratio for the distance from the source to the first control points to
        //               the distance from the source to the target
        var f = NLGraph.CONTROL_POINT_POS;

        // Assume multiple edges have the same source and target without consideration of line direction
        var prefixKey_src_tgt = link.source.key + this.linkKeyConcChar_ + link.target.key,
            prefixKey_tgt_src = link.target.key + this.linkKeyConcChar_ + link.source.key;
        var existingKey = this.multiLinksNumCoord.hasOwnProperty(prefixKey_src_tgt) ? prefixKey_src_tgt : prefixKey_tgt_src;
        var numCoordObj = this.multiLinksNumCoord[existingKey];

		var x0 = numCoordObj.src[0],
		    y0 = numCoordObj.src[1],
		    x1 = numCoordObj.tgt[0],
		    y1 = numCoordObj.tgt[1],
            dx = x1 - x0,
            dy = y1 - y0,
            angleSrcTgt = Math.atan2(dy, dx) * 180 / Math.PI,
            dia = Math.sqrt(dx * dx + dy * dy),
            //dr = dia / 2;
            dr = this.opts_.lineTensionDistance;

        // project to horizontal plane
        x1 = x0 + dia;
        y1 = y0;

        // create a horizontal control point
        var hc0 = [x0 + dia * f, y0],
            hc1 = [x1 - (dia * f), y1];
        // According to link position, in the assumed horizontal plane, create two control points
        var c0 = [hc0[0], hc0[1] - dr * link.linkPos],
            c1 = [hc1[0], hc1[1] - dr * link.linkPos];



        // rotate the above control points in an angle between source and target
        // because it is difficult to directly calculate the coordinates
        var newC0 = rotate(x0, y0, c0[0], c0[1], angleSrcTgt),
            newC1 = rotate(x0, y0, c1[0], c1[1], angleSrcTgt);

         // changing these links no to converge by rotating control points
        var angleC0Srcouter = Math.atan2(newC0[1] - numCoordObj.src[1], newC0[0] - numCoordObj.src[0]) * 180 / Math.PI,
            new0 = rotate(x0, y0, x0 + this.opts_.lineConvergingOffset, y0, angleC0Srcouter),
            posOnStraightLine = rotate(x0, y0, x1 + this.opts_.lineConvergingOffset, y1, angleSrcTgt),
            angleC1Tgtouter = Math.atan2( newC1[1] - numCoordObj.tgt[1], newC1[0] - numCoordObj.tgt[0]) * 180 / Math.PI,

            new1 = rotate(numCoordObj.tgt[0], numCoordObj.tgt[1], posOnStraightLine[0], posOnStraightLine[1], angleC1Tgtouter - angleSrcTgt);


        // compare between source.x and target.x to draw arrowhead
        link.source.x < link.target.x ? link.isSrc2TgtAscending = true : link.isSrc2TgtAscending = false;

        // make sure the output control points are sorted in an ascending order of x coordinates,
        // which is important to be sure the label is always readable, i.e., the letter of label is listed from left to right
        if (new0[0] < new1[0]) {
            link.c0 = newC0;
            link.c1 = newC1;
            return [new0, newC0, newC1, new1];

        } else {
            link.c0 = newC1;
            link.c1 = newC0;
            return [new1, newC1, newC0, new0];
        }


    };


    /**
     * Check if two nodes are connected
     *
     * @param n1 Node1 object
     * @param n2 Node2 object
     * @returns {*|boolean}
     *
     * @private
     */
    this.isConnected_ = function(n1, n2) {

        if (typeof n1.id != "undefined"
            && typeof  n1.type != "undefined"
            && typeof n2.id != "undefined"
            && typeof n2.type != "undefined") {

            if(n1.key == n2.key) return true;

            var edgeIndex0 = this.connectedMap[n1.key + this.linkKeyConcChar_ + n2.key],
                edgeIndex1 = this.connectedMap[n2.key + this.linkKeyConcChar_ + n1.key];


            return !!(typeof edgeIndex0 != "undefined" || typeof  edgeIndex1 != "undefined");
        }

        return false;
    };


    /**
     * Check if two nodes are connected
     *
     * @param n1Id
     * @param n1Type
     * @param n2Id
     * @param n2Type
     * @returns {*}
     *
     * @export
     */
    this.isConnected = function(n1Id, n1Type, n2Id, n2Type) {

        var n1Key = this.nodeIDsMap[n1Id] + this.nodeIdTypeConcChar_ + this.nodeTypesMap[n1Type],
            n2Key = this.nodeIDsMap[n2Id] + this.nodeIdTypeConcChar_ + this.nodeTypesMap[n2Type];
        var n1 = {id: n1Id, type: n1Type, key: n1Key},
            n2 = {id: n2Id, type: n2Type, key: n2Key};

        return this.isConnected_(n1, n2);
    };


    /**
     * Check if a node has any incoming links
     *
     * @param nodeId
     * @param nodeType
     * @returns {boolean}
     *
     * @export
     */
    this.hasIncomingConnections = function(nodeId, nodeType) {
        for (var toKey in this.incomingNodes) {
            if (toKey == this.nodeIDsMap[nodeId] + this.nodeIdTypeConcChar_ + this.nodeTypesMap[nodeType]) {
                return true;
            }
		}
	    return false;
    };

    /**
     * Check if a node has any outgoing links
     *
     * @param nodeId
     * @param nodeType
     * @returns {boolean}
     *
     * @export
     */
    this.hasOutgoingConnections = function(nodeId, nodeType) {
        for (var fromKey in this.outgoingNodes) {
            if (fromKey == this.nodeIDsMap[nodeId] + this.nodeIdTypeConcChar_ + this.nodeTypesMap[nodeType]) {
                return true;
            }
		}
	    return false;
    };

    /**
     * Check if a node has any links
     *
     * @param nodeId
     * @param nodeType
     * @returns {boolean}
     *
     * @export
     */
    this.hasConnections = function(nodeId, nodeType) {
        for (var i = 0; i < this.links.length; ++i){
            var l = this.links[i];
            if(l.hasOwnProperty("source") && l.hasOwnProperty("target")) {
                if ((l.source.id == nodeId && l.source.type == nodeType)
                    || (l.target.id == nodeId && l.target.type == nodeType) ){
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * Zoom in/out the graph
     *
     * @param scale
     * @returns {NLGraph}
     *
     * @export
     */
    this.zoom = function(scale) {
        if (typeof scale === "undefined") return this;
        if (!this.isRendered()) {
          this.opts_.initialScale = scale;
          return this;
        } else {
            // Please explain this code more
            // Why do you translate for zoom?
            //
            // Think about camera in cellphone, zooming needs a center to rely on.
            // The translation is to make sure the zoomed view is not out of control, e.g., fly out of the container
            // If you have a chance to look at Google Maps, you will find similar logic.
          var zoom = this.zoomL,
              point = [this.opts_.width / 2, this.opts_.height / 2],
              loc = this.getLocation(point);

          scale = scale < this.opts_.zoomScaleExtent[0] ? this.opts_.zoomScaleExtent[0] : scale > this.opts_.zoomScaleExtent[1] ? this.opts_.zoomScaleExtent[1] : scale;

          zoom.scale(scale);
          this.translateTo(point, loc);
          this.refreshZoom_(true);

          return this;
        }

    };

    /**
     * Zoom in the graph
     *
     * @returns {NLGraph|*}
     *
     * @export
     */
    this.zoomIn = function() {
        var scale = this.getScale(),
            k = Math.pow(2, Math.floor(Math.log(scale) / Math.LN2) + 1);

            k = Math.min(k, this.opts_.zoomScaleExtent[1]);


        return this.zoom(k);
    };

    /**
     * Zoom out the graph
     *
     * @returns {NLGraph|*}
     *
     * @export
     */
    this.zoomOut = function() {
        var scale = this.getScale(),
            k = Math.pow(2, Math.ceil(Math.log(scale) / Math.LN2) - 1);

        k = Math.max(k, this.opts_.zoomScaleExtent[0]);


        return this.zoom(k);
    };

    /**
     * Refresh the zoom level, translate, and scale
     *
     * @param isAnimation
     *
     * @private
     */
    this.refreshZoom_ = function(isAnimation) {

        var zoom = this.zoomL,
            trans = this.getTranslation(),
            scale = this.getScale();

        if (isAnimation) {
            this.parent.transition().duration(500).attr("transform",
            "translate(" + zoom.translate() + ") scale(" + zoom.scale() + ")");
        } else {
            this.parent.attr("transform",
            "translate(" + trans + ") scale(" + scale + ")");
        }

    };

    /**
     * Display a set of attribute values for a node specified
     *
     * @param nodeId
     * @param nodeType
     * @param listLabel
     * @returns {NLGraph}
     *
     * @export
     */
    this.setNodeLabel = function (nodeId, nodeType, listLabel) {
        var nodeObj = this.getNodeByKey(nodeId, nodeType),
            listAttrVals = [],
            lineHeight = NLGraph.LABEL_LINE_HEIGHT; // em

        for (var i = 0; i < listLabel.length; ++i) {
            listAttrVals.push(this.getObjAttrUpDown(nodeObj, listLabel[i]));
        }

        // document this please
        //
        // Label for node is a bit different from that for edge
        // A typical node label is displayed like:
        // <text dy="0.4em" y="0" class="label" style="text-anchor: middle; opacity: 1;">
        //      <tspan x="0" y="0" dy="-0.2em">11</tspan>
        //      <tspan x="0" y="0" dy="0.8em">movie</tspan>
        // </text>
        // The computeTspanDy is used to generate an array containing dy so that multiple <tspan> have a concentric center
        // The first parameter is the baseDy which means the shift from the node center,
        // the second parameter is line height,
        // the last parameter is the number of <tspan>
        //
        var tspanDyArray = computeTspanDy(0.2, lineHeight, listLabel.length);

        this.vertices.select(".label").each(function(d) {
            if (d.id == nodeId && d.type == nodeType) {
                d3.select(this).text(null);
                var y = d3.select(this).attr("y");

                for (var i = 0; i < listAttrVals.length; ++i) {
                    d3.select(this).append("tspan")
                        .attr("x", 0)
                        .attr("y", y)
                        .attr("dy", tspanDyArray[i] + "em" )
                        .text(listAttrVals[i]);
                }

            }
            var bbox;
            try{
                bbox = this.getBBox();
            } catch(e) {
                //mimic bbox bcz FireFox has a bug
                bbox = {
                    x: this.clientLeft,
                    y: this.clientTop,
                    width: this.clientWidth,
                    height: this.clientHeight
                }
            }

            // what is bbox
            //
            // bbox denotes bounding box of SVG element.
            // It fits a rectangle aligned with the axes of the element.
            // For more information about bbox, please refer to
            // http://www.w3.org/TR/SVGTiny12/coords.html#BoundingBox
            d.bbox = bbox;


        });

        this.vertices.select(".outline")
            .attr("x", function(d) { return d.bbox.x})
            .attr("y", function(d) { return d.bbox.y})
            .attr("width", function(d) { return d.bbox.width})
            .attr("height", function(d) { return d.bbox.height});

        return this;

    };


    /**
     * Set all nodes with the type specified have labels in the listLabel passed.
     *
     * @param type
     * @param listLabel
     * @returns {NLGraph}
     *
     * @export
     */
    this.setNodeTypeLabel = function (type, listLabel) {

        var lineHeight = NLGraph.LABEL_LINE_HEIGHT; // em

        var tspanDyArray = computeTspanDy(0.2, lineHeight, listLabel.length);

        this.vertices.select(".label").each(function(d) {
            if (d.type == type) {

                var listAttrVals = [];
                for (var i = 0; i < listLabel.length; ++i) {
                    listAttrVals.push(listLabel[i] + ": " + (d["attr"][listLabel[i]] == null ? d[listLabel[i]] : d["attr"][listLabel[i]]));
                }

                d3.select(this).text(null);
                var y = d3.select(this).attr("y");

                for (var j = 0; j < listAttrVals.length; ++j) {
                    d3.select(this).append("tspan")
                        .attr("x", 0)
                        .attr("y", y)
                        .attr("dy", tspanDyArray[j] + "em" )
                        .text(listAttrVals[j]);
                }

            }
            d.bbox = this.getBBox();

        });

        this.vertices.select(".outline")
            .attr("x", function(d) { return d.bbox.x})
            .attr("y", function(d) { return d.bbox.y})
            .attr("width", function(d) { return d.bbox.width})
            .attr("height", function(d) { return d.bbox.height});


        return this;

    };

    /**
     * Display a set of attribute values for an edge specified
     *
     * @param srcid
     * @param srctype
     * @param dstid
     * @param dsttype
     * @param etype
     * @param listLabel
     * @returns {NLGraph}
     *
     * @export
     */
    this.setEdgeLabel = function (srcid, srctype, dstid, dsttype, etype, listLabel) {
        var self = this;

        var linkObj = this.linksObj[self.nodeIDsMap[srcid] +self.nodeIdTypeConcChar_ + self.nodeTypesMap[srctype] + self.linkKeyConcChar_ + self.nodeIDsMap[dstid] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[dsttype] + self.linkKeyConcChar_ + self.linkTypesMap[etype]],
            listAttrVals = [];


        for (var i = 0; i < listLabel.length; ++i) {
            listAttrVals.push(this.getObjAttrUpDown(linkObj, listLabel[i]));
        }


        this.edgeLabel.each(function(d) {
            if (d.source.id == srcid && d.source.type == srctype
                && d.target.id == dstid && d.target.type == dsttype && d.etype == etype ) {

                d3.select(this).selectAll("text").remove();

                var pathLen = d3.select("#link_" + d.key).node().getTotalLength();

                d.label = listAttrVals;

                d3.select(this).call(wrapEdgeLabel, listAttrVals, pathLen);
                // Change dy for multi text tags to make sure the multi-lines follow one after another for the same attr

                var dyAry = computeEdgeLabelDy(-0.2, NLGraph.LABEL_LINE_HEIGHT, d3.select(this).selectAll("text")[0].length);
                dyAry.sort(function(a, b) { return a - b});
                d3.select(this).selectAll("text").each(function(d, i) {
                    d3.select(this).attr("dy", dyAry[i] + "em");
                })

            }

        });

        return this;

    };


    /**
     * Display a set of attribute values for a set of edges with the same type
     *
     * @param etype
     * @param listLabel
     * @returns {NLGraph}
     *
     * @export
     */
    this.setEdgeTypeLabel = function (etype, listLabel) {
        var self = this;


        this.edgeLabel.each(function(d) {
            if (d.etype == etype) {
                self.setEdgeLabel(d.source.id, d.source.type, d.target.id, d.target.type, etype, listLabel);

            }
        });

        return self;

    };

    /**
     * Internal use
     * Highlight associated edges when clicking a node
     *
     * @param node
     * @privateIf you have any projects that I can complete before my last day, Friday, please let me know! I’d be happy to be of use as much as possible this week.

Let’s keep in touch. My email is awesomeintern@gmail.com and my cell is 123.456.7890. Again, thanks for the opportunity.
     */
    this.highLightConnectedEdgesNodes_ = function(node){
        // check whether the click event was suppressed
        if (d3.event.defaultPrevented) return;

        var edges = this.getAssociatedLinks(node.id, node.type).map(function(d){ return [d.source.id, d.source.type, d.target.id, d.target.type, d.etype]});
        var nodes = this.getAssociatedNodes(node.id, node.type).map(function(d){ return [d.id, d.type] });

        this.highLight([[node.id, node.type]].concat(nodes),edges);

    };


    /**
     * Apply .unhighlighted to the specified nodes and edges
     * Only highlight the given nodes and edges
     * Shawn asked apply opacity of value < 1.0 to unhighlighted node
     *
     * @param nodes - an array of ['1', 'usr']
     * @param edges - an array of ['0', 'usr', '1', 'tag', 'temp']
     *
     * @export
     */
    this.highLight = function(nodes, edges) {
        if (d3.event) {
            d3.event.stopPropagation();
        }
        var self = this;

        var nodeKeys = nodes.map(function(n){
                return self.nodeIDsMap[n[0]] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[n[1]];
            }),
            edgeKeys = edges.map(function(e){
                return self.nodeIDsMap[e[0]] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[e[1]]
                        + self.linkKeyConcChar_
                        + self.nodeIDsMap[e[2]] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[e[3]]
                        + self.linkKeyConcChar_ + self.linkTypesMap[e[4]]
            });

        this.vertices.classed("unhighlighted", function(d) {
            return d.highlighted = !~ nodeKeys.indexOf(d.key);
        });

        this.edges.classed("unhighlighted", function(d) {
            return d.highlighted = !~ edgeKeys.indexOf(d.key);
        });

        this.edgeLabel.classed("unhighlighted", function(d) {
            return d.highlighted = !~ edgeKeys.indexOf(d.key);
        });

        this.arrowhead_start.classed("unhighlighted", function(d) {
            return d.highlighted = !~ edgeKeys.indexOf(d.key);
        });
        this.arrowhead_end.classed("unhighlighted", function(d) {
            return d.highlighted = !~ edgeKeys.indexOf(d.key);
        });

        return this;

    };

    /**
     * Hide the specified node and connected edges
     * d.style.display is to be persistent in the original data.
     *
     * @param nodes - an array of ['1', 'usr']
     * @returns {NLGraph}
     *
     * @export
     */
    this.hideNodes = function (nodes) {
        var self = this;

        var nodeKeys = nodes.map(function(n){
                return self.nodeIDsMap[n[0]] + self.nodeIdTypeConcChar_ + self.nodeTypesMap[n[1]];
            });

        var allConnectedEdges = [];
        for (var i = 0; i < nodes.length; ++i){
            allConnectedEdges = allConnectedEdges.concat(this.getAssociatedLinks(nodes[i][0], nodes[i][1]));
        }
        var linkKeys = allConnectedEdges.map(function(e){ return e.key});

        this.vertices.select(".shape").style("display", function(d) {
            if(!!~nodeKeys.indexOf(d.key)) {
                return d.style.display = "none";
            }
            return d.style.display;
        });

        this.vertices.select(".label").style("display", function(d) {
            if(!!~nodeKeys.indexOf(d.key)) {
                return d.style.display = "none";
            }
            return d.style.display;
        });

        this.vertices.select(".outline").style("display", function(d) {
            if(!!~nodeKeys.indexOf(d.key)) {
                return d.style.display = "none";
            }
            return d.style.display;
        });

        this.edges.style("display", function(d){
            if(!!~linkKeys.indexOf(d.key)) {
                return d.style.display = "none";
            }
            return d.style.display;
        });

        this.edgeLabel.style("display", function(d){
            if(!!~linkKeys.indexOf(d.key)) {
                return d.style.display = "none";
            }
            return d.style.display;
        });

        this.arrowhead_start.style("display", function(d){
            if(!!~linkKeys.indexOf(d.key)) {
                return d.style.display = "none";
            }
            return d.style.display;
        });
        this.arrowhead_end.style("display", function(d){
            if(!!~linkKeys.indexOf(d.key)) {
                return d.style.display = "none";
            }
            return d.style.display;
        });


        return this;

    };


    /**
     * Display the hidden vertices and links
     *
     * d.style.display is to be persistent in the original data
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.unHide = function() {
        // PLease document how hiding and unhiding works
        //
        // hiding is just set the attribute of display as "none".
        // unhiding is reset the attribute of display.
        this.vertices.select(".shape").style("display", function(d) { return d.style.display = null; });

        this.vertices.select(".label").style("display", function(d) { return d.style.display = null; });
        this.vertices.select(".outline").style("display", function(d) { return d.style.display = null; });

        this.edges.style("display", function(d) { return d.style.display = null; });
        this.edgeLabel.style("display", function(d) { return d.style.display = null; });

        this.arrowhead_start.style("display", function(d){ return d.style.display = null; });
        this.arrowhead_end.style("display", function(d){ return d.style.display = null; });

        return this;

    };

    /**
     * Cancel the highlighting
     * d.highlighted is to be persistent in the original data.
     *
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.unHighlight = function () {
        if(this.mulSelMode) return;

        this.vertices.classed("unhighlighted", function(d) { return d.highlighted = false; });

        this.edges.classed("unhighlighted", function(d) { return d.highlighted = false; });
        this.edgeLabel.classed("unhighlighted", function(d) { return d.highlighted = false; });

        this.arrowhead_start.classed("unhighlighted", function(d) { return d.highlighted = false; });
        this.arrowhead_end.classed("unhighlighted", function(d) { return d.highlighted = false; });


        return this;

    };

    /**
     * Remove .selected from the graph
     * d.selected is to be persistent in the original data
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.unSelect = function () {


        this.vertices.classed("selected", function(d) { return d.selected = false; });

        this.edges.classed("selected", function(d) { return d.selected = false; });
        this.edgeLabel.classed("selected", function(d) { return d.selected = false; });

        this.arrowhead_start.classed("selected", function(d) { return d.selected = false; });
        this.arrowhead_end.classed("selected", function(d) { return d.selected = false; });


        return this;

    };

    /**
     * Have a node display in a style,
     * The styleObj could have missing keys
     * d.style.* is to be persistent in the original data
     *
     * @param nodeId
     * @param nodeType
     * @param styleObj
     * @returns {NLGraph}
     *
     * @export
     */
    this.setNodeStyle = function (nodeId, nodeType, styleObj) {

        this.vertices.select(".shape").each(function(d) {
            if (d.id == nodeId && d.type == nodeType) {
                d3.select(this)
                    .style("fill", function(d) { return d.style.fill = styleObj.fill || d.style.fill; })
                    .style("stroke", function(d) { return d.style.stroke = styleObj.stroke || d.style.stroke; })
                    .style("stroke-width", function(d) { return d.style.strokeWidth = styleObj.strokeWidth || d.style.strokeWidth; })
                    .style("opacity", function(d) { return d.style.opacity = styleObj.opacity || d.style.opacity; });

                d.style.dashed = styleObj.dashed || d.style.dashed;
                d.style.shape = styleObj.shape || d.style.shape;

                if (styleObj.dashed) {
                    d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);
                } else {
                    d3.select(this).style("stroke-dasharray", null);
                }

                if (styleObj.shape){
                    d3.select(this).attr("d", genNodeShapePath(styleObj.shape, styleObj.size ? nodeSizeFunc(styleObj.size) :d.shapeSize ));
                }

            }

        });

        return this;

    };

    /**
     * Have a set of nodes with same type display in a style,
     * The styleObj can have missing key
     * d.style.* is to be persistent in the original data
     *
     * @param type
     * @param styleObj
     * @returns {NLGraph}
     *
     * @export
     */
    this.setNodeTypeStyle = function (type, styleObj) {

        this.vertices.select(".shape").each(function(d) {
            if (d.type == type) {
                d3.select(this)
                    .style("fill", function(d) { return d.style.fill = styleObj.fill || d.style.fill; })
                    .style("stroke", function(d) { return d.style.stroke = styleObj.stroke || d.style.stroke; })
                    .style("stroke-width", function(d) { return d.style.strokeWidth = styleObj.strokeWidth || d.style.strokeWidth; })
                    .style("opacity", function(d) { return d.style.opacity = styleObj.opacity || d.style.opacity; });

                d.style.dashed = styleObj.dashed || d.style.dashed;
                d.style.shape = styleObj.shape || d.style.shape;

                if (styleObj.dashed) {
                    d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);
                } else {
                    d3.select(this).style("stroke-dasharray", null);
                }

                if (styleObj.shape){
                    d3.select(this).attr("d", genNodeShapePath(styleObj.shape, styleObj.size ? nodeSizeFunc(styleObj.size) :d.shapeSize ));
                }

            }

        });

        return this;

    };

    /**
     * Have an edge display in a particular style,
     * The styleObj can have missing key
     * d.style.* is to be persistent in the original data
     *
     * @param srcId
     * @param srcType
     * @param tgtId
     * @param tgtType
     * @param eType
     * @param styleObj
     * @returns {NLGraph}
     *
     * @export
     */
    this.setEdgeStyle = function (srcId, srcType, tgtId, tgtType, eType, styleObj) {
        var self = this;

        var existingKey = srcId + self.nodeIdTypeConcChar_ + srcType
                + self.linkKeyConcChar_ + tgtId + self.nodeIdTypeConcChar_ + tgtType
                + self.linkKeyConcChar_ + eType;


        this.edges.each(function(d) {
            if((d.source.id + self.nodeIdTypeConcChar_ + d.source.type + self.linkKeyConcChar_ + d.target.id + self.nodeIdTypeConcChar_ + d.target.type + self.linkKeyConcChar_ + d.etype) == existingKey ) {
                d3.select(this)
                    .style("stroke", function(d) { return d.style.stroke = styleObj.stroke || d.style.stroke; })
                    .style("stroke-width", function(d) { return d.style.strokeWidth = styleObj.strokeWidth || d.style.strokeWidth; })
                    .style("opacity", function(d) { return d.style.opacity = styleObj.opacity || d.style.opacity; });

                d.directed = styleObj.directed || d.directed;
                d.style.dashed = styleObj.dashed || d.style.dashed;

                if (styleObj.directed) {

                    d3.select(this).attr("marker-end", function(d) { return "url(#arrow_"+ d3.select(this).attr("id")+")"; });
                    d3.select("#arrow_"+ d3.select(this).attr("id") + " path").style("fill", styleObj.stroke || d.style.stroke);

                } else {

                    d3.select(this).attr("marker-end", null);

                }

                if (styleObj.dashed) {

                    d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);

                } else {

                    d3.select(this).style("stroke-dasharray", null);

                }
            }

        });

        return this;

    };

    /**
     * Have a set of edges with the etype specified display in a particular style,
     * The styleObj can have missing key.
     * d.style.* is to be persistent in the original data
     *
     * @param type
     * @param styleObj
     * @returns {NLGraph}
     *
     * @export
     */
    this.setEdgeTypeStyle = function (type, styleObj) {

        this.edges.each(function(d) {
            if(d.etype == type ) {
                d3.select(this)
                    .style("stroke", function(d) { return d.style.stroke = styleObj.stroke || d.style.stroke; })
                    .style("stroke-width", function(d) { return d.style.strokeWidth = styleObj.strokeWidth || d.style.strokeWidth; })
                    .style("opacity", function(d) { return d.style.opacity = styleObj.opacity || d.style.opacity; });

                d.directed = styleObj.directed || d.directed;
                d.style.dashed = styleObj.dashed || d.style.dashed;

                if (styleObj.directed) {

                    d3.select(this).attr("marker-end", function(d) { return "url(#arrow_"+ d3.select(this).attr("id")+")"; });
                    d3.select("#arrow_"+ d3.select(this).attr("id") + " path").style("fill", styleObj.stroke || d.style.stroke);

                } else {

                    d3.select(this).attr("marker-end", null);

                }

                if (styleObj.dashed) {

                    d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);

                } else {

                    d3.select(this).style("stroke-dasharray", null);

                }
            }

        });

        return this;

    };

    /**
     * Cache current graph including position, style, and status
     *
     * @returns {*[]}, [nodes, links, status]
     *
     * @export
     */
    this.getSnapshot = function(){
        var curNodes = deepCopyArrayBoundData(this.nodes);

        var curLinks = deepCopyArrayBoundData(this.links);

        var curStatus = {zoomScale: this.getScale()};


        return [curNodes, curLinks, curStatus];

    };

    /**
     * Bring cached graph back
     *
     * @param cache, [[], [], {}] - [nodes, links, status]
     * @returns {NLGraph}
     *
     * @export
     */
    this.restoreSnapshot = function(cache){
        var cachedNodes = cache[0],
            cachedLinks = cache[1],
            cachedStatus = cache[2];

        this.readData_(cachedNodes, cachedLinks);

        // Rebind data
        this.arrowhead_end = this.arrowhead_end.data(this.links, function(d) { return d.key });
        this.arrowhead_start = this.arrowhead_start.data(this.links, function(d) { return d.key });
        this.edges = this.edges.data(this.links, function(d) { return d.key; });
        this.edgeLabel = this.edgeLabel.data(this.links, function(d) { return d.key; });
        this.vertices = this.vertices.data(this.nodes, function(d) { return d.key; });

        // Restore position
        this.vertices.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        // link.direction has been set up in the function
        this.linkDrawing_();
        //this.refreshZoom_();

        // Restore status and widgets, e.g., previous zoomScale,
        //                                   zoomLens, (not sure?)
        //                                   brushStatus, (not sure)
        //
        //
        this.zoom(cachedStatus.zoomScale || 1);

        // Restore style
        // built-in style, e.g.,
        //                      d.style.fill,
        //                      d.style.shape,
        //                      d.style.stroke,
        //                      d.style.stroke-width,
        //                      d.style.opacity,
        //                      d.style.dashed,
        //                      d.directed,
        //
        // in terms of HTML, e.g.,
        //                      d.style.display,
        //                      d.unhighlighted,
        //                      d.selected
        //
        this.vertices.classed("unhighlighted", function(d) { return d.highlighted });

        this.vertices.select(".shape")
            .style("fill", function(d) { return d.style.fill })
            .style("stroke", function(d) { return d.style.stroke })
            .style("stroke-width", function(d) { return d.style.strokeWidth })
            .style("opacity", function(d) { return d.style.opacity })
            .classed("selected", function(d) { return d.selected })
            .style("display", function(d) { return d.style.display });

        this.vertices.select(".shape").each(function(d){
            if (d.style.dashed) {
                d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);
            } else {
                d3.select(this).style("stroke-dasharray", null);
            }

            d3.select(this).attr("d", genNodeShapePath(d.style.shape, d.shapeSize ));

        });

        this.edges
            .classed("unhighlighted", function(d) { return d.highlighted })
            .classed("selected", function(d) {return d.selected });
        this.edgeLabel
            .classed("unhighlighted", function(d) { return d.highlighted })
            .classed("selected", function(d) {return d.selected });;
        this.arrowhead_start
            .classed("unhighlighted", function(d) { return d.highlighted })
            .classed("selected", function(d) {return d.selected });
        this.arrowhead_end
            .classed("unhighlighted", function(d) { return d.highlighted })
            .classed("selected", function(d) {return d.selected });


        this.vertices.select(".label").style("display", function(d) { return d.style.display = null; });
        this.vertices.select(".outline").style("display", function(d) { return d.style.display = null; });

        this.edges.style("display", function(d) { return d.style.display = null; });
        this.edgeLabel.style("display", function(d) { return d.style.display = null; });
        this.arrowhead_start.style("display", function(d){ return d.style.display = null; });
        this.arrowhead_end.style("display", function(d){ return d.style.display = null; });



        return this;

    };

    /**
     * Handle collisions of nodes
     * Adapted from http://bl.ocks.org/mbostock/3231298
     * https://en.wikipedia.org/wiki/Quadtree
     *
     * @private
     */
    this.handleCollisions_ = function() {

        var self = this;

        var nodes = this.nodes,
            q = d3.geom.quadtree(nodes),
            i = 0,
            len = nodes.length;

        while (++i < len) {
          q.visit(collide(nodes[i], this.opts_.force.collisionAlpha));
        }

        function collide(node, alpha) {
            var r = node.radius + 10,
                nx1 = node.x - r,
                nx2 = node.x + r,
                ny1 = node.y - r,
                ny2 = node.y + r;

            return function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== node)) {
                    var x = node.x - quad.point.x,
                        y = node.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = node.radius + quad.point.radius + self.opts_.force.collisionRadius;
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        node.x -= x *= l;
                        node.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
              }
              return x1 > nx2
              || x2 < nx1
              || y1 > ny2
              || y2 < ny1;
            }
        }

    };

    /**
     * Retrieve associated links given a node
     *
     * @param nodeId, node id
     * @param nodeType, node type
     * @returns {Array}
     *
     * @export
     */
    this.getAssociatedLinks = function(nodeId, nodeType){
        var resLinks = [];
        for (var k in this.linksObj){
            if(this.linksObj.hasOwnProperty(k)){
                var l = this.linksObj[k];
                if((nodeId == l.source.id && nodeType == l.source.type)
                || (nodeId == l.target.id && nodeType == l.target.type)) {
                    resLinks.push(l);
                }
            }
        }
        return resLinks;

    };

    /**
     * Retrieve associated nodes given a node
     *
     * @param nodeId, node id
     * @param nodeType, node type
     * @returns {Array}
     *
     * @export
     */
    this.getAssociatedNodes = function(nodeId, nodeType){
        var resNodes = [];
        for (var k in this.linksObj){
            if(this.linksObj.hasOwnProperty(k)){
                var l = this.linksObj[k];
                if(nodeId == l.source.id && nodeType == l.source.type) {
                    if(!containsObj(resNodes, l.target.key)) resNodes.push(l.target);
                }
                if (nodeId == l.target.id && nodeType == l.target.type) {
                    if(!containsObj(resNodes, l.source.key)) resNodes.push(l.source);
                }
            }
        }
        return resNodes;


        function containsObj(ary, key){
            var allKeys = ary.map(function(item) { return item.key; });
            return !!~allKeys.indexOf(key);
        }

    };

    /**
     * Check if the graph has been rendered.
     *
     * @returns {boolean}
     *
     * @export
     */
    this.isRendered = function () {
        return !!this.vertices;
    };


    this.getContainer_ = function() {
        return d3.select(this.container_);
    };

    this.getCluster = function(node) {
        return this.getObjAttr(node.attr, "cluster");
    };

    this.getNodeSize = function(node) {
        return this.getObjAttr(node.style, "size");
    };

    this.getNodeByKey = function(nodeId, nodeType) {
        var nodeKey = this.nodeIDsMap[nodeId] + this.nodeIdTypeConcChar_ + this.nodeTypesMap[nodeType];
        return this.nodesObj[nodeKey];
    };

    this.getLinkByKey = function(srcid, srctype, dstid, dsttype, etype) {
        return this.linksObj[nodeIDsMap[srcid] + this.nodeIdTypeConcChar_ + this.nodeTypesMap[srctype] + this.linkKeyConcChar_ + this.nodeIDsMap[dstid] + this.nodeIdTypeConcChar_ + this.nodeTypesMap[dsttype] + this.linkKeyConcChar_ + this.linkTypesMap[etype]];
    };

    this.getNodeShape = function(node) {
        return this.getObjAttr(node.style, "shape");
    };

    this.getNodeStyle = function(node) {
        return {
            "fill": this.getObjAttr(node.style, "fill"),
            "stroke": this.getObjAttr(node.style, "stroke"),
            "strokeWidth": this.getObjAttr(node.style, "strokeWidth"),
            "opacity": this.getObjAttr(node.style, "opacity")
        }
    };

    this.getLinkStyle = function(link) {
        return {
            "stroke": this.getObjAttr(link.style, "stroke"),
            "strokeWidth": this.getObjAttr(link.style, "strokeWidth"),
            "opacity": this.getObjAttr(link.style, "opacity")
        }
    };

    this.getLocation = function (p) {
        var translate = this.getTranslation(),
            scale = this.getScale();
        return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
    };

    this.getPoint = function(l) {
        var translate = this.getTranslation(),
            scale = this.getScale();

        return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
    };

    this.getTranslation = function() {
        return this.zoomL.translate();
    };

    this.getScale = function() {
        return this.zoomL.scale();
    };

    this.translateTo = function(p, l) {
        var translate = this.getTranslation(),
            loc = this.getPoint(l);

        translate[0] += p[0] - loc[0],
        translate[1] += p[1] - loc[1];

        this.zoomL.translate(translate);
    };

    this.getObjAttr = function(obj, attr) {
        if (obj.hasOwnProperty(attr)) {
            return obj[attr];
        }
        return null;
    };

    this.getObjAttrUpDown = function(obj, attr) {
        if (obj.hasOwnProperty(attr)) {
            return obj[attr];
        } else if (obj["attr"].hasOwnProperty(attr)) {
            return obj["attr"][attr];
        }
        return null;
    }
   
};

