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

    'click #hiddenBullet li': function(event, template) {
        var id = this.data.id;
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