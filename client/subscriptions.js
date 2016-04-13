if(Meteor.isClient) {
    Meteor.subscribe('nodes');
    Meteor.subscribe('edges');
    Meteor.subscribe('comments');

}

Accounts.onCreateUser(function(options, user) {
    user.following = [];
    return user;
});