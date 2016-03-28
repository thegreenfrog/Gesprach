function changeLayout (layoutName) {
    console.log('re-rendering layout');
    // TODO : make this function smoother for multi clients
    var savePositions = function () {
        for (var i = 0; i < net.nodes().length; i++) {
            var node = net.nodes()[i];
            Meteor.call("updateNodePosition", node.id(), node.position());
        }
    };

    var layout = net.makeLayout({
        name: layoutName,
        stop: savePositions // callback on layoutstop
    });
    layout.run();
}

Template.updateLayout.helpers({
    newNodes: function() {
        return Session.get('needReRendering');
    }
});

Template.updateLayout.events({
    "click #updateLayout": function(e) {
        e.preventDefault();
        Session.set('needReRendering', false);
        changeLayout(Session.get('layout'));
    }
});