
class Topgen {

    constructor() {
        this.nodes = [];
        this.links = [];
        this.baseLinks = [];
        this.baseNodes = [];
        this.selectedId   = null;
        this.linkElements = null;
        this.nodeElements = null;
        this.textElements = null;
        this.init();
        this.parseData();
        this.updateSimulation();
        this.nodeColor = '#E5E5E5';
        this.selectedNodeColor = '#C2F970';
        this.groupColor = '#DD403A';
        this.selectedGroupColor = '#DD403A';
    }


    init() {
        var self = this;
        $('#d3-svg').css('width', '100%');
        $('#d3-svg').css('height', '100%');
        var width  = $('#d3-svg').width();
        var height = $('#d3-svg').height();
        this.svg = d3.select('svg');
        this.svg.attr('width', width).attr('height', height);
        this.linkGroup = this.svg.append('g').attr('class', 'links');
        this.nodeGroup = this.svg.append('g').attr('class', 'nodes');
        this.textGroup = this.svg.append('g').attr('class', 'texts');
        this.linkForce = d3
            .forceLink()
            .id(function (link) { return link.id })
            .strength(function (link) { return link.strength });
        this.simulation = d3
            .forceSimulation()
            .force('link', this.linkForce)
            .force('charge', d3.forceManyBody().strength(-120))
            .force('center', d3.forceCenter(width / 2, height / 2));
        $(window).resize(function() {
            self.simulation = d3
                .forceSimulation()
                .force('link', self.linkForce)
                .force('charge', d3.forceManyBody().strength(-120))
                .force('center', d3.forceCenter($('#d3-svg').width() / 2, $('#d3-svg').height() / 2));
        });
        this.dragDrop = d3.drag().on('start', function (node) {
            node.fx = node.x;
            node.fy = node.y;
        }).on('drag', function (node) {
            self.simulation.alphaTarget(0.7).restart();
            node.fx = d3.event.x;
            node.fy = d3.event.y;
        }).on('end', function (node) {
            if (!d3.event.active) {
                self.simulation.alphaTarget(0)
            }
            node.fx = null;
            node.fy = null;
        });

        
        $('#add-contact').click(function(e) {
            self.addNode();
        });
    }


    parseData() {
        var json = globals.get('json');
        this.topology_version = json.version;

        // Create groups and nodes
        var group_i = 0;
        var _groups = json.groups;
        for (var group_name in _groups) {
            if (_groups.hasOwnProperty(group_name)) {
                var group = _groups[group_name];
            
                // Create group
                this.baseNodes.push({ id: group_name, group: group_i, label: group_name, level: 1 });

                // Create nodes
                for (var node_name in group) {
                    if (group.hasOwnProperty(node_name)) {
                        var node = group[node_name];
                        this.baseNodes.push({ id: node_name, group: group_i, group_name: group_name, label: node_name, level: 2 });
                        this.baseLinks.push({ target: node_name, source: group_name, strength: 0.1 });
                        
                        // Create links
                        var links = node.links;
                        if (!links) continue;
                        for (var i = 0; i < links.length; i++) {
                            var link_to = links[i];
                            this.baseLinks.push({ target: link_to, source: node_name, strength: 0.1 });
                        }
                    }
                }

                group_i++;
            }
        }
        
        // Set as current
        this.nodes = [...this.baseNodes];
        this.links = [...this.baseLinks];
    }


    getNeighbors(node) {
        return this.baseLinks.reduce(function (neighbors, link) {
            if (link.target.id === node.id) {
                neighbors.push(link.source.id);
            } else if (link.source.id === node.id) {
                neighbors.push(link.target.id);
            }
            return neighbors;
        },
        [node.id]
        );
    }

    
    isNeighborLink(node, link) {
        return link.target.id === node.id || link.source.id === node.id;
    }
  
  
    getNodeColor(node, neighbors) {
        // Selected
        if (node.id === this.selectedId) {
            // Group selected
            if (node.level === 1) {
                return this.selectedGroupColor;
            }
            // Regular node selected
            return this.selectedNodeColor;
        }
        
        // Group node unselected
        if (node.level === 1) {
            return this.groupColor;
        }

        // Regular node unselected
        if (node.level > 1) {
            return this.nodeColor;
        }

/*
        if (this.selectedId !== null && node.level === 1) {
            return 'red';
        }
        if (Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1) {
            return node.level === 1 ? '#293132' : 'green';
        }
        return node.level === 1 ? 'black' : 'gray';*/
    }


