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
        Session.set('quote', text);
    },
    'click #subscribe-user' : function(event) {
        event.preventDefault();
        console.log('subscribing user');
        var id = Session.get('currentId');
        var user = Nodes.findOne({"data.id" : id}).data.user.user;
        Meteor.user().following.push(user);
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
                    Session.set('quotingComment', false);
                    Session.set('currentId', node.id());
                    Session.set('currentType', 'node');
                    node.select();
                });
            } else {//submit general post
                Meteor.call("addNode", nodeId, text, commentType, function(err, data) {
                    var node = net.getElementById(nodeId);
                    Session.set('quotingComment', false);
                    template.find("form").reset();
                    Session.set('currentType', 'node');
                    Session.set('currentId', node.id());
                    node.select();
                });
            }


        } else {
            console.log('saving comment');
            e.preventDefault();
            var newComment = e.target.comment.value;
            Meteor.call("updateNode", Session.get('currentId'), newComment, function(err, data) {
                Session.set('editComment', false);
            })
        }
    },
    'click #save-comment': function(e) {

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

    sameUser: function() {
        var id = Session.get('currentId');
        if(id != null && Meteor.user() != null) {
            var user = Nodes.findOne({"data.id" : id}).data.user.user;
            if(user != Meteor.user().username) {
                return "disabled";
            }
            return "";
        }
        console.log('id no available');
        return "disabled";
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

    signedIn: function() {
        return Meteor.user() ? "" : "disabled";
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
