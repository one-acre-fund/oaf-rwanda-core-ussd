/*
messaging module for CTA
*/

module.exports = function(fo_dat, client_dat){
    //var settings = project.getOrCreateDataTable('ussd_settings')
    var msg_route = project.vars.sms_push_route;
    var cta_live = project.vars.cta_live;
    var fo_phone = fo_dat['$FO_PHONE'];
    var client_phone = client_dat['$CLIENT_PHONE'];
    var msgs = require('./msg-retrieve');
    var client_message_content = "";
    if(!(fo_phone === 0)){
        var fo_message_content = msgs('cto_fo_message_content', client_dat);
        if(cta_live === 0){ //if project is not live does not send to fo phone
            fo_phone = null;
        }
        client_message_content = msgs('cto_fo_information', fo_dat);
        if(cta_live === 1){
            project.sendMessage({'to_number' : fo_phone, 'route_id' : msg_route, 'content' : fo_message_content});
        }
    }
    else{
        client_message_content = msgs('cto_no_fo', fo_dat);
    }
    project.sendMessage({'to_number' : client_phone,'route_id' : msg_route, 'content' : client_message_content});
};