    getLinkColor(node, link) {
        if (link.source.id === 'newnode') return 'red';
        if (link.target.id === 'newnode') return 'red';
        return '#E5E5E5';
        //return this.isNeighborLink(node, link) ? '#C2F970' : '#E5E5E5';
    }
  

    getTextColor(node, neighbors) {
        if (node.id === 'newnode') return 'red';
        return 'green';
        //return Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1 ? 'green' : 'black';
    }


    showPropertiesButtons(isGroup) {
        $('#node-properties').show();
        $('#add-contact').hide();
        $('#change-group').hide();
        $('#delete').hide();
        if (isGroup) {
            $('#add-contact').show();
            $('#delete').show();
        } else {
            $('#change-group').show();
            $('#delete').show();
        }
    }

    
    // select node is called on every click
    // we either update the data according to the selection
    // or reset the data if the same node is clicked twice
    selectNode(selectedNode) {
        this.showPropertiesButtons(selectedNode.level === 1);
        var self = this;
        var name_or_group = (selectedNode.level === 1) ? 'Group: ' : 'Name: ';
        $('#selected-name').text(name_or_group + selectedNode.label);
        var selectmodes = globals.get('select-modes');
        var selectmode  = globals.get('select-mode');

        // Default
        if (selectmode === selectmodes.Default) {
            if (this.selectedId === selectedNode.id) {
                this.selectedId = null;
                this.resetData();
            } else {
                this.selectedId = selectedNode.id;
                this.updateData(selectedNode);
            }
            var neighbors = this.getNeighbors(selectedNode);
            this.nodeElements.attr('fill', function (node) { return self.getNodeColor(node, neighbors); });
            this.textElements.attr('fill', function (node) { return self.getTextColor(node, neighbors); });
            this.linkElements.attr('stroke', function (link) { return self.getLinkColor(selectedNode, link); });
        }

        this.updateSimulation();
    }


    addNode() {
        var self = this;
        
        // Ask user for a name
        this.createInputModal('Add Contact', 'Enter a name', function(name) {
            var json = globals.get('json');

            // Get selected node
            var node = false;
            for (var n in self.nodes) {
                if (self.nodes[n].id === self.selectedId) {
                    node = self.nodes[n];
                    break;
                }
            }

            // Enforce only being allowed to add a new node when a group is selected
            if (!node || !json.groups[node.id]) {
                alert('You must first select a group.');
                return;
            }
            
            // Copy selected group node and make a new regular node out of it
            var newNode = $.extend(true, {}, node);
            newNode.id = 'newnode';
            newNode.level = 2; // Change from group to regular node
            newNode.label = name;

            // Add the new node to the json
            json.groups[node.id][newNode.label] = {
                links: []
            };

            // Update json
            globals.set('json', json);

            // Update base objects
            self.baseNodes.push(newNode);
            self.baseLinks.push({ target: newNode.id, source: node.id, strength: 0.1 });

            // Update simulation
            self.updateData(newNode);
            self.updateSimulation();
            self.selectNode(node); // Unselect group
            self.selectNode(node); // Reselect group (this causes an update)
        });
    }


    totalReset() {
        this.nodes = [];
        this.links = [];
        this.baseNodes = [];
        this.baseLinks = [];
    }
  
    
    // this helper simple adds all nodes and links
    // that are missing, to recreate the initial state
    resetData() {
        var self = this;
        var nodeIds = this.nodes.map(function (node) { return node.id; })
        this.baseNodes.forEach(function (node) {
            if (nodeIds.indexOf(node.id) === -1) {
                self.nodes.push(node);
            }
        })
        this.links = this.baseLinks;
    }


