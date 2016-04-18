Meteor.publish('edges', function() {
    return Edges.find();
});

Meteor.publish('nodes', function() {
    return Nodes.find();
});

Meteor.publish('users', function() {
    return Users.find();
});

Meteor.publish('userEdges', function() {
    return UserEdges.find();
})

// Meteor.publish('singleItem', function(id,type) {

//     var current = "";
//     if( type == "node") {
//             current= Nodes.findOne({"data.id" : id});
//         } else if (type== "edge"){
//             current= Edges.findOne({"data.id" : id});
//     }

//     console.log(current);
//     return current;
// });
