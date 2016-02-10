Meteor.methods({

    addComment : function(id, type, text) {
        Comments.insert({
          "id": id,
          "type": type,
          "body": text
        });
    },

    updateNameByType : function (itemId, type, newName) {

        if( type == "node") {

            var node = Nodes.findOne({ "data.id" : itemId });

             //update coords in DB 
            Nodes.update({
                _id: node._id
            }, {
                $set: { "data.name": newName }
            });

        } else if (type == "edge"){
            
            var edge = Edges.findOne({ "data.id" : itemId });
            
            Edges.update({
                _id: edge._id
            }, {
                $set: { "data.name": newName }
            });
        }

    },

    addNode : function (nodeId, name) {
        var x = Math.random() * 800;
        var y = Math.random() * 600;
        var username = "anonymous";
        if(Meteor.user() != null) {
            console.log(Meteor.user().username);
            username = Meteor.user().username;
        }
        Nodes.insert({
          group: 'nodes',
          data: {
            id: nodeId,
            user: username,
            starred : false,
            name : name,
            referencing: 0,
            referenced: 0
          },
          position: {
            x: x,
            y: y
          }
        });
        return {
            x: x,
            y: y
        }

    },

    deleteEdge : function(edgeId) {
        var edge = Edges.findOne({ "data.id" : edgeId });
        Edges.remove(edge);
    },

    addEdgeHelper: function(sourceId, targetId, name) {
        Edges.insert({
            group: 'edges',
            data: {
                id: 'edge' + Math.round( Math.random() * 1000000 ),
                "source" :sourceId,
                "target" :targetId,
                "name" : name
            }
        });
    },

    addEdge : function (sourceId, targetId, name) {
        console.log('creating edge with source:' + sourceId + " and target:" + targetId);
         Meteor.call('addEdgeHelper', sourceId, targetId, name, function(err, result) {
             var source = Nodes.findOne({ "data.id" : sourceId });
             Nodes.update({
                 _id: source._id
             }, {
                 $inc: { "data.referencing": 1 }
             });

             var target = Nodes.findOne({ "data.id" : targetId });
             Nodes.update({
                 _id: target._id
             }, {
                 $inc: { "data.referenced": 1 }
             });
             console.log('updated source: ' + source.data.id + "and target: " + target.data.id);
         });
    },

    deleteNode: function (nodeId) {
        var node = Nodes.findOne({ "data.id" : nodeId });
        // console.log(node);
        Nodes.remove(node);
    },

    // selectNode: function (nodeId) {
    //     var node = Nodes.findOne({ "data.id" : nodeId });
    // },

    updateNodePosition : function(nodeId, position){
        var node = Nodes.findOne({ "data.id" : nodeId });

        //update coords in DB 
        Nodes.update({
            _id: node._id
        }, {
            $set: { position: position }
        });
    },

    lockNode : function(nodeId, position){
        var node = Nodes.findOne({ "data.id" : nodeId });
        var locked = node.locked ? false : true;

        Nodes.update({
            _id: node._id
        }, {
            $set: { "locked": locked, "position" : position }
        });

    },

    starNode : function(nodeId) {

        var node = Nodes.findOne({ "data.id" : nodeId });
        var starred = node.data.starred ? false : true;

        console.log(node.data.starred, starred);

        Nodes.update({
            _id: node._id
        }, {
            $set: { "data.starred": starred }
        });

    },

    createRandomNetworkData : function(){

        // add random Nodes
        for(i = 0; i < 20; i++){
            var name =  getRandomWord();
            var nodeId =  'node' + Math.round( Math.random() * 1000000 );
            Meteor.call("addNode", nodeId, name);
        }

        // add Edges
        for(i = 0; i < 25; i++){
            var name =  getRandomWord();
            var source = Random.choice(Nodes.find().fetch());
            var target = Random.choice(Nodes.find({_id:{$ne:source._id}}).fetch());//make sure we dont connect to the source
            Meteor.call("addEdge", source.data.id, target.data.id, name);
        }
    },

    destroyNetworkData: function() {
        // console.log("delete all existing nodes and edges");
        Nodes.remove({})
        Edges.remove({})
    },

    resetNetworkData : function() {
        Meteor.call("destroyNetworkData");
        Meteor.call("createRandomNetworkData");
    }


});