    // diffing and mutating the data
    updateData(selectedNode) {
        var self = this;
        var neighbors = this.getNeighbors(selectedNode);
        var newNodes = this.baseNodes.filter(function (node) {
            return neighbors.indexOf(node.id) > -1 || node.level === 1;
        });
        var diff = {
            removed: this.nodes.filter(function (node) { return newNodes.indexOf(node) === -1; }),
            added: newNodes.filter(function (node) { return self.nodes.indexOf(node) === -1; })
        };
        diff.removed.forEach(function (node) {
            self.nodes.splice(self.nodes.indexOf(node), 1);
        });
        diff.added.forEach(function (node) {
            self.nodes.push(node);
        });
        this.links = this.baseLinks.filter(function (link) {
            return link.target.id === selectedNode.id || link.source.id === selectedNode.id;
        });
    }


    updateGraph() {
        this.linkElements = this.linkGroup.selectAll('line').data(this.links, function (link) {
            return link.target.id + link.source.id;
        });
    
        this.linkElements.exit().remove();
    
        var linkEnter = this.linkElements
            .enter().append('line')
            .attr('stroke-width', 1)
            .attr('stroke', 'rgba(50, 50, 50, 0.2)');
    
        this.linkElements = linkEnter.merge(this.linkElements);
    
        // nodes
        this.nodeElements = this.nodeGroup.selectAll('circle')
            .data(this.nodes, function (node) { return node.id });
    
        this.nodeElements.exit().remove();
    
        var onSelectNode = this.selectNode.bind(this);
        var nodeEnter = this.nodeElements
            .enter()
            .append('circle')
            .attr('r', 10)
            .attr('fill', function (node) { return node.level === 1 ? '#DD403A' : '#E5E5E5'; })
            .style("stroke-width", 1)    // set the stroke width
            .style("stroke", "black")      // set the line colour
            .call(this.dragDrop)
            // we link the selectNode method here
            // to update the graph on every click
            .on('click', onSelectNode);
    
        this.nodeElements = nodeEnter.merge(this.nodeElements);
    
        // texts
        this.textElements = this.textGroup.selectAll('text')
            .data(this.nodes, function (node) { return node.id; });
    
        this.textElements.exit().remove();
    
        var textEnter = this.textElements
            .enter()
            .append('text')
            .attr('fill', 'green')
            .text(function (node) { return node.label; })
            .attr('font-size', 15)
            .attr('dx', 15)
            .attr('dy', 4);
    
        this.textElements = textEnter.merge(this.textElements);
    }


    updateSimulation() {
        var self = this;
        this.updateGraph()

        this.simulation.nodes(this.nodes).on('tick', () => {
            self.nodeElements
                .attr('cx', function (node) { return node.x; })
                .attr('cy', function (node) { return node.y; });
            self.textElements
                .attr('x', function (node) { return node.x; })
                .attr('y', function (node) { return node.y; });
            self.linkElements
                .attr('x1', function (link) { return link.source.x; })
                .attr('y1', function (link) { return link.source.y; })
                .attr('x2', function (link) { return link.target.x; })
                .attr('y2', function (link) { return link.target.y; });
        });

        this.simulation.force('link').links(this.links);
        this.simulation.alphaTarget(0.05).restart();
    }


    createInputModal(title, placeholder, callback) {
        $('#general-input-modal-title').text(title);
        $('#general-input-modal-text').attr('placeholder', placeholder);
        $('#general-ok, #general-cancel').off('click');
        $('#general-cancel').click(function(e) {
            $('#general-input-modal').modal('hide');
        });
        $('#general-ok').click(function(e) {
            callback($('#general-input-modal-text').val());
            $('#general-input-modal').modal('hide');
        });
        $('#general-input-modal').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
    }

}
