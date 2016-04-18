if(Meteor.isClient) {
    Meteor.subscribe('nodes');
    Meteor.subscribe('edges');
    Meteor.subscribe('comments');
    Meteor.subscribe('users');
    Meteor.subscribe('userEdges');
}