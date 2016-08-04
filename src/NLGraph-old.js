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
 * Version: 0.2
 * Finished on: 2015-07-10
 *
 * Advantages:
 *
 * 1. Multi-edges rendering between two nodes
 * 2. Readible edge labeling
 * 3. Multiple shapes rendering for nodes/links
 * 4. Flexible event handling
 * 5. Individual node/link styling
 * 6. Ease of maintenance and extention
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
 *                                                                      opacity
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
            linkStrength: 1,
            friction: 0.9,
            linkDistance: 100,
            charge: -240,
            gravity: 0.05,
            theta:0.9,
            coolingAlpha: 0.5,
            collisionAlpha: 0.9
        },

        initialScale: 1,
        brushingStatus: false,
        zoomLens: true,
        highlightColor: "#ff0000",
        zoomScaleExtent: [0.2, 10], // [min_scale, max_scale]
        tooltipTemplate: "<div>text: {{text}}</div> <div>size: {{size}}</div>"
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
    this.opts_.highlightColor = options.highlightColor || this.defaults_.highlightColor;

    this.opts_.initialScale = options.initialScale || this.defaults_.initialScale;
    this.opts_.zoomScaleExtent = options.zoomScaleExtent || this.defaults_.zoomScaleExtent;

    this.opts_.zoomLens = options.zoomLens || this.defaults_.zoomLens;

    this.opts_.tooltipTmpl = options.tooltipTemplate || this.defaults_.tooltipTemplate;

    this.opts_.force = {};
    this.opts_.force.linkStrength = options.force_linkStrength || this.defaults_.force.linkStrength;
    this.opts_.force.friction = options.force_friction || this.defaults_.force.friction;
    this.opts_.force.linkDistance = options.force_linkDistance || this.defaults_.force.linkDistance;
    this.opts_.force.charge = options.force_charge || this.defaults_.force.charge;
    this.opts_.force.gravity = options.force_gravity || this.defaults_.force.gravity;
    this.opts_.force.theta = options.force_theta || this.defaults_.force.theta;
    this.opts_.force.coolingAlpha = options.force_coolingAlpha || this.defaults_.force.coolingAlpha;
    this.opts_.force.collisionAlpha = options.force_collisionAlpha || this.defaults_.force.collisionAlpha;


    this.opts_.brushingStatus = options.brushing || this.defaults_.brushingStatus;


    this.nodes = n;
    this.links = l;


    this.normal_text_size = 6;
    this.mouse_click_node = null;
    this.highlight_node = null;

    this.nodeRadiusScale = d3.scale.sqrt().range(NLGraph.NODE_RADIUS_RANGE);

    var line = d3.svg.line()
            .interpolate("monotone")//monotone, linear, basis
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; });



    // no used for now
    this.shiftKey = null;




    /**
     * Initialize zoom, extract data structure, create container
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

        this.trueZoom_ = this.zoomL.on("zoom", bind(this, this.refreshZoom_));
        this.nullZoom_ = d3.behavior.zoom().on("zoom", null);

        var svg = container.append("svg")
            .attr("viewBox", "0 0 " + this.opts_.width + " " + this.opts_.height)
            .attr("class", NLGraph.BASE_CONTAINER_CLASS)
            //.attr("width", this.opts_.width)
            //.attr("height", this.opts_.height)
            .attr("preserveAspectRatio", "xMinYMin meet");



        this.parent = svg.append("g");
        this.mouseEvtTargetRect = this.parent.append("rect")
            .attr("width", this.opts_.width)
            .attr("height", this.opts_.height)
            .style("fill", "none")
            .style("pointer-events", "all");



        if (this.opts_.brushingStatus) {
            svg.call(this.nullZoom_);

            this.brush_ = this.parent.append("g")
                .datum(function() { return {selected: false, previouslySelected: false}; })
                .attr("class", "brush")
                .call(this.multiSelect );

        } else {
            svg.call(this.trueZoom_);
            d3.select(".brush").remove()
        }

        if(this.opts_.zoomLens){
            this.parent.on("mousemove", this.trueZoomLens);

        } else {

        }

        this.root_ = svg;

        this.zoomL.translate([zoomWidth, zoomHeight]).scale(this.opts_.initialScale || 1);

        this.readData_(this.nodes, this.links);


    };

    /**
     * Used for new graph
     *
     * @param b, true or false for switch of multi-select mode
     * @returns {NLGraph}
     */
    this.mulSelectMode = function(b) {
        this.opts_.brushingStatus = (Boolean)(b);
        return this;
    };

    /**
     * Used for new graph
     *
     * @param b, ture or false for switch of zoomLens
     * @returns {NLGraph}
     */
    this.zoomLensMode = function(b) {
        this.opts_.zoomLens = (Boolean)(b);
        return this;
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
        var self = this;

        if (!this.opts_.brushingStatus ) {
            this.opts_.brushingStatus = true;

            this.root_.call(this.nullZoom_);

            this.brush_ = this.parent.append("g")
                .datum(function() { return {selected: false, previouslySelected: false}; })
                .attr("class", "brush")
                .call(this.multiSelect );

        } else {
            this.opts_.brushingStatus = false;
            this.root_.call(this.trueZoom_);
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
                .each(function(d) { d.fisheye = false; })

            this.parent.on("mousemove", null);

        } else {
            this.opts_.zoomLens = true;
            this.parent.on("mousemove", this.trueZoomLens);

        }

        return this;
    };

    /**
     * Get bound data of nodes in multi-select mode
     *
     * @returns {Array}
     *
     * @export
     */
    this.getMultiSelectedNodes = function (){
        if (this.mulSelMode) {
            var sel = [];
            var extent = d3.event.target.extent();
            this.vertices.each(function(d) {
                var isWithin = d.previouslySelected ^
                                (extent[0][0] <= d.x && d.x < extent[1][0]
                                    && extent[0][1] <= d.y
                                    && d.y < extent[1][1]
                                );
                d.selected = isWithin;
                if(isWithin) {
                    sel.push(d);
                }


            });

            return sel;
        }

        return [];
    };

    /**
     * Get bound data of links in multi-select mode
     *
     * @returns {Array}
     *
     * @export
     */
    this.getMultiSelectedLinks = function (){
        if (this.mulSelMode) {
            var sel = [];
            var extent = d3.event.target.extent();
            this.edges.each(function(d) {
                var isWithin = d.previouslySelected ^
                                ((extent[0][0] <= d.srcOuterRadius[0] && d.srcOuterRadius[0] < extent[1][0]
                                    && extent[0][1] <= d.srcOuterRadius[1]
                                    && d.srcOuterRadius[1] < extent[1][1]
                                ) &&
                                (extent[0][0] <= d.tgtOuterRadius[0] && d.tgtOuterRadius[0] < extent[1][0]
                                    && extent[0][1] <= d.tgtOuterRadius[1]
                                    && d.tgtOuterRadius[1] < extent[1][1]
                                ));

                d.selected = isWithin;
                if(isWithin) {
                    sel.push(d);
                }


            });

            return sel;

        }

        return [];

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
        var n;

        if (!node) {
          n = this.state.focused;
          if (n) {
            node = [ n.x, n.y ];
          } else {
            if (!this.massCenter) {
              this.computeCenterCoords_();
            }

            node = this.massCenter;
          }
        }

        this.translateTo([this.opts_.width/2, this.opts_.height/2], node);
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

        this.multiSelect = d3.svg.brush()
            //.x(self.zoomL.x()) // some situation
            //.y(self.zoomL.y()) // some situation
            .x(d3.scale.identity().domain([0, this.opts_.width]))
            .y(d3.scale.identity().domain([0, this.opts_.height]))
            .on("brushstart", function(d) {
                self.vertices.each(function(d) { d.previouslySelected = self.shiftKey && d.selected; });
                self.edges.each(function(d) { d.previouslySelected = self.shiftKey && d.selected; });
                self.mulSelMode = true;
            })
            .on("brush", function() {

                var extent = d3.event.target.extent();
                self.vertices.select(".shape").classed("selected", function(d) {

                    return d.selected = d.previouslySelected ^
                        (extent[0][0] <= d.x && d.x < extent[1][0]
                            && extent[0][1] <= d.y
                            && d.y < extent[1][1]
                        );

                });


                self.edges.classed("selected", function(d) {
                    var isWithin = d.previouslySelected ^
                        ((extent[0][0] <= d.srcOuterRadius[0] && d.srcOuterRadius[0] < extent[1][0]
                            && extent[0][1] <= d.srcOuterRadius[1]
                            && d.srcOuterRadius[1] < extent[1][1]
                        ) &&
                        (extent[0][0] <= d.tgtOuterRadius[0] && d.tgtOuterRadius[0] < extent[1][0]
                            && extent[0][1] <= d.tgtOuterRadius[1]
                            && d.tgtOuterRadius[1] < extent[1][1]
                        ));

                    if(isWithin) {
                        var marker_start = "arrow_s" + d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype,
                            marker_end = "arrow_e" + d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype;

                        d3.select("#" + marker_end).select("path").style("fill", self.opts_.highlightColor);
                        d3.select("#" + marker_start).select("path").style("fill", self.opts_.highlightColor);
                    }
                    return d.selected = isWithin;

                });

            })
            .on("brushend", function() {
                d3.event.target.clear();
                d3.select(this).call(d3.event.target);
                self.mulSelMode = false;
            })
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
        var self = this,
            nodesObj = {},
            linksObj = {},
            clustersObj = {},
            incoming = {},
            outgoing = {},
            connectedDict = {},

            maxNodeSize = 0;

        var nodeSizeFunc = function(size) {
            var sizeScale = d3.scale.pow().exponent(1)
                .domain([1,100])
                .range([8,24]);

            return Math.PI * Math.pow( sizeScale(size) || NLGraph.NORMAL_BASE_NODE_SIZE, 2);


        };


        nodes.forEach(function (d) {
            d.shapeSize = nodeSizeFunc(d.style.size);
            d.radius =  Math.sqrt(d.shapeSize / Math.PI) + 2;
        });

        nodes.forEach(function(node) {
            maxNodeSize = Math.max(maxNodeSize, +node.radius);
            var cluster = self.getCluster(node);
            nodesObj[node.id + "-" + node.type] = nodesObj[node.id + "-" + node.type] || node;

            if (cluster != null && clustersObj[cluster] == null) {

                // obtain color from options
                var color = self.opts_.colors[cluster];

                // initialize cluster
                clustersObj[cluster] = {};

                // save color for cluster
                clustersObj[cluster].color = color || self.opts_.color(cluster);
            }
        });

        // read link info, record outgoing and incoming nodes, and build link list
        links.forEach(function(link) {
            var n0 = link["source"],
                n1 = link["target"],
                n0Key = n0.id + "-" + n0.type,
                n1Key = n1.id + "-" + n1.type,
                source = nodesObj[n0Key],
                target = nodesObj[n1Key];

            linksObj[n0Key + "_" + n1Key + "_" + link.etype] = linksObj[n0Key + "_" + n1Key + "_" + link.etype] || link;
            // will not store link direction
            connectedDict[n0Key + "_" + n1Key] = true;

            // if not find any node in a link, the passed data has a problem.
            if (!source || !target) return;

            // add the source node to the outgoing nodes
            if (!(n0Key in outgoing)) {
                outgoing[n0Key] = {};
            }

            // add the target node to the the incoming nodes
            if (!(n1Key in incoming)) {
                incoming[n1Key] = {};
            }

            outgoing[n0Key][n1Key] = true;
            incoming[n1Key][n0Key] = true;

            // associate node with link
            link.source = source;
            link.target = target;

        });


        // Count links between two nodes
        // {0-usr_1-tag: 2, 0-usr_2-usr: 1, ...}
        // only store one of 5-movie_7-tag or 7-tag_5-movie
        var multiLinksTotalNumDict = links.map(function(l){
            return l.source.id + "-" + l.source.type + "_" + l.target.id + "-" + l.target.type;
             })
            .reduce(function(last, now) {
                var src_tgt_key = now,
                    tgt_src_key = now.split("_").reverse().join("_");
                var existingKey = last.hasOwnProperty(src_tgt_key) ? src_tgt_key : tgt_src_key;

                if (last.hasOwnProperty(existingKey) ) {
                    last[existingKey] += 1;

                } else {
                    last[existingKey] = 1;
                }

                return last;
            }, {});


        //any links with duplicate source AND target get an incremented 'linknum',
        // the number of successive links
        var copymultiLinksTotalNumDict = {};
        Object.keys(multiLinksTotalNumDict).forEach(function(key) {
            copymultiLinksTotalNumDict[ key ] = multiLinksTotalNumDict[ key ];
        });

        links.forEach(function (l){
            var prefixKey_src_tgt = l.source.id + "-" + l.source.type + "_" + l.target.id + "-" + l.target.type,
                prefixKey_tgt_src = l.target.id + "-" + l.target.type + "_" + l.source.id + "-" + l.source.type;
            var existingKey = copymultiLinksTotalNumDict.hasOwnProperty(prefixKey_src_tgt) ? prefixKey_src_tgt : prefixKey_tgt_src;

            l.linkIndex = --copymultiLinksTotalNumDict[existingKey];
            l.totalNoLinks = multiLinksTotalNumDict[existingKey];

        });



        this.nodes = nodes;
        this.links = links;
        this.incomingNodes = incoming;
        this.outgoingNodes = outgoing;
        this.nodesObj = nodesObj;
        this.linksObj = linksObj;
        this.clustersObj = clustersObj;
        this.connectedDict = connectedDict;
        this.multiLinksTotalNumDict = multiLinksTotalNumDict;

        this.maxNodeSize = maxNodeSize;
        this.nodeRadiusScale.domain([1, maxNodeSize]);
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
        for (var i = 0; i < this.nodes.length; ++i) {
            if (this.nodes[i].id == id && this.nodes[i].type == type) {
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
        var removeIdx = this.nodes.map(function(item) { return item.id + "-" + item.type; }).indexOf(id + "-" + type);

        if (removeIdx == -1) return this;

        this.nodes.splice(removeIdx, 1);

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
        var removeIdx = this.links.map(function(item) {
            return item.source.id + "-" + item.source.type + "_" +
                item.target.id + "-" + item.target.type + "_" + item.etype; })
            .indexOf(srcid + "-" + srctype + "_" + tgtid + "-" + tgttype + "_" + etype);

        if (removeIdx == -1) return this;

        this.links.splice(removeIdx, 1);

        this.readData_(this.nodes, this.links);

        this.updateGraph_();

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
    this.autofit = function(){

        //no molecules, nothing to do
        if (this.nodes.length === 0)
            return this;

        // Get the bounding box
        var
        min_x = d3.min(this.nodes.map(function(d) {return d.x;})),
        min_y = d3.min(this.nodes.map(function(d) {return d.y;})),

        max_x = d3.max(this.nodes.map(function(d) {return d.x;})),
        max_y = d3.max(this.nodes.map(function(d) {return d.y;}));


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


        // do the actual moving
        this.parent.transition().duration(500).attr("transform",
            "translate(" + [x_trans, y_trans] + ")" + " scale(" + min_ratio + ")");

        // tell the zoomer what we did so that next we zoom, it uses the
        // transformation we entered here
        this.zoomL.translate([x_trans, y_trans ]).scale(min_ratio);

        return this;

    };


    /**
     *
     * @param callBack
     * @param layoutArgs
     * @returns {*}
     *
     * @export
     *
     * usage:
     * You may have a computeLayout function, say,
     *      function clusterFunction(nodes, layoutArgs) {
     *          var newNodes = [];
     *
     *          // for each nodes
     *          // assign a x,y coordinates
     *
     *          return {"converged": true|false, "nodes": newNodes};
     *      }
     *
     * apply:
     * var layout = graph.setLayout(clusterFunction, "cluster_on", "att1");
     * graph.applyLayout(layout, 600);
     */
    this.setLayout = function(callBack, layoutArgs) {
        var that = this;

        if(callBack) {
            return function() { return that.apply(callBack, that.nodes, layoutArgs);}
        }

    };


    this.applyLayout = function(computeLayout, duration) {
        var start = Date.now(),
            // milliiseconds have elapsed
            diff = 0;

        var converged = false;

        while(!converged || diff >= 0){

            var iteration = computeLayout();
            converged = iteration["converged"];
            this.nodes = iteration["nodes"];


            diff = duration - ((Date.now() - start) | 0);

        }


        this.arrowhead_end = this.arrowhead_end.data(this.links, function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });
        this.arrowhead_start = this.arrowhead_start.data(this.links, function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });
        this.edges = this.edges.data(this.links, function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });
        this.edgeLabel = this.edgeLabel.data(this.links, function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });
        this.vertices = this.vertices.data(this.nodes, function(d) { return d.id + "-" + d.type; });

        this.vertices.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        this.linkDrawing_();
        this.refreshZoom_();


    };

    /**
     * Layout graph, render nodes, links, texts, and zoom
     * @returns {NLGraph}
     *
     * @export
     */
    this.render = function() {

        this.init_();

         // force layout as an example
        var force = d3.layout.force()
            .linkDistance(this.opts_.force.linkDistance)
            .charge(this.opts_.force.charge)
            .gravity(this.opts_.force.gravity)
            .size([this.opts_.width, this.opts_.height]);

        force.nodes(this.nodes)
            .links(this.links)
            .start();


        var predefs = this.parent.append("defs"),
            arrowhead_end = predefs.selectAll(".marker_e"),
            arrowhead_start = predefs.selectAll(".marker_s");

        var edgeGroup = this.parent.append("g"),
            edges = edgeGroup.selectAll(".link"),
            edgeLabel = edgeGroup.selectAll(".label");

        var vertices = this.parent.append("g").selectAll(".node");



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


        this.arrowhead_end = this.arrowhead_end.data(this.layout.links(), function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });

        this.arrowhead_end.enter().append("marker")
            .attr("class", "marker_e")
            .attr("id", function(d) {
                return "arrow_e" +
                    d.source.id + "-" + d.source.type + "_" +
                    d.target.id + "-" + d.target.type + "_" +
                    d.etype;
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

        this.arrowhead_start = this.arrowhead_start.data(this.layout.links(), function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });

        this.arrowhead_start
            .enter().append("marker")
            .attr("class", "marker_s")
            .attr("id", function(d) {
                return "arrow_s" +
                    d.source.id + "-" + d.source.type + "_" +
                    d.target.id + "-" + d.target.type + "_" +
                    d.etype;
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


        this.edges = this.edges.data(this.layout.links(), function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });

        this.edges.enter().insert("path", ".node")
            .attr("class", function(d) { return d.etype; })
            .attr("id", function(d) {
                return "link_" + d.source.id + "-" + d.source.type + "_" +
                    d.target.id + "-" + d.target.type + "_" +
                    d.etype;

            })
            .style("stroke", function(d) { return d.style.stroke})
            .style("stroke-width", function (d) { return d.style.strokeWidth + "px"; })
            .style("opacity", function(d) { return d.style.opacity; })
            .classed("link", true); // internal use

        this.edges.exit().remove();

        this.edgeLabel = this.edgeLabel.data(this.layout.links(), function(d) { return d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype; });

        this.edgeLabel.enter()
            .append("g")
            .attr("class", "label");

        this.edgeLabel.exit().remove();

        /*
        // test label direction
        var edgesLabel = edgeGroup.selectAll(".linkLabel")
            .data(this.links)
            .enter().append("text")
            .append("textPath")
            .attr("startOffset", "10%")
            .attr("xlink:href", function(d) { return "#link_" + d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype;})
            .text(function(d) { return "Hello, world"; });
        */


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
            d3.select(this).attr("transform", "translate(" + d3.event.x + ", " + d3.event.y + ")");
            d.x = d3.event.x;
            d.y = d3.event.y;
            self.linkDrawing_();
        }
        function dragended() {
            d3.select(this).classed("dragging", false);
        }


        this.vertices = this.vertices.data(this.nodes, function(d) { return d.id + "-" + d.type; });

        var vertexGroup = this.vertices.enter().append("g")
            .attr("class", "node")
            .call(drag);



        this.vertices
            //.on("mouseover", bind(this, this.setHighlight))
            .on("click", bind(this, this.setOpacityHighlight));
            //.on("mouseout", bind(this, this.unHighlight))




        var vertexShape = vertexGroup.append("path")
            .attr("id", function (d) { return "shape_" + d.id + "-" + d.type})
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
            .attr("dy", "0.2em")
            .attr("y", 0)
            .classed("label", true) // internal use
            .style("font-size", this.normal_text_size + "px")
            .text(function(d) { return d.id + "-" + d.type; })
	        .style("text-anchor", "middle")
            .each(function (d) {
                d.bbox = this.getBBox();
                d.ctm = this.getCTM();
            });



        vertexGroup
            .insert("rect", "text")
            .classed("outline", true) // internal use
            .attr("x", function(d) { return d.bbox.x})
            .attr("y", function(d) { return d.bbox.y})
            .attr("width", function(d) { return d.bbox.width})
            .attr("height", function(d) { return d.bbox.height});



        this.vertices.exit().transition().remove();

        this.layout.on("tick", function() {
            if (self.layout.alpha() < self.opts_.force.collisionAlpha) {
                self.handleCollisions_();
            }

            self.vertices.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            self.linkDrawing_();

            self.refreshZoom_();
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
                d.srcOuterRadius = getSourceNodeCircumferencePoint(d);
                d.tgtOuterRadius = getTargetNodeCircumferencePoint(d);

            })

            .attr("d", function(d) {

                if (d.totalNoLinks == 1) {
                    var srcX = d.srcOuterRadius[0],
                        srcY = d.srcOuterRadius[1],
                        tgtX = d.tgtOuterRadius[0],
                        tgtY = d.tgtOuterRadius[1];

                    var tmpx = srcX,
                        tmpy = srcY;
                    d.directionChanged = false;

                    if (srcX > tgtX) {
                        //swap srcX and srcY
                        srcX = tgtX;
                        srcY = tgtY;
                        tgtX = tmpx;
                        tgtY = tmpy;

                        d.directionChanged = true;

                    }

                    var dr = Math.sqrt((tgtY - srcY) * (tgtY - srcY) + (tgtX - srcX) * (tgtX - srcX));

                    // horizontal control points
                    d.c0 = [srcX + NLGraph.CONTROL_POINT_POS * dr, srcY];
                    d.c1 = [tgtX - (dr * NLGraph.CONTROL_POINT_POS), tgtY];

                    return  "M" + srcX + "," + srcY + "L" + tgtX + "," + tgtY;
                }

                var tensionAry = computeLineTensions(d.totalNoLinks);
                // d.directionChanged is going to be set in the genControlPoints4MultiLinks_
                var controlpts = self.genControlPoints4MultiLinks_(d, tensionAry[d.linkIndex]);
                // horizontal control points
                d.c0 = controlpts[1];
                d.c1 = controlpts[2];
                return line(controlpts);

            })
            .attr("transform", function(d){
                var srcX = d.srcOuterRadius[0],
                    srcY = d.srcOuterRadius[1],
                    tgtX = d.tgtOuterRadius[0],
                    tgtY = d.tgtOuterRadius[1];
                var dx = tgtX - srcX,
                    dy = tgtY - srcY;

                var theta = Math.atan2(dy, dx) * 180 / Math.PI;

                if (d.totalNoLinks == 1) return null;

                return "rotate(" + theta + " " + srcX + " " + srcY + ")";
                /*
                // for positive tensions
                return d.linkIndex % 2 !=0 ?
                "rotate(" + theta + " " + srcX + " " + srcY + ")" +
                "translate(" + (2 * srcX + dr) + "," + 2 * srcY + ") " +
                    " scale(-1,-1)" :

                "rotate("+ theta + " " + srcX + " " + srcY + ")"
                */
            });

        this.edges.each(function(d) {
                var comb = d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype;

                if (d.directed ) {
                    if (d.directionChanged) {
                        d3.select(this).attr("marker-end", null);
                        d3.select(this).attr("marker-start", function () {
                            return "url(#arrow_s" + comb + ")";
                        });
                    } else {
                        d3.select(this).attr("marker-start", null);
                        d3.select(this).attr("marker-end", function () {
                            return "url(#arrow_e" + comb + ")";
                        });
                    }
                }

                if (d.style.dashed) {
                    d3.select(this).style("stroke-dasharray", NLGraph.LINE_DASHED_PATTERN);
                }


        });

        this.edgeLabel.each(function(d) {
            var listAttrVals = [],
                attrs = {};

            var totalText = d3.select(this).selectAll("text")[0].length;

            if(totalText != 0) {

                d3.select(this).selectAll("text").each(function () {
                    var newAttr = d3.select(this).attr("multline").split("-")[0];
                    if(!attrs.hasOwnProperty(newAttr)) {
                        attrs[newAttr] = d3.select(this).text();

                    } else {
                        attrs[newAttr] = attrs[newAttr] + " " + d3.select(this).text();
                    }

                });

                for (var a in attrs) {
                    if (attrs.hasOwnProperty(a)) {
                        listAttrVals.push(attrs[a]);
                    }

                }

                d3.select(this).selectAll("text").remove();

                var pathLen = d3.select("#link_" + d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype).node().getTotalLength();

                d3.select(this).call(wrapEdgeLabel, listAttrVals, pathLen);

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
     * Create an array for line tension
     * e.g. [0.4, -0.4, 0.8, -0.8]
     *
     * @param totalNum
     * @returns {*}
     */
    function computeLineTensions(totalNum) {
        // 2 is because the tension for two directions
        // var dr = 2 / totalNum;
        var dr = .4;

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
     *
     *  if (tspanNo == 1) return baseDy - 0*lineHeight;
     *  if (tspanNo == 3) return [baseDy-1*lineHeight, baseDy, baseDy+1*lineHeight]
     *  if (tspanNo == 5) return [baseDy-2*lineHeight, baseDy-1*lineHeight, baseDy, baseDy+1*lineHeight, baseDy+2*lineHeight]
     *  if (tspanNo == 2) return [-baseDy+0*lineHeight, -baseDy+lineHeight];
     *  if (tspanNo == 4) return [-(baseDy+1*lineHeight), -baseDy, -baseDy+1*lineHeight, -baseDy+2*lineHeight]
     *  if (tspanNo == 6) return [-(baseDy+2*lineHeight), -(baseDy+1*lineHeight), -baseDy, -baseDy+1*lineHeight, -baseDy+2*lineHeight, -baseDy+3*lineHeight]
     *
     * @param baseDy
     * @param lineHeight
     * @param tspanNo
     * @returns {Array}
     */
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
    function genNodeShapePath(shapeName, size) {
        return d3.superformula().type(shapeName).size(size)();
    }

    /**
     * Calculate target coordinates of a link, which is in the circumference of the outer circle
     * @param d
     * @returns {*[]}
     */
    function getTargetNodeCircumferencePoint(d){
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

        // radius = diameter / 2
        // 8 is the space between arrowhead and the border of the shape
        var t_radius = tgtRadius + 8;

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
    function getSourceNodeCircumferencePoint(d){
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

        // radius = diameter / 2
        // 8 is the space between arrowhead and the border of the shape
        var s_radius = srcRadius + 8;

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
            var words = labels[i].split(/\s+/).reverse(),
                word,
                line = [];

            var sameAttrLineNo = 0;

            var textPath = thisTextGroup
                .append("text")
                .attr("multline", "attr_" + i + "-" + sameAttrLineNo++)
                .append("textPath")
                .attr("text-anchor", "middle")
                .attr("startOffset", "50%")
                .attr("xlink:href", "#link_" + d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype )
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
                        .attr("xlink:href", "#link_" + d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype )
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
     * Generate control points for multi-links rendering between two nodes
     *
     * @param link
     * @param tension
     * @returns {*[]}
     *
     * @private
     */
    this.genControlPoints4MultiLinks_ = function (link, tension) {
        // an offset from starting point for the first control point, a percentage distance is expected
        var f = NLGraph.CONTROL_POINT_POS,
            offset = 6; // offset from outer circle

		var x0 = link.srcOuterRadius[0],
		    y0 = link.srcOuterRadius[1],
		    x1 = link.tgtOuterRadius[0],
		    y1 = link.tgtOuterRadius[1],
            dx = x1 - x0,
            dy = y1 - y0,
            dia = Math.sqrt(dx * dx + dy * dy),
            //dr = dia / 2;
            dr = 25; // a better tested tension distance

        x1 = x0 + dia;
        y1 = y0;
        dx = x1 - x0;
        dy = y1 - y0;

        var c0 = [x0 + dia * f, y0 - dr],
            c1 = [x1 - (dia * f), y1 - dr];


        var horizontalControlPoints = [
            [x0, y0],
            c0,
            c1,
            [x1, y1]
        ];

        var n = 4 - 1; // total 4 points including x0y0 and x1y1
        if (n) {
            var i = -1,
                p,
                t;
            while (++i <= n) {
              p = horizontalControlPoints[i];
              t = i / n;

              p[0] = tension >0 ? tension * p[0] + (1 - tension) * (x0 + t * dx) :
                -tension * p[0] + (1+tension) * (x0 + t * dx) ;
              p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
              /*
              // another different shape
              p[0] = tension >0 ? (1 - tension) * p[0] + tension * (x0 + t * dx) :
              (1 + tension) * p[0] - tension * (x0 + t * dx) ;
              p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
              */
            }
        }

        // changing these links no to converge by rotation control points
        var angleC0Srcouter = Math.atan2(horizontalControlPoints[1][1] - y0, horizontalControlPoints[1][0] - x0) * 180 / Math.PI,
            new0 = rotate(x0, y0, x0 + offset, y0, angleC0Srcouter),

            angleC1Srcouter = Math.atan2( y1 - horizontalControlPoints[2][1], x1 - horizontalControlPoints[2][0]) * 180 / Math.PI,
            new1 = rotate(x1, y1, x1 - offset, y0, angleC1Srcouter);

        if (link.srcOuterRadius[0] > link.tgtOuterRadius[0]) {
            link.directionChanged = true;
            return [new1, horizontalControlPoints[2], horizontalControlPoints[1], new0];
        } else {
            link.directionChanged = false;
            return [new0, horizontalControlPoints[1], horizontalControlPoints[2], new1];
        }


    };


    /**
     * Generate control points for line
     * Shawn's code
     *
     * @param link
     * @returns {*}
     *
     * @deprecated Use genControlPoints4MultiLinks_().
     */

    this.genControlPoints = function (link) {

		var a = 0.25,
		    b = 20; // initNodeSetting.r * 4;

        var markMargin = link.directed ? 2: 0,
            srcEdgeMargin = link.source.radius + 2,
            tgtEdgeMargin = link.target.radius + 2;

		var C0 = [0, 0],
		    C1 = [0, 0];

		var x0 = link.srcOuterRadius[0],
		    y0 = link.srcOuterRadius[1],
		    x1 = link.tgtOuterRadius[0],
		    y1 = link.tgtOuterRadius[1];



        var prefixKey_src_tgt = link.source.id + "-" + link.source.type + "_" + link.target.id + "-" + link.target.type,
            prefixKey_tgt_src = link.target.id + "-" + link.target.type + "_" + link.source.id + "-" + link.source.type;
        var existingKey = this.multiLinksTotalNumDict.hasOwnProperty(prefixKey_src_tgt) ? prefixKey_src_tgt : prefixKey_tgt_src;

		var n = this.multiLinksTotalNumDict[existingKey],
            i = link.linkIndex;


		var t = (n-1-2*i) * b / 2;
		var td = Math.sqrt((x0-x1)*(x0-x1)+(y0-y1)*(y0-y1));
		var t0 = a * (td - 20) + 10;
		var t1 = (1-a) * (td - 20) + 10;


		var angle = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;

		C0[0] = x0 + t0;
		C0[1] = y0 + t;
		C1[0] = x0 + t1;
		C1[1] = y0 + t;

		C0 = rotate(x0, y0, C0[0], C0[1], angle);
		C1 = rotate(x0, y0, C1[0], C1[1], angle);


		link.c0 = C0;
		link.c1 = C1;

		var tdc = Math.sqrt((C1[0] - x1) * (C1[0] - x1) + (C1[1] - y1) * (C1[1] - y1)),
            tx0 = x0 - srcEdgeMargin * (x0 - C0[0]) / tdc,
            ty0 = y0 - srcEdgeMargin * (y0 - C0[1]) / tdc,

		    tx1 = x1 - (tgtEdgeMargin + markMargin) * (x1 - C1[0]) / tdc,
		    ty1 = y1 - (tgtEdgeMargin + markMargin) * (y1 - C1[1]) / tdc;

		if (tdc < tgtEdgeMargin) {

			if (td < srcEdgeMargin) {
				tx0 = x0;
				ty0 = y1;
				tx1 = x1;
				ty1 = y1;
			}

			C1[0] = x1 * 0.5 + x0 *0.5;
			C1[1] = y1 * 0.5 + y0 * 0.5;
			C0 = C1;
		}

		return [[tx0, ty0], C0, C1, [tx1, ty1]];
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

            var n1Key = n1.id + "-" + n1.type,
            n2Key = n2.id + "-" + n2.type;

            return this.connectedDict[n1Key + "_" + n2Key]
                || this.connectedDict[n2Key + "_" + n1Key]
                || n1Key == n2Key;
        }

        return false;
    };


    /**
     * heck if two nodes are connected
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

        if (typeof n1Id != "undefined"
            && typeof  n1Type != "undefined"
            && typeof n2Id != "undefined"
            && typeof n2Type != "undefined") {

            var n1Key = n1Id + "-" + n1Type,
            n2Key = n2Id + "-" + n2Type;

            return this.connectedDict[n1Key + "_" + n2Key]
                || this.connectedDict[n2Key + "_" + n1Key]
                || n1Key == n2Key;
        }

        return false;
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
            if (toKey == nodeId + "-" + nodeType) {
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
            if (fromKey == nodeId + "-" + nodeType) {
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
        for (var linkStr in this.connectedDict) {
            if (this.connectedDict.hasOwnProperty(linkStr)){
                var str = linkStr.split("_");
                if (str[0] == nodeId + "-" + nodeType
                        || str[1] == nodeId + "-" + nodeType
                        && this.connectedDict[linkStr]) {
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
        //this.updateBrush_();

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
     *
     * Even the graph is zoomed and panned,
     * use the same scale
     *
     * @deprecated
     *
     * @private
     */
    this.updateBrush_ = function () {
        if (d3.event.target) return;

        var extent = d3.event.target.extent();

        d3.selectAll(".node").select(".shape").classed("selected", function (d) {
            if(extent[0][0]  <= d.x && d.x < extent[1][0]  && extent[0][1]  <= d.y && d.y < extent[1][1] ) {
                // something else

                return true;
            }
            return false;
        });
    };

    /**
     * Display a set of attribute values for a node specified
     *
     * @param node
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
            listAttrVals.push(listLabel[i] + ": " + this.getObjAttrUpDown(nodeObj.attr, listLabel[i]));
        }

        var tspanDyArray = computeTspanDy(0.2, lineHeight, listLabel.length);

        this.vertices.select(".label").each(function(d) {
            if (d.id == nodeId && d.type == nodeType) {
                d3.select(this).text(null);
                var y = d3.select(this).attr("y");
                    // fixed value: 0.1em
                    //dy = parseFloat(d3.select(this).attr("dy"));

                for (var i = 0; i < listAttrVals.length; ++i) {
                    d3.select(this).append("tspan")
                        .attr("x", 0)
                        .attr("y", y)
                        .attr("dy", tspanDyArray[i] + "em" )
                        .text(listAttrVals[i]);
                }

            }
            d.bbox = this.getBBox();
            d.ctm = this.getCTM();

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
            d.ctm = this.getCTM();

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

        var linkObj = this.linksObj[srcid +"-" + srctype + "_" + dstid + "-" + dsttype + "_" + etype],
            listAttrVals = [];


        for (var i = 0; i < listLabel.length; ++i) {
            listAttrVals.push(listLabel[i] + ": " + this.getObjAttrUpDown(linkObj.attr, listLabel[i]));
        }


        this.edgeLabel.each(function(d) {
            if (d.source.id == srcid && d.source.type == srctype
                && d.target.id == dstid && d.target.type == dsttype && d.etype == etype ) {

                d3.select(this).selectAll("text").remove();

                var pathLen = d3.select("#link_" + d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype).node().getTotalLength();

                d3.select(this).call(wrapEdgeLabel, listAttrVals, pathLen);
                // Change dy for multi text tags to make sure the multi-lines follow one after another for the same attr

                var dyAry = computeEdgeLabelDy(-0.2, NLGraph.LABEL_LINE_HEIGHT, d3.select(this).selectAll("text")[0].length);
                dyAry.sort(function(a, b) { return a - b});
                d3.select(this).selectAll("text").each(function(d, i) {
                    d3.select(this).attr("dy", dyAry[i] + "em");
                })

            }
                /* another method with a bit problem
                * <text text-anchor="middle">
                    <textPath xlink:href="#link_0-usr_1-tag_adf"  >
                        <!-- 157.075 is the center of the length of an arc of radius 100 -->
                        <tspan x="157.075" dy="20" >Here0</tspan>
                        <tspan x="157.075" dy="20" >Here1</tspan>
                        <tspan x="157.075" dy="20">Here2</tspan>
                    </textPath>
                </text>*/

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
     *
     * @param node
     */
    this.setOpacityHighlight = function (node) {
        this.mouse_click_node = node;
        this.setConnectedOpacity_(node);

        this.setConnectedHighlight_(node);

    };

    /**
    * Internal use
    *
    * @param node
    */
    this.setConnectedOpacity_ = function (node) {
        var self = this;

        this.vertices.select(".shape").style("opacity", function(o) {
            return setNodeOpacity(o);
        });

        this.vertices.select(".label").style("opacity", function(o) {
            return setNodeOpacity(o);
        });

        this.edges.style("opacity", function(o) {
            return setEdgeOpacity(o)
        });

        this.edgeLabel.style("opacity", function(o) {
            return setEdgeOpacity(o)
        });

        d3.selectAll(".node .outline").style("opacity", function(d) { return self.isConnected_(node, d) ? 1 : 0.1;});
        function setNodeOpacity (curNode) {
            return self.isConnected_(node, curNode) ? 1 : 0.1;
        }
        function setEdgeOpacity (curNode) {
            return curNode.source.index == node.index || curNode.target.index == node.index ? 1 : 0.1
        }
    };

    /**
     * Internal use
     *
     * @param node
     */
    this.setConnectedHighlight_ = function (node) {
        //.style("cursor","pointer");
        if (d3.event) {
            d3.event.stopPropagation();
        }
        this.unHighlight();



        var self = this;

        this.vertices.select(".shape").style("stroke", function(o) {
            return setNodeStroke(o);
        });

        this.vertices.select(".label").style("font-weight", function(o) {
            return setLabelFont(o);
        });

        //this.edges.style("stroke", function(o) {
        //    return setEdgeStroke(o)
        //});

        function setNodeStroke (curNode) {
            return self.isConnected_(node, curNode) ? self.opts_.highlightColor : curNode.style.stroke;
        }
        function setLabelFont (curNode) {
            return self.isConnected_(node, curNode) ? "bold" : "normal";
        }
        function setEdgeStroke (curNode) {
            return curNode.source.index == node.index || curNode.target.index == node.index ? self.opts_.highlightColor : curNode.style.stroke;
        }
    };

    this.showConnections = function(nodeId, nodeType){
        if(typeof  nodeId != "undefined" && typeof nodeType != "undefined") {
            var node = this.getNodeByKey(nodeId, nodeType);
            this.setConnectedOpacity_(node);
        }
        return this;
    };

    this.highlightConnections = function(nodeId, nodeType){
        if(typeof  nodeId != "undefined" && typeof nodeType != "undefined") {
            var node = this.getNodeByKey(nodeId, nodeType);
            this.setConnectedHighlight_(node);
        }

        return this;

    };

    /**
     * Only hightlight the nodes and edges given, no others
     *
     * @param nodes - an array of {id: 1, type: 'usr'}
     * @param edges - an array of {source: {id: 0, type: 'usr'}, target: {id: 1, type: 'tag'}, etype: 'temp'}
     *
     * @export
     */
    this.highLight = function(nodes, edges) {
        var self = this;

        this.vertices.select(".shape").style("stroke", function(o) {
            return setNodeStroke(o);
        });

        this.vertices.select(".label").style("font-weight", function(o) {
            return setLabelFont(o);
        });

        this.edges.style("stroke", function(o) {
            return setEdgeStroke(o)
        });

        for (var i = 0; i < edges.length; ++i) {
            var marker_start = "arrow_s" + edges[i][0] + "-" + edges[i][1] + "_" + edges[i][2] + "-" + edges[i][3] + "_" + edges[i][4],
                marker_end = "arrow_e" + edges[i][0] + "-" + edges[i][1] + "_" + edges[i][2] + "-" + edges[i][3] + "_" + edges[i][4];

            d3.select("#" + marker_end).select("path").style("fill", self.opts_.highlightColor);
            d3.select("#" + marker_start).select("path").style("fill", self.opts_.highlightColor);

        }

        return this;

        function setNodeStroke (nodeObj) {
            var existingKey = nodeObj.id + "-" + nodeObj.type;
            var hasNode = false;

            for (var i = 0; i < nodes.length; ++i) {
                if ((nodes[i][0] + "-" + nodes[i][1]) == existingKey) {
                    hasNode = true;
                    break;
                }
            }

            return hasNode ? self.opts_.highlightColor : nodeObj.style.stroke;

        }
        function setLabelFont (verLabObj) {
            var existingKey = verLabObj.id + "-" + verLabObj.type;
            var hasNode = false;

            for (var i = 0; i < nodes.length; ++i) {
                if ((nodes[i][0] + "-" + nodes[i][1]) == existingKey) {
                    hasNode = true;
                    break;
                }
            }

            return hasNode ? "bold" : "normal";

        }
        function setEdgeStroke (edgObj) {
            var existingKey = edgObj.source.id + "-" + edgObj.source.type
                + "_" + edgObj.target.id + "-" + edgObj.target.type
                + "_" + edgObj.etype;
            var hasEdge = false;

            for (var i = 0; i < edges.length; ++i) {
                if ((edges[i][0] + "-" + edges[i][1] + "_" + edges[i][2] + "-" + edges[i][3] + "_" + edges[i][4]) == existingKey) {
                    hasEdge = true;
                    break;
                }
            }

            return hasEdge ? self.opts_.highlightColor : edgObj.style.stroke;

        }
    };

    /**
     * Hide the nodes specified
     *
     * @param nodes
     * @returns {NLGraph}
     *
     * @export
     */
    this.hideNodes = function (nodes) {


        this.vertices.select(".shape").style("display", function(o) {
            return setNodeDisplay(o);
        });

        this.vertices.select(".label").style("display", function(o) {
            return setLabelFont(o);
        });

        this.vertices.select(".outline").style("display", function(o) {
            return setLabelFont(o);
        });


        function setNodeDisplay (nodeObj) {
            var existingKey = nodeObj.id + "-" + nodeObj.type;
            var hasNode = false;

            for (var i = 0; i < nodes.length; ++i) {
                if ((nodes[i][0] + "-" + nodes[i][1]) == existingKey) {
                    hasNode = true;
                    break;
                }
            }

            return hasNode ? "none" : null;

        }
        function setLabelFont (verLabObj) {
            var existingKey = verLabObj.id + "-" + verLabObj.type;
            var hasNode = false;

            for (var i = 0; i < nodes.length; ++i) {
                if ((nodes[i][0] + "-" + nodes[i][1]) == existingKey) {
                    hasNode = true;
                    break;
                }
            }

            return hasNode ? "none" : null;

        }

        return this;

    };

    /**
     * Hide the edges specified
     *
     * @param edges
     * @returns {NLGraph}
     *
     * @export
     */
    this.hideEdges = function (edges) {
        this.edges.style("display", function(o) {
            return setEdgeDisplay(o)
        });

        function setEdgeDisplay (edgObj) {

            var existingKey = edgObj.source.id + "-" + edgObj.source.type
                + "_" + edgObj.target.id + "-" + edgObj.target.type
                + "_" + edgObj.etype;
            var hasEdge = false;

            for (var i = 0; i < edges.length; ++i) {
                if ((edges[i][0] + "-" + edges[i][1] + "_" + edges[i][2] + "-" + edges[i][3] + "_" + edges[i][4]) == existingKey) {
                    hasEdge = true;
                    break;
                }
            }

            return hasEdge ? "none" : null;

        }

        return this;
    };

    /**
     * Display the hiddedn vertices and links
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.unHide = function() {
        this.vertices.select(".shape").style("display", null);

        this.vertices.select(".label").style("display", null);
        this.vertices.select(".outline").style("display", null);

        this.edges.style("display", null);

        return this;

    };

    /**
     * Cancel the highlighting
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.unHighlight = function () {
        this.highlight_node = null;

        this.vertices.select(".shape").style("stroke", function(o) { return o.style.stroke; });

        this.vertices.select(".label").style("font-weight", "normal");

        this.edges.style("stroke", function(o) { return o.style.stroke; });

        d3.selectAll(".marker_e").select("path").style("fill", function (o) { return o.style.stroke; });
        d3.selectAll(".marker_s").select("path").style("fill", function (o) { return o.style.stroke; });

        return this;

    };

    /**
     * Have a node display in a style,
     * The styleObj can have missing key
     *
     * @param node
     * @param styleObj
     * @returns {NLGraph}
     *
     * @export
     */
    this.setNodeStyle = function (nodeId, nodeType, styleObj) {

        this.vertices.select(".shape").each(function(d) {
            if (d.id == nodeId && d.type == nodeType) {
                d3.select(this)
                    .style("fill", function(d) { return styleObj.fill || d.style.fill; })
                    .style("stroke", function(d) { return styleObj.stroke || d.style.stroke; })
                    .style("stroke-width", function(d) { return styleObj.strokeWidth || d.style.strokeWidth; })
                    .style("opacity", function(d) { return styleObj.opacity || d.style.opacity; });

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
                    .style("fill", function(d) { return styleObj.fill || d.style.fill; })
                    .style("stroke", function(d) { return styleObj.stroke || d.style.stroke; })
                    .style("stroke-width", function(d) { return styleObj.strokeWidth || d.style.strokeWidth; })
                    .style("opacity", function(d) { return styleObj.opacity || d.style.opacity; });

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
     *
     * @param edge
     * @param styleObj
     * @returns {NLGraph}
     *
     * @export
     */
    this.setEdgeStyle = function (srcId, srcType, tgtId, tgtType, eType, styleObj) {
        var existingKey = srcId + "-" + srcType
                + "_" + tgtId + "-" + tgtType
                + "_" + eType;


        this.edges.each(function(d) {
            if((d.source.id + "-" + d.source.type + "_" + d.target.id + "-" + d.target.type + "_" + d.etype) == existingKey ) {
                d3.select(this)
                    .style("stroke", function(d) { return styleObj.stroke || d.style.stroke})
                    .style("stroke-width", function (d) { return styleObj.strokeWidth || d.style.strokeWidth + "px"; })
                    .style("opacity", function(d) { return styleObj.opacity || d.style.opacity; });

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
                    .style("stroke", function(d) { return styleObj.stroke || d.style.stroke})
                    .style("stroke-width", function (d) { return styleObj.strokeWidth || d.style.strokeWidth + "px"; })
                    .style("opacity", function(d) { return styleObj.opacity || d.style.opacity; });

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
     * Reset opacity settings for vertices to the predefined, links, and labels
     *
     * @returns {NLGraph}
     *
     * @export
     */
    this.resetOpacity = function () {
        this.vertices.select(".shape").style("opacity", function(d) { return d.style.opacity; });

        this.vertices.select(".label").style("opacity", 1);

        this.edges.style("opacity", function(d) { return d.style.opacity; });

        d3.selectAll(".node .outline").style("opacity", 1);

        this.edgeLabel.style("opacity", 1);

        return this;

    };


    /**
     * Handle collisions of nodes
     *
     * @private
     */
    this.handleCollisions_ = function() {
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
                        //r = self.nodeRadiusScale(quad.point.radius || 1);
                        r = node.radius + quad.point.radius + 20;
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
     * Check if the graph has been rendered.
     *
     * @returns {boolean}
     *
     * @export
     */
    this.isRendered = function () {
        return !!this.vertices;
    };

    /**
     * Get the parent container
     * @private
     */
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
        return this.nodesObj[nodeId + "-" + nodeType];
    };

    this.getLinkByKey = function(srcid, srctype, dstid, dsttype, etype) {
        return this.linksObj[srcid + "-" + srctype + "_" + dsttype + "-" + dsttype + "_" + etype];
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

