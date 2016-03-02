Template.contextual.events= {
    //prevent clicking from impacting the graph environment since user is interacting with the infobox
    'click #infoBox' : function(event) {
        event.stopPropagation();

    },
    'click #closeInfoBox' : function(event){
        $("#infoBox").css('visibility', 'hidden');
    }
};

Template.infobox.events({
    'click #edit-comment' : function(event) {
        event.preventDefault();
        console.log('editing');
        Session.set('editComment', true);
    },
    'click #quote-comment' : function(event) {
        event.preventDefault();
        Session.set('currentType', 'addNode');
        var text = $('#comment-text')[0].innerHTML;
        Session.set('quotingComment', true);
        Session.set('quote', text)
    },
    //add Node
    'submit form': function(e, template) {
        e.preventDefault();
        if($(e.target).prop("id") == 'addNode') {
            var nodeId = 'node' + Math.round( Math.random() * 1000000 );
            var text = e.target.comment.value;
            var commentType = e.target.sel1.value;
            var quoteText = "";
            var quotedNodeId = "";
            if(Session.get('quotingComment')) {//submit post that quotes another
                quoteText = e.target.quote.value;
                quotedNodeId = Session.get('currentId');
                Meteor.call("addQuoteNode", nodeId, text, quotedNodeId, quoteText, commentType, function(err, data) {
                    var node = net.getElementById(nodeId);
                    template.find("form").reset();
                    node.select();
                    Session.set('quotingComment', false);
                    Session.set('currentType', 'node');
                });
            } else {//submit general post
                Meteor.call("addNode", nodeId, text, commentType, function(err, data) {
                    var node = net.getElementById(nodeId);
                    template.find("form").reset();
                    node.select();
                    Session.set('currentType', 'node');
                });
            }

        }
    }
});

Template.infobox.helpers({
    quotedComment: function(didItQuote) {
        return didItQuote;
    },
    quoteMaterial: function () {
        return Session.get('quote');
    },
    quotingComment: function() {
        return Session.get('quotingComment');
    },
    editMode: function() {
        return Session.get('editComment');
    },

    sameUser: function(username) {
        return username == Meteor.user().username;
    },

    onSuccess: function () {
        return function (res, val) {
            Meteor.call("updateNameByType", Session.get('currentId'), Session.get('currentType'), val);
        }
    },

     currentSelection: function() {
        var id= Session.get('currentId'),
            type = Session.get('currentType'),
            item = {};


       if( type == "node") {
            item= Nodes.findOne({"data.id" : id});
        } else if (type== "edge"){
            item= Edges.findOne({"data.id" : id});
        }

        return item;
    },

    addNode: function() {
        var type = Session.get('currentType');
        return type == "addNode";
    },

    date: function(data) {
        console.log('creating date');
        var d = data;
        var day = d.getDate();
        var month = d.getMonth() + 1; //Months are zero based
        var year = d.getFullYear();
        var hour_military = d.getHours();
        var hour = ((hour_military + 11) % 12) + 1;
        var amPm = hour_military > 11 ? 'PM' : 'AM';
        var minute = d.getMinutes();
        var complete = day + "-" + month + "-" + year + " " + hour + ":" + minute + amPm;
        console.log(complete);
        return complete;
    }
});
