var TieredComment = function(node, tier) {
    this.node = node;
    this.tier = tier;
};

TieredComment.prototype.level = function() {
    return this.tier;
};

function getAllParents(top, level) {
    return parents = top.incomers(function() {
        if(this.isNode()) {
            this.data.level = level + 1;
            return true;
        }
        return false;
    });
}

Template.listStack.helpers({
    comment: function() {
        var order = Session.get('commentOrder');
        console.log(order);
        switch(order) {
            case 'edgeConnect':
                return Nodes.find({}, {sort: {'connective.total': -1}});
            case 'recentPost':
                return Nodes.find({}, {sort: {'data.date_order': -1}});
            case 'userActivity':
                return Nodes.find({}, {sort: {'data.user.visibility': -1, 'data.user.postTotal': 1}});
            case 'commentHierarchy':
                var id = Session.get('currentId');
                console.log('re-ordering comment hierarchy around: ' + id);

                var netNode = net.getElementById(id);
                var nodesInOrder = [];
                //use a stack to do a DFS traversal iteratively
                //this will put all posts in a hierarchy order.
                var stack = [];
                var allNodes = Nodes.find().fetch();
                netNode.data.visited = false;
                for(var j=0; j<allNodes.length; j++) {
                    if(allNodes[j].data.id == netNode.id()) {
                        allNodes[j].data.level = 0;
                    }
                }
                stack.push(netNode);
                while(stack.length > 0) {
                    var top = stack.pop();
                    for(var i= 0; i < allNodes.length; i++) {
                        if(allNodes[i].data.id == top.id()) {
                            var commentNode = allNodes[i];

                            if(!commentNode.data.visited) {

                                allNodes[i].data.visited = true;

                                var currentLevel = allNodes[i].data.level;
                                console.log(commentNode.data.name + " has level of: " + currentLevel);
                                var post = new TieredComment(commentNode, currentLevel);
                                nodesInOrder.push(post);
                                var parents = getAllParents(top, currentLevel);
                                if(parents.length > 0) {
                                    for(var x=0; x<parents.length; x++) {
                                        for(var k= 0; k < allNodes.length; k++) {
                                            if(allNodes[k].data.id == parents[x].id()) {
                                                allNodes[k].data.level = currentLevel + 1;
                                            }
                                        }
                                    }
                                    Array.prototype.push.apply(stack, parents);
                                }
                            }
                            break;
                        }
                    }

                }

                return nodesInOrder;
            default:
                return Nodes.find();
        }
    },
    toggleSort: function(id) {
        return Session.get('commentOrder') == id ? "highlight" : "";
    },
    highlight: function() {
        return Session.get('currentSelected') == this.data.id ? "highlight" : "";
    },
    nodeSelected: function() {
        return Session.get('currentSelected') != null;
    },
    nodeId: function() {
        return this.data.id;
    },
    date: function() {
        var d = this.data.date_created;
        var day = d.getDate();
        var month = d.getMonth() + 1; //Months are zero based
        var year = d.getFullYear();
        var hour_military = d.getHours();
        var hour = ((hour_military + 11) % 12) + 1;
        var amPm = hour_military > 11 ? 'PM' : 'AM';
        var minute = (d.getMinutes() < 10 ? '0':'') + d.getMinutes();
        var complete = day + "-" + month + "-" + year + " " + hour + ":" + minute + amPm;
        //console.log(complete);
        return complete;
    },
    tiered: function () {
        return Session.get('commentOrder') == 'commentHierarchy';
    },
    indent: function() {
        return this.tier * 20;
    },
    highlightTiered: function() {
        return Session.get('currentSelected') == this.node.data.id ? "highlight " + this.tier: "";
    },
    nodeIdTiered: function() {
        return this.node.data.id;
    },
    dateTiered: function() {
        var d = this.node.data.date_created;
        var day = d.getDate();
        var month = d.getMonth() + 1; //Months are zero based
        var year = d.getFullYear();
        var hour_military = d.getHours();
        var hour = ((hour_military + 11) % 12) + 1;
        var amPm = hour_military > 11 ? 'PM' : 'AM';
        var minute = (d.getMinutes() < 10 ? '0':'') + d.getMinutes();
        var complete = day + "-" + month + "-" + year + " " + hour + ":" + minute + amPm;
        //console.log(complete);
        return complete;
    }

});

Template.listStack.events = {
    'click #edgeConnect' : function(event) {
        event.preventDefault();
        console.log('sorting by edge connections');
        Session.set('commentOrder', 'edgeConnect');
    },

    'click #recentPost' : function(event) {
        event.preventDefault();
        console.log('sorting by date posted');

        Session.set('commentOrder', 'recentPost');
    },

    'click #userActivity' : function(event) {
        event.preventDefault();
        console.log('sorting by user activity');
        Session.set('commentOrder', 'userActivity');
    },

    'click #commentHierarchy' : function(event) {
        event.preventDefault();
        console.log('sorting by comment hierarchy');
        Session.set('commentOrder', 'commentHierarchy');
    },

    'click #hiddenBullet li': function() {

        var id;
        if(Session.get('commentOrder') == 'commentHierarchy') {
            id = this.node.data.id;
        } else {
            id = this.data.id;
        }
        var node = net.getElementById(id);
        node.select();
        //var oldId = Session.get('currentSelected');
        //if (oldId != null) {
        //    var oldNode = net.getElementById(oldId);
        //    oldNode.unselect();
        //}
        //Session.set('currentSelected', this.data.id);
    }
};

Template.listStack.onCreated(function() {
    console.log('order set');
    Session.set('commentOrder', 'recentPost');
});

Template.listStack.onRendered(function() {
    Session.set('currentSelected', null);

    this.autorun(function(){
        console.log('re-rendering');
        Template.currentData();
    });
});