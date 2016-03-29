net = ""; // main object to store a cytoscape graph

var graphReady = false;

if (Meteor.isClient) {

  // make sure the div is ready
  Template.network.rendered = function() {

    net = initNetwork();

    addQTip(net);
    //addCxtMenu(net);
    addBehavior(net);
    addEdgehandles(net);

      Session.set('layout', 'cola');
      Session.set('needReRendering', false);

    Tracker.autorun(function() {
      updateNetworkData(net);

    });
    Nodes.find().observeChanges({
        added: function(id, doc) {
            if(graphReady) {
                console.log("re-rendering layout after adding " + id);
                //changeLayout(Session.get('layout'));
                Session.set('needReRendering', true);
            }

        }
    });
  };
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    // Meteor.call("resetNetworkData"); // reset all nodes and edges
  });
}

function initNetwork() {

  var colors = d3.scale.category20b();

  return cytoscape({
    container: document.getElementById('cy'),
    ready: function() {
      console.log("network ready");
      updateNetworkData(net); // load data when cy is ready
        console.log('finished updating network');
        graphReady = true;
    },
    layout: { name: 'cola'},
    // style
    style: cytoscape.stylesheet()
      .selector('node')
      .style({
        'content': function(e) {
          return e.data("commentType");
        },
        'background-color': function(e) {
            var user = e.data("user");
            if(user.user == "anonymous") {
                return '#73B79B';
            } else {
                return '#B7738F';
            }
        },
        'font-size' : 12,
        'text-valign': 'center',
        'color': 'white',
        'text-outline-width': 2,
        'text-outline-color': function(e) {
          return e.locked() ? "red" : "#888"
        },
        'min-zoomed-font-size': 8,
           'width': 'mapData(score, 0, 30, 30, 100)',
           'height': 'mapData(score, 0, 30, 30, 100)'
      })
      .selector('edge')
      .style({
        'line-color': '#a3a3a3',
        'target-arrow-color': '#a3a3a3',
        'width': 1,
        'target-arrow-shape': 'triangle'
      })
        .selector(':selected')
        .style({
          'content': function(e) {
            return e.data("commentType") ? e.data("commentType") : "";
          },
            'background-color': function(e) {
                var user = e.data("user");
                if(user.user == "anonymous") {
                    return '#356752';
                } else {
                    return '#67354A';
                }
            },
          'border-width': 1,
          'border-color': '#000000'
        })
      .selector('.edgehandles-hover')
      .style({
        'background-color': 'red'
      })
      .selector('.edgehandles-source')
      .selector('.edgehandles-target')
      .selector('.edgehandles-preview, .edgehandles-ghost-edge')
      .style({
        'line-color': 'red',
        'target-arrow-color': 'red',
        'source-arrow-color': 'red'
      })

  });
}

function updateNetworkData(net) {

  // init Data
  var edges = Edges.find().fetch();
  var nodes = Nodes.find().fetch();

  net.elements().remove(); // make sure evything is clean

  if (nodes) net.add(nodes);
  if (edges) net.add(edges);

  net.reset(); // render layout
}

function addQTip(net) {
  // qtip
  net.nodes().qtip({
    content: function() {
      return this.data('id');
    }
  })
}

// contextual menu
function addCxtMenu(net) {
  net.cxtmenu({
    selector: 'node',
    commands: [{
      content: '<span class="fa fa-trash-o fa-2x"></span>',
      select: function() {

        // remove all connected edges
        this.neighborhood('edge').forEach(function(el, i) {
          // console.log(el.id());
          Meteor.call("deleteEdge", el.id());
        });

        // remove this node
        Meteor.call("deleteNode", this.id());

        // remove from graph
        net.remove(this.neighborhood('edge'))
        net.remove(this)
      }
    }, {
      content: '<span class="fa fa-star fa-2x"></span>',
      select: function() {
        Meteor.call("starNode", this.id());
        this.style({
          'background-color': 'yellow'
        })
      }
    }, {
      content: '<span class="fa fa-lock fa-2x"></span>',
      select: function() {
        // console.log( this.position() );
        Meteor.call("lockNode", this.id(), this.position());
      }
    }, {
      content: '<span class="fa fa-comments-o fa-2x"></span>',
      select: function() {
        Meteor.call("addComment", this.id());
      }

    }]
  });
}

// edgehandles
function addEdgehandles(net) {

  var onComplete = function(source, target, addedEntities) {
    Meteor.call("addEdge", source.data("id"), target.data("id"));
  };

  net.edgehandles({
    complete: onComplete
  });
};

function finishCreateEdge() {
    Session.set('addEdge', false);
    Session.set('firstNodeSelected', false);
    document.getElementById('edge').innerHTML= "Add Edge";
    var newDiv = document.createElement('i');
    newDiv.setAttribute('class', 'fa fa-plus fa-fw');
    document.getElementById('edge').appendChild(newDiv);
}

// drag behaviour
function addBehavior(net) {


    net.on('select', 'node', function(e) {
        var node = e.cyTarget;
        //if(Session.get('addEdge')) {
        // if(!Session.get('firstNodeSelected')) {
        //     console.log('adding source node');
        //     Session.set('sourceNodeId', node.id());
        //     Session.set('firstNodeSelected', true);
        //     document.getElementById('edge').innerHTML = "Select Target";
        // } else {
        //     console.log('adding second node');
        //     //draw edge
        //     var sourceNodeId = Session.get('sourceNodeId');
        //     Meteor.call("addEdge", sourceNodeId, node.id(), 'edge');
        //    finishCreateEdge();
        //
        // }
        //}
        net.animate({
            zoom: 2,
            center: {
                eles: node
            }
        }, {
            duration: 800
        });
        Session.set('currentType', "node");
        Session.set('currentId', node.id());
        var oldId = Session.get('currentSelected');
        if (oldId != null) {
            var oldNode = net.getElementById(oldId);
            oldNode.unselect();
        }
        Session.set('currentSelected', node.id());
        $("#infoBox").css('visibility', 'visible');
    });

    //net.on('select', 'edge', /*_.debounce(*/ function(e) {
    //    var edge = e.cyTarget;
    //    console.log(edge);
    //    Session.set('currentType', "edge");
    //    Session.set('currentId', edge.id());
    //    $("#infoBox").css('visibility', 'visible');
    //});

    net.on('tap', function(e){
        var target = e.cyTarget;
        if(target == net) {
            console.log('clicked in environment');
            if(Session.get('addEdge')) {
                finishCreateEdge();
            }
            Session.set('currentSelected', null);
            //$("#infoBox").css('visibility', 'hidden');
        }
    });

    net.on('drag', 'node', /*_.debounce(*/ function(e) {
        var node = e.cyTarget;
        Meteor.call('updateNodePosition', node.id(), node.position());
    })
}

