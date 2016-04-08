var TieredComment = function(node, tier) {
    this.node = node;
    this.tier = tier;
};

TieredComment.prototype.level = function() {
    return this.tier;
};


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
                var node = net.getElementById(id);

                var nodes = [];
                //use a stack to do a DFS traversal iteratively
                //this will put all posts in a hierarchy order.
                var stack = [];
                node.data('level', 0);
                stack.push(node);
                while(stack.length > 0) {
                    var top = stack.pop();
                    var commentNode = Nodes.findOne({
                        'data.id': top.id()
                    });
                    var currentLevel = top.data('level');
                    if(commentNode) {
                        var post = new TieredComment(commentNode, currentLevel);
                        nodes.push(post);
                    }

                    var parents = top.incomers(function() {
                        this.data('level', currentLevel+1);
                        return this.isNode();
                    });
                    if(parents.length > 0) {
                        Array.prototype.push.apply(stack, parents);
                    }
                }

                return nodes;
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