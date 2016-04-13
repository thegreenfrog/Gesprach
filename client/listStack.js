var TieredComment = function(node, tier) {
    this.node = node;
    this.tier = tier;
};

TieredComment.prototype.level = function() {
    return this.tier;
};

function getIndex(arr, id) {
    for(var i=0; i<arr.length; i++) {
        if(arr[i].data.id == id) {
            return i;
        }
    }
    return -1;
}

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
        switch(order) {
            case 'edgeConnect':
                return Nodes.find({}, {sort: {'connective.total': -1}});
            case 'recentPost':
                return Nodes.find({}, {sort: {'data.date_order': -1}});
            case 'userActivity':
                return Nodes.find({}, {sort: {'data.user.visibility': -1, 'data.score': -1}});
            case 'commentHierarchy':
                var id = Session.get('currentId');

                var netNode = net.getElementById(id);
                var nodesInOrder = [];
                //use a stack to do a DFS traversal iteratively
                //this will put all posts in a hierarchy order.
                var stack = [];
                var allNodes = Nodes.find().fetch();
                netNode.data.visited = false;
                allNodes[getIndex(allNodes, netNode.id())].data.level = 0;
                stack.push(netNode);
                while(stack.length > 0) {
                    var top = stack.pop();
                    for(var i= 0; i < allNodes.length; i++) {
                        if(allNodes[i].data.id == top.id()) {
                            var commentNode = allNodes[i];

                            if(!commentNode.data.visited) {//skip node if we have visited it already
                                //prevents cycles

                                allNodes[i].data.visited = true;//tag node as visited now

                                var currentLevel = allNodes[i].data.level;
                                var post = new TieredComment(commentNode, currentLevel);
                                nodesInOrder.push(post);
                                var parents = getAllParents(top, currentLevel);
                                if(parents.length > 0) {
                                    for(var x=0; x<parents.length; x++) {
                                        var indx = getIndex(allNodes, parents[x].id());
                                        allNodes[indx].data.level = currentLevel + 1;
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
    },
    canVoteUp: function() {
        if (Session.get('commentOrder') == 'commentHierarchy') {
            console.log('tiered');
            //user is logged in and has not voted up this post already
            return Meteor.user() != null && this.node.data.upVotes.indexOf(Meteor.user().username) == -1;
        }
        return Meteor.user() != null && this.data.upVotes.indexOf(Meteor.user().username) == -1;
    },
    canVoteDown: function() {
        if (Session.get('commentOrder') == 'commentHierarchy') {
            return Meteor.user() != null && this.node.data.downVotes.indexOf(Meteor.user().username) == -1;
        }
        return Meteor.user() != null && this.data.downVotes.indexOf(Meteor.user().username) == -1;
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
    },

    'click .voting-table button': function(e) {//increment, decrement score
        e.stopPropagation();
        var idTag = e.currentTarget.getAttribute("id");
        if(idTag == 'up') {
            Meteor.call('updateScore', this.data.id, 1, true);
        } else {
            Meteor.call('updateScore', this.data.id, -1, false);
        }
    },
};

Template.listStack.onCreated(function() {
    Session.set('commentOrder', 'recentPost');
});

Template.listStack.onRendered(function() {
    Session.set('currentSelected', null);

    this.autorun(function(){
        console.log('re-rendering');
        Template.currentData();
    });
});