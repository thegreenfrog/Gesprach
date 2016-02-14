function changeLayout (layoutName) {

    // TODO : make this function smoother for multi clients
    var savePositions = function () {
      for (var i = 0; i < net.nodes().length; i++) {
            var node = net.nodes()[i];
            Meteor.call("updateNodePosition", node.id(), node.position())
        }
    };

    var layout = net.makeLayout({ 
        name: layoutName,
        stop: savePositions // callback on layoutstop
    });
    layout.run();
}

Template._header.onRendered(function() {
   Session.set("signup", false);
});

Template._header.helpers({
   currentUsername : function() {
       console.log(Meteor.user());
       return Meteor.user().username;
   }
});

Template._header.events = {
    // add/remove nodes
    //"click #add" :  function(e){
    //    e.preventDefault();
    //    var text = $(e.target).find('[name=text]').val();
    //    console.log('called meteor method with test: ' + text);
    //    var nodeId =  'node' + Math.round( Math.random() * 1000000 );
    //    Meteor.call("addNode", nodeId, "New Node")
    //},
    //Show Sign up Form
    "click #signup-page" : function(e) {
        e.preventDefault();
        console.log("rendering signup page");
        Session.set('signup', true);
    },

    "click #signin-page" : function(e) {
        e.preventDefault();
        Session.set('signup', false);
    },

    "click #sign-out" : function(e) {
        e.preventDefault();
        Meteor.logout();
    },

    //add edge
    "click #edge" : function(e){
        Session.set('addEdge', true);
        Session.set('firstNodeSelected', false);
        e.target.blur();
        e.target.innerHTML = "Select Source";

    },

    //add Node or Log-in/Sign up
    'submit form': function(e, template) {
        e.preventDefault();
        if($(e.target).prop("id") == 'add') {
            var text = e.target.text.value;
            console.log(text);
            var nodeId = 'node' + Math.round( Math.random() * 1000000 );

            Meteor.call("addNode", nodeId, text, function(err, data) {
                template.find("form").reset();
                $('#add').dropdown("toggle");
                console.log('x:' + data.x + ' y:' + data.y);
                net.animate({
                    fit: {
                        center: net.getElementById(nodeId),
                        pan: {
                            x: 100,
                            y: 100
                        },
                        zoom: 1
                    }

                }, {
                    duration: 1000
                });
                console.log('finished panning and zooming');
            });
        }
    },

    // add random nodes 
    "click #init-data": function(){  Meteor.call("resetNetworkData"); },

    // layouts
    'click #colaLayout' : function(){ changeLayout("cola") },
    'click #arborLayout' : function(){ changeLayout("cola") },
    'click #randomLayout' : function(){ changeLayout("random") },
    'click #circleLayout' : function(){ changeLayout("circle") },
    'click #gridLayout' : function(){ changeLayout("grid") },

    // toggle add/remove edges feature
    'click #draw-edgehandles' : function(){

        // var edgeHandlesOn = Session.get('edgeHandlesOn') == "drawoff" ? "drawon" : "drawoff";
        
        // var edgeHandlesOn = Session.get('edgeHandlesOn') == 'disable' ? 'enable' : 'disable';
        var edgeHandlesOn = Session.get('edgeHandlesOn') ? false : true ;
        Session.set('edgeHandlesOn', edgeHandlesOn);
        console.log(edgeHandlesOn);
        if (edgeHandlesOn)net.edgehandles.start();
    }
};

Template.accounts.helpers({
    signupPage : function() {
        console.log('checking signup status');
        return Session.get("signup");
    }
});

Template.accounts.events = {
    'submit form': function(e, template) {
        e.preventDefault();

        if(Session.get("signup")) {
            var username = e.target.username.value;
            var password = e.target.password.value;
            var email = e.target.email.value;
            console.log('username: ' + username + " password: " + password + " email: " + email);
            Accounts.createUser({
                email: email,
                username: username,
                password: password
            }, function(error) {
                if(error) {
                    console.log(error.reason);
                    return;
                }
            });
        } else {
            var usernameEmail = e.target.usernameEmail.value;
            var password = e.target.password.value;
            Meteor.loginWithPassword(usernameEmail, password, function(error) {
                if(error && error.reason == "User not found") {
                    Meteor.loginWithPassword(usernameEmail, password, function(error) {
                        if(error) {
                            console.log(error.reason);
                            return;
                        }
                    })
                } else {
                    if(error) {
                        console.log(error.reason);
                        return;
                    }
                }

            });
        }
        Session.set("signup", false);
    }
};



