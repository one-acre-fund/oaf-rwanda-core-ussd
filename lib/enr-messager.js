/*
messaging module for enr
*/

module.exports = function(phone_number, message){
    //var settings = project.getOrCreateDataTable('ussd_settings')
    var msg_route = project.vars.sms_push_route;
    project.sendMessage({'to_number' : phone_number,'route_id' : msg_route, 'content' : message});
}

