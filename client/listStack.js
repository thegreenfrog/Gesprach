Template.listStack.helpers({
    comment: function() {
        return Nodes.find();
    },
    highlight: function() {
        return Session.get('currentSelected') == this._id ? "highlight" : "";
    }
});

Template.listStack.events = {
    'click li': function(event, template) {
        var id = this.data.id;
        var node = net.getElementById(id);
        node.select();
        Session.set('currentSelected', this._id);
    }
};

Template.listStack.onRendered(function() {
    Session.set('currentSelected', null);
    this.autorun(function(){
        console.log('re-rendering');
        Template.currentData();
    });
});