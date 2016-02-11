Template.listStack.helpers({
    comment: function() {
        return Nodes.find();
    },
    highlight: function() {
        return Session.get('currentSelected') == this.data.id ? "highlight" : "";
    },
    nodeId: function() {
        return this.data.id;
    }
});

function changeCurrentSelected(nodeId) {

};

Template.listStack.events = {
    'click li': function(event, template) {
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

Template.listStack.onRendered(function() {
    Session.set('currentSelected', null);
    this.autorun(function(){
        console.log('re-rendering');
        Template.currentData();
    });
});