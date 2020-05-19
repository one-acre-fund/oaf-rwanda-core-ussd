/*
main module for downpayment trial in RW
similar to the enr module
*/

var msgs = require('./lib/msg-retrieve');
var populate_menu = require('./lib/populate-menu')
var get_menu_option = require('./lib/get-menu-option');

/*
global options - feel free to refactor someday
*/
const lang = project.getOrCreateDataTable('ussd_settings').queryRows({'vars' : {'settings' : 'dpm_lang'}}).next().vars.value;
const an_pool = project.getOrCreateDataTable('ussd_settings').queryRows({'vars' : {'settings' : 'dpm_client_pool'}}).next().vars.value;
const glus_pool = project.getOrCreateDataTable('ussd_settings').queryRows({'vars' : {'settings' : 'dpm_glus_pool'}}).next().vars.value;
/*
main function
*/
global.main = function(){
    var splash_menu = populate_menu('dpm_splash', lang);
    var current_menu = msgs('dpm_splash', {'$DPM_SPLASH' : splash_menu}, lang);
    state.vars.current_menu_str = current_menu;
    state.vars.session_authorized = false;
    sayText(current_menu);
    promptDigits('dpm_splash', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
};

addInputHandler('dpm_splash', function(input){ //input handler for splash - expected inputs in table 'dpm_splash' on tr
    state.vars.current_step = 'dpm_splash';
    input = parseInt(input.replace(/\D/g,''));
    var selection = get_menu_option(input, state.vars.current_step); //add if selection order inputs, review inputs pass to post auth if already authed
    if(selection == null){
        sayText(msgs('invalid_input', {}, lang));
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else{
        var current_menu = msgs(selection, {}, lang);
        state.vars.current_menu_str = current_menu;
        sayText(current_menu);
        promptDigits(selection, {'submitOnHash' : false, 'maxDigits' : 2,'timeout' : 80})
    }
}); // end of splash

/*
input handlers for registration steps
*/
addInputHandler('dpm_reg_start', function(input){ //input is first entry of nid - next step is nid confirm 
    state.vars.current_step = 'dpm_reg_start';
    input = input.replace(/\D/g,'');
    var check_if_nid = require('./lib/enr-check-nid');
    var is_already_reg = require('./lib/enr-check-dup-nid');
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else if(!check_if_nid(input)){
        sayText(msgs('enr_invalid_nid', {}, lang));
        promptDigits('enr_reg_start', {'submitOnHash' : false, 'maxDigits' : 16,'timeout' : 180})
    }
    else if(is_already_reg(input, an_pool)){ //fixed april 16??
        var an_retrieve_from_nid = require('./lib/dpm-get-client-by-nid');
        var client_data = an_retrieve_from_nid(input, an_pool);
        var enr_msg = msgs('dpm_reg_complete', {'$ACCOUNT_NUMBER' : client_data.account_number, '$OAFID' : client_data.oafid}, lang);
        sayText(enr_msg);
        var enr_msg_sms = msgs('dpm_reg_complete_sms', {'$ACCOUNT_NUMBER' : client_data.account_number, '$OAFID' : client_data.oafid}, lang);
        var messager = require('./lib/enr-messager');
        messager(contact.phone_number, enr_msg_sms);
        promptDigits('dpm_continue', {'submitOnHash' : false, 'maxDigits' : 16,'timeout' : 180});
    }
    else{
        state.vars.reg_nid = String(input);
        sayText(msgs('enr_nid_confirm', {}, lang));
        promptDigits('dpm_nid_confirm', {'submitOnHash' : false, 'maxDigits' : 16,'timeout' : 180});
    }
});

addInputHandler('dpm_nid_confirm', function(input){ //step for dd of nid. input here should match stored nid nee
    state.vars.current_step = 'dpm_nid_confirm';// need to add section to check if nid registerd already
    input = input.replace(/\D/g,'');
    console.log(input + ' : ' + state.vars.reg_nid)
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else if(String(state.vars.reg_nid) == String(input)){
        sayText(msgs('enr_name_1', {}, lang));
        promptDigits('dpm_name_1', {'submitOnHash' : false, 'maxDigits' : 2,'timeout' : 180});
    }
    else{
        sayText(msgs('enr_unmatched_nid', {}, lang));
        promptDigits('dpm_reg_start', {'submitOnHash' : false, 'maxDigits' : 16,'timeout' : 180});
    }
});

addInputHandler('dpm_name_1', function(input){ //enr name 1 step
    state.vars.current_step = 'dpm_name_1';
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    input = input.replace(/[^a-z_]/ig,'');
    if(contact.phone_number == '5550123'){ // allows for testing on the online testing env
        input = 'TEST1'
    }
    if(input === undefined || input == ''){
        sayText(msgs('enr_invalid_name_input', {}, lang));
        promptDigits('dpm_name_1',  {'submitOnHash' : false, 'maxDigits' : 2,'timeout' : 180});
    }
    else{
        state.vars.reg_name_1 = input;
        sayText(msgs('enr_name_2', {}, lang));
        promptDigits('dpm_name_2',  {'submitOnHash' : false, 'maxDigits' : 2,'timeout' : 180});
    }
});

addInputHandler('dpm_name_2', function(input){ //enr name 2 step
    state.vars.current_step = 'dpm_name_2';
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    input = input.replace(/[^a-z_]/ig,'');
    if(contact.phone_number == '5550123'){ // allows for testing on the online testing env
        input = 'TEST1'
    }
    if(input === undefined || input == ''){
        sayText(msgs('enr_invalid_name_input', {}, lang));
        promptDigits('dpm_name_2',  {'submitOnHash' : false, 'maxDigits' : 2,'timeout' : 180});
    }
    else{
        state.vars.reg_name_2 = input;
        sayText(msgs('enr_pn', {}, lang));
        promptDigits('dpm_pn', {'submitOnHash' : false, 'maxDigits' : 10,'timeout' : 180});
    }
});

addInputHandler('dpm_pn', function(input){ //enr phone number step
    state.vars.current_step = 'dpm_pn';
    input = input.replace(/\D/g,'');
    var check_pn = require('./lib/phone-format-check');
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    if(check_pn(input)){
        state.vars.reg_pn = input;
        sayText(msgs('dpm_glus', {}, lang));
        promptDigits('dpm_glus', {'submitOnHash' : false, 'maxDigits' : 2,'timeout' : 180});
    }
    else{
        sayText(msgs('invalid_pn_format', {}, lang));
        promptDigits('dpm_pn', {'submitOnHash' : false, 'maxDigits' : 2,'timeout' : 180});
    }
});

addInputHandler('dpm_glus', function(input){ //enr group leader / umudugudu support id step. last registration step
    state.vars.current_step = 'dpm_glus';
    input = input.replace(/\^W/g,'').toLowerCase();
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    var check_glus = require('./lib/enr-check-glus');
    var geo = check_glus(input, glus_pool);
    if(geo){
        var client_log = require('./lib/enr-client-logger');
        state.vars.glus = input;
        var account_number = client_log(state.vars.reg_nid, state.vars.reg_name_1, state.vars.reg_name_2, state.vars.pn, state.vars.glus, geo, an_pool);
        var get_client_by_nid = require('./lib/dpm-get-client-by-nid');
        try{
            var oafid = get_client_by_nid(state.vars.reg_nid, an_pool).oafid;
        }
        catch(error){
            admin_alert = require('./lib/admin-alert')
            admin_alert('Null OAFID gab');
        }
        var enr_msg = msgs('dpm_reg_complete', {'$ACCOUNT_NUMBER' : account_number, '$OAFID' : oafid}, lang);
        sayText(enr_msg);
        var enr_msg_sms = msgs('dpm_reg_complete_sms', {'$ACCOUNT_NUMBER' : account_number, '$OAFID' : oafid}, lang);
        var messager = require('./lib/enr-messager');
        messager(contact.phone_number, enr_msg_sms);
        messager(state.vars.reg_pn, enr_msg_sms);
        promptDigits('dpm_continue', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else{
        sayText(msgs('enr_invalid_glus', {}, lang));
        promptDigits('dpm_glus', {'submitOnHash' : false, 'maxDigits' : 4,'timeout' : 180});
    }
});//end registration steps input handlers



/*
generic input handler for returning to main splash menu
*/
addInputHandler('dpm_continue', function(input){
    state.vars.current_step = 'dpm_continue';
    input = parseInt(input.replace(/\D/g,''));
    if(input == 1){
        var splash_menu = populate_menu('dpm_splash', lang);
        var current_menu = msgs('dpm_splash', {'$DPM_SPLASH' : splash_menu}, lang);
        state.vars.current_menu_str = current_menu;
        sayText(current_menu);
        promptDigits('dpm_splash', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
    }
});

/*
input handler for invalid input - input handlers dump here for unrecognized input if there's not already a loop
*/
addInputHandler('invalid_input', function(input){
    input = parseInt(input.replace(/\D/g,''));
    if(input == 1){ //continue on to previously failed step
        sayText(state.vars.current_menu_str);
        promptDigits(state.vars.current_step, {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else if(input == 99){ //exit
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
});
