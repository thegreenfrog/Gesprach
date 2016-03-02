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

    addQuoteNode : function (nodeId, name, quotedNodeId, quoteText, commentType) {
        var x = Math.random() * 800;
        var y = Math.random() * 600;
        var username = "anonymous";
        var postTotal = 0;
        var visibility = 0;
        if(Meteor.user() != null) {
            console.log(Meteor.user().username);
            username = Meteor.user().username;
            Meteor.users.update({_id: Meteor.userId()}, {$inc: {"posts": 1}});
            postTotal = Meteor.user().posts;
            visibility = 1;
        }
        var quoteReply = false;
        if (quoteText != "") {
            quoteReply = true;
        }
        var date = new Date();
        var dateNum = date.getTime();
        Nodes.insert({
            group: 'nodes',
            connective: {
                total: 0,
                referencing: 0,
                referenced: 0
            },
            data: {
                score: 0,
                id: nodeId,
                user: {
                    user: username,
                    visibility: visibility,//determine if anonymous or has username
                    postTotal: postTotal
                },
                name: name,
                quote: {
                    present: quoteReply,
                    quoteText: quoteText,
                    quoteSourceId: quotedNodeId
                },
                commentType: commentType,
                starred : false,
                date_created: date,
                date_order: dateNum
            },
            selected: false,
            selectable: true,
            position: {
                x: x,
                y: y
            }
        });
        //create edge that points to quoted post
        Meteor.call('addEdge', nodeId, quotedNodeId, 'Quote-Reply', function(err, data) {
        //callback necessary for cytoscape to finish adding/rendering edge before returning and zooming into new post
            if(username != "anonymous") {
                console.log('updating postTotals');
                Nodes.update({"data.user.user": username}, {$set: {"data.user.postTotal": postTotal}}, {multi: true});
            }
            return {
                x: x,
                y: y
            }
        });

    },
    addNode : function (nodeId, name, commentType) {
        var x = Math.random() * 800;
        var y = Math.random() * 600;
        var username = "anonymous";
        var postTotal = 0;
        var visibility = 0;
        if(Meteor.user() != null) {
            console.log(Meteor.user().username);
            username = Meteor.user().username;
            Meteor.users.update({_id: Meteor.userId()}, {$inc: {"posts": 1}});
            postTotal = Meteor.user().posts;
            visibility = 1;
        }
        var date = new Date();
        var dateNum = date.getTime();
        Nodes.insert({
            group: 'nodes',
            connective: {
                total: 0,
                referencing: 0,
                referenced: 0
            },
            data: {
                score: 0,
                id: nodeId,
                user: {
                    user: username,
                    visibility: visibility,//determine if anonymous or has username
                    postTotal: postTotal
                },
                name: name,
                quote: {
                    present: false
                },
                commentType: commentType,
                starred : false,
                date_created: date,
                date_order: dateNum
            },
            selected: false,
            selectable: true,
            position: {
                x: x,
                y: y
            }
        });
        if(username != "anonymous") {
            console.log('updating postTotals');
            Nodes.update({"data.user.user": username}, {$set: {"data.user.postTotal": postTotal}}, {multi: true});
        }
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
            },
            "selectable": false
        });
    },

    addEdge : function (sourceId, targetId, name) {
        console.log('creating edge with source:' + sourceId + " and target:" + targetId);
         Meteor.call('addEdgeHelper', sourceId, targetId, name, function(err, result) {
             var source = Nodes.findOne({ "data.id" : sourceId });
             Nodes.update({
                 _id: source._id
             }, {
                 $inc: { "connective.referencing": 1 , "connective.total": 1, "data.score": 1}
             });

             var target = Nodes.findOne({ "data.id" : targetId });
             Nodes.update({
                 _id: target._id
             }, {
                 $inc: { "data.referenced": 1, "connective.total": 1, "data.score": 1}
             });
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
            var commentType = 'Post';
            Meteor.call("addNode", nodeId, name, commentType);
        }

        // add Edges
        for(i = 0; i < 25; i++){
            var name =  'Reply';
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
