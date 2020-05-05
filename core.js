/*
OAF RW core program
*/

//global functionss
var msgs = require('./lib/msg-retrieve'); //global message handler
var admin_alert = require('./lib/admin-alert'); //global admin alerter
var get_menu_option = require('./lib/get-menu-option');
var populate_menu = require('./lib/populate-menu');

// load in geo modules and data for locator services
var geo_select = require('./lib/cta-geo-select');
var geo_process = require('./lib/cta-geo-string-processer');
var geo_mm_data = require('./dat/mm-agent-geography');
var get_time = require('./lib/enr-timestamp');
var get_client = require('./lib/enr-retrieve-client-row');

//options
//var settings_table = project.getOrCreateDataTable('ussd_settings'); //removing this to account for project variable preference
const lang = project.vars.cor_lang;
const max_digits_for_input = project.vars.max_digits; //only for testing
//const max_digits_for_nid = parseInt(settings_table.queryRows({'vars' : {'settings' : 'max_digits_nid'}}).next().vars.value); 
const max_digits_for_account_number = project.vars.max_digits_an;
//const max_digits_for_serial = 7;
const core_splash_map = project.getOrCreateDataTable(project.vars.core_enr_splash_map);
//const chicken_client_table = project.vars.chicken_client_table;
const an_pool = project.vars.enr_client_pool;
const glus_pool = project.vars.glus_pool;
const geo_menu_map = project.vars.geo_menu_map;
const timeout_length = 180;
const max_digits_for_nid = project.vars.max_digits_nid;
const max_digits_for_pn = project.vars.max_digits_pn;
const max_digits_for_glus = project.vars.max_digits_glvv;
const max_digits_for_name = project.vars.max_digits_name;

global.main = function () {
    sayText(msgs('cor_enr_main_splash'));
    promptDigits('account_number_splash', { 'submitOnHash' : false,
                                            'maxDigits'    : max_digits_for_account_number,
                                            'timeout'      : 180 });
};

/*
input handlers - one per response variable
*/
addInputHandler('account_number_splash', function(input){ //acount_number_splash input handler - main input handler for initial splash
    var response = input.replace(/\D/g,'');
    if(response == 1){
        var current_menu = msgs('enr_reg_start', {}, lang);
        state.vars.current_menu_str = current_menu;
        sayText(current_menu);
        promptDigits('enr_reg_start', {'submitOnHash' : false, 'maxDigits' : max_digits_for_nid, 'timeout' : timeout_length});
    }
    else{
        try{
            var verify = require('./lib/account-verify')
            var client_verified = verify(response);
            if(client_verified){
                sayText(msgs('account_number_verified'));
                state.vars.account_number = response;
                var splash = core_splash_map.queryRows({'vars' : {'district' : state.vars.client_district}}).next().vars.splash_menu;
                if(splash === null || splash === undefined){
                    admin_alert(state.vars.client_district + ' not found in district database');
                    throw 'ERROR : DISTRICT NOT FOUND';
                }
                state.vars.splash = splash;
                var menu = populate_menu(splash, lang);
                if(typeof(menu) == 'string'){
                    state.vars.current_menu_str = menu;
                    sayText(menu);
                    state.vars.multiple_input_menus = 0;
                    state.vars.input_menu = menu;
                    promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
                }
                else if(typeof(menu) == 'object'){
                    state.vars.input_menu_loc = 0; //watch for off by 1 errors - consider moving this to start at 1
                    state.vars.multiple_input_menus = 1;
                    state.vars.input_menu_length = Object.keys(menu).length; //this will be 1 greater than max possible loc
                    state.vars.current_menu_str = menu[state.vars.input_menu_loc];
                    sayText(menu[state.vars.input_menu_loc]);
                    state.vars.input_menu = JSON.stringify(menu);
                    promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
                }
            }
            else{
                sayText(msgs('account_number_not_found'));
            }
            
        }
        catch(error){
            console.log(error);
            admin_alert('Error on USSD test integration : '+ error + '\nAccount number: ' + response, "ERROR, ERROR, ERROR", 'marisa')
            stopRules();
        }
    }
});

addInputHandler('cor_menu_select', function(input){
    input = String(input.replace(/\D/g,''));

    // If comming from entering the group id reinitialize the input from the main menu
    if(state.vars.current_step == 'entered_glvv'){
        input =  state.vars.selected_core_input; 
    }
    state.vars.current_step = 'cor_menu_select';

    if(state.vars.multiple_input_menus){ 
        if(input == 44 &&  state.vars.input_menu_loc > 0){
            state.vars.input_menu_loc = state.vars.input_menu_loc - 1;
            var menu = JSON.parse(state.vars.input_menu)[state.vars.input_menu_loc];
            state.vars.current_menu_str = menu;
            sayText(menu);
            promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(input == 77 && (state.vars.input_menu_loc < state.vars.input_menu_length - 1)){
            state.vars.input_menu_loc = state.vars.input_menu_loc + 1;
            var menu = JSON.parse(state.vars.input_menu)[state.vars.input_menu_loc]
            state.vars.current_menu_str = menu;
            sayText(menu);
            promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(input == 44 && state.vars.input_menu_loc == 0){
            sayText(msgs('invalid_input', {}, lang));
            promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});        }
    }

    var selection = get_menu_option(input, state.vars.splash);
    state.vars.selected_core_input = input;
    if(selection === null || selection === undefined){
        sayText(msgs('invalid_input', {}, lang));
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});
        return null;
    }
    else if(selection === 'cor_get_balance'){ //inelegant
        get_balance = require('./lib/cor-get-balance');
        var balance_data = get_balance(JSON.parse(state.vars.client_json), lang);
        sayText(msgs('cor_get_balance', balance_data, lang));
        promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
    else if(selection === 'cor_get_payg'){
        payg_retrieve = require('./lib/cor-payg-retrieve');
        payg_balance = require('./lib/cor-payg-balance');
        console.log("PAYG balance is " + payg_balance(JSON.parse(state.vars.client_json)));

        // only run code if client has paid enough; otherwise tell them they haven't paid enough for a new code
        if(payg_balance(JSON.parse(state.vars.client_json))){
            // if account matches a serial number, give the client the corresponding PAYG code
            if(payg_retrieve(state.vars.account_number)){
                sayText(msgs('cor_payg_true', {'$PAYG' : state.vars.payg_code}, lang));
                promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
                return null;
            }
            // else prompt the client to enter their product's serial number
            else if(state.vars.acc_empty){
                sayText(msgs('cor_payg_false', {}, lang));
                promptDigits('cor_payg_reg', {'submitOnHash' : false, 'maxDigits' : max_digits_for_account_number, 'timeout' : timeout_length});
                return null;
            }
            // print an error message if an error occurs
            else{
                sayText(msgs('cor_payg_duplicate', {}, lang));
                promptDigits('cor_payg_reg', {'submitOnHash' : false, 'maxDigits' : max_digits_for_account_number, 'timeout' : timeout_length});
                return null;
            }
        }
        // if client doesn't have sufficient balance, tell them they haven't paid enough for a new code
        else{
            sayText(msgs('cor_payg_insufficient', {}, lang));
            promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
            return null;
        }
    }
    else if(selection === 'chx_confirm'){
        // if they have already ordered chickens, tell them how many they have ordered and ask if they'd like to change
        state.vars.chx_order = require('./lib/chx-check-order')(state.vars.account_number);
        if(state.vars.chx_order){
            // code for changing order
            sayText(msgs('chx_change_order', {'$NAME' : state.vars.client_name, '$ORDER' : state.vars.chx_order}, lang));
            promptDigits('chx_update', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else{
            // check how many chickens the client is eligible for
            var eligibility_check = require('./lib/chx-check-eligibility');
            state.vars.max_chx = eligibility_check(JSON.parse(state.vars.client_json));
            // depending on the eligibility, either prompt them to order or tell them they're not eligible and exit
            if(state.vars.max_chx === 0){
                sayText(msgs('chx_not_eligible', {}, lang));
                return null;
            }
            else{
                sayText(msgs('chx_order_message', {'$NAME' : state.vars.client_name, '$CHX_NUM' : state.vars.max_chx}));
                promptDigits('chx_place_order', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
            }
        }
    }
    else if(selection === 'cor_mm_locator'){// based on client's site and district, display a list of phone numbers near them
        // translate variables into indices
        var district = Object.keys(geo_mm_data).indexOf(state.vars.client_district);
        var site = Object.keys(geo_select(district, geo_mm_data)).indexOf(state.vars.client_site);
        // generate list of agents within client's site
        var geo_data = geo_select(site, geo_select(district, geo_mm_data));
        var k = Object.keys(geo_data);
        var agent_display = '';
        for(i = 1; i < k.length + 1; i++){
            agent_display = agent_display + i + ') ' + k[i-1] + '\n';
        }
        state.vars.current_menu = JSON.stringify(agent_display);
        // display menu of agent phone numbers
        sayText(msgs('mml_display_agents', {'$GEO_MENU' : agent_display}));
        promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
        // send the client an SMS with the phone numbers of MM agents in their site
        var agent_record = msgs('mml_display_agents', {'$GEO_MENU' : agent_display}, lang);
        var msg_route = project.vars.sms_push_route;
        project.sendMessage({'to_number' : contact.phone_number, 'route_id' : msg_route, 'content' : agent_record});
    }
    else if(selection === 'enr_order_start'){
        state.vars.multiple_input_menus = 1;
        var client = get_client(state.vars.account_number, an_pool, true);
        if(client === null || client.vars.registered == 0){
            sayText(msgs('account_number_not_found', {}, lang));
            contact.vars.account_failures = contact.vars.account_failures + 1;
            promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length})
        }
        var get_district_bundles =require('./lib/get-district-bundles')
        get_district_bundles(state.vars.client_districtId);
        if(client.vars.finalized == 1 && client.vars.geo !== 'Ruhango'){ //fix next tine for generallity
            sayText(msgs('enr_order_already_finalized', {}, lang));
            promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(client.vars.registered == 1){
            // if client does not have a glvv id entered, prompt them to enter it before continuing
            glvv_check = client.vars.glus || state.vars.glus;
            if(glvv_check == null || glvv_check == 0){
            sayText(msgs('enr_missing_glvv', {}, lang));
            promptDigits('enr_glvv_id', {'submitOnHash' : false, 'maxDigits' : 8, 'timeout' : timeout_length});
            return null;
        }
        // save glvv in client row
        client.vars.glus = state.vars.glus;
        client.save();
        // check if client is a group leader
        var gl_check = require('./lib/enr-group-leader-check');
        var is_gl = gl_check(state.vars.account_number, state.vars.glus, an_pool, glus_pool);
        // continue with order steps
        var check_live = require('./lib/enr-check-geo-active');
        if(!check_live(client.vars.geo, geo_menu_map)){
            sayText(msgs('enr_order_already_finalized', {}, lang));
            promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
            return 0;
        }
        state.vars.session_authorized = true;
        state.vars.session_account_number = state.vars.account_number;
        state.vars.client_geo = client.vars.geo;
        var prod_menu_select = require('./lib/enr-select-product-menu');
        var product_menu_table_name = prod_menu_select(state.vars.client_geo, geo_menu_map);
        state.vars.product_menu_table_name = product_menu_table_name;
        var menu = populate_menu(product_menu_table_name, lang);
        if(typeof(menu) == 'string'){
            state.vars.current_menu_str = menu;
            sayText(menu);
            state.vars.multiple_input_menus = 0;
            state.vars.input_menu = menu;
            promptDigits('enr_input_splash', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(typeof(menu) == 'object'){
            state.vars.input_menu_loc = 0; //watch for off by 1 errors - consider moving this to start at 1
            state.vars.multiple_input_menus = 1;
            state.vars.input_menu_length = Object.keys(menu).length; //this will be 1 greater than max possible loc
            state.vars.current_menu_str = menu[state.vars.input_menu_loc];
            sayText(menu[state.vars.input_menu_loc]);
            state.vars.input_menu = JSON.stringify(menu);
            promptDigits('enr_input_splash', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
    }
    else{
        sayText(msgs('account_number_not_found', {}, lang));
        contact.vars.account_failures = contact.vars.account_failures + 1;
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length})
    }
    get_time();
    }
    else if(selection === 'enr_order_review_start'){
        var client = get_client(state.vars.account_number, an_pool);
        if(client === null || client.vars.registered === 0){
            sayText(msgs('account_number_not_found', {}, lang));
            contact.vars.account_failures = contact.vars.account_failures + 1;
            promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else{
            var prod_menu_select = require('./lib/enr-select-product-menu');
            var gen_input_review = require('./lib/enr-gen-order-review'); //todo: add prepayment calc
            var input_review_menu = gen_input_review(state.vars.account_number, prod_menu_select(client.vars.geo, geo_menu_map), an_pool, lang);
            if(typeof(input_review_menu) == 'string'){
                sayText(input_review_menu);
                promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});
            }
            else{
                state.vars.multiple_review_frames = 1;
                state.vars.review_frame_loc = 0;
                state.vars.review_frame_length = Object.keys(input_review_menu).length;
                state.vars.current_review_str = input_review_menu[state.vars.review_frame_loc];
                sayText(state.vars.current_review_str);
                state.vars.review_menu = JSON.stringify(input_review_menu);
                promptDigits('enr_order_review_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
            }
        }
    }
    else if(selection === 'enr_finalize_start'){
        var client = get_client(state.vars.account_number, an_pool);
        if(client == null || client.vars.registered == 0){
            sayText(msgs('account_number_not_found', {}, lang));
            contact.vars.account_failures = contact.vars.account_failures + 1;
            promptDigits(state.vars.current_step, {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(client.vars.finalized !== 1 || client.vars.finalized === undefined){
            state.vars.session_account_number = state.vars.account_number;
            sayText(msgs('enr_finalize_verify', {}, lang));
            promptDigits('enr_finalize_verify',  {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(client.vars.finalized == 1){
            sayText(msgs('enr_already_finalized', {}, lang));
            promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
    }
    else{
        var current_menu = msgs(selection, opts, lang);
        state.vars.current_menu_str = current_menu;
        sayText(current_menu);
        promptDigits(selection, {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
});
addInputHandler('chx_update', function(input){
    input = parseInt(input.replace(/\D/g,''));
    // if they want to update, ask them to place an order
    if(input === 1){
        // check how many chickens the client is eligible for
        var eligibility_check = require('./lib/chx-check-eligibility');
        state.vars.max_chx = eligibility_check(JSON.parse(state.vars.client_json));
        // depending on the eligibility, either prompt them to order or tell them they're not eligible and exit
        if(state.vars.max_chx === 0){
            sayText(msgs('chx_not_eligible', {}, lang));
            return null;
        }
        else{
            sayText(msgs('chx_order_message', {'$NAME' : state.vars.client_name, '$CHX_NUM' : state.vars.max_chx}));
            promptDigits('chx_place_order', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
    }
    else{
        // return client to main menu
        var menu = populate_menu(state.vars.splash, lang);
        sayText(menu, lang);
        promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
        
    }
})

addInputHandler('chx_place_order', function(input){
    input = parseInt(input.replace(/\D/g,''));
    state.vars.chx_order = input;
    // veto if client has entered an invalid chicken order; otherwise ask them to confirm
    if(input >= 2 && input <= state.vars.max_chx){
        var chx_cost = 2400; // abstract
        var credit = input * chx_cost;
        sayText(msgs('chx_confirm_order', {'$ORDER' : input, '$CREDIT' : credit}, lang));
        promptDigits('chx_confirm_order',  {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
    }
    else{
        // modify message depending on the order
        if(state.vars.max_chx === 2){
            var invalid_msg = 'chx_invalid_order_opt2';
        }
        else{
            var invalid_msg = 'chx_invalid_order';
        }
        sayText(msgs(invalid_msg, {'$CHX_NUM' : state.vars.max_chx}, lang));
        promptDigits('chx_place_order', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
    }
});

addInputHandler('chx_confirm_order', function(input){
    input = parseInt(input.replace(/\D/g,''));
    if(input === 1){
        // save the confirmed order in the data table
        var chx_table = project.getOrCreateDataTable('20b_chicken_table');
        var chx_cursor = chx_table.queryRows({'vars' : {'account_number' : state.vars.account_number}});
        if(chx_cursor.hasNext()){
            chx_row = chx_cursor.next();
            if(chx_cursor.hasNext()){
                admin_alert('Duplicate AN in chx db ' + state.vars.account_number);
            }
            chx_row.vars.ordered_chickens = state.vars.chx_order;
            chx_row.save();
            // send SMS to client with confirmation code
            var conf_code = chx_row.vars.confirmation_code;
            sayText(msgs('chx_order_finalized', {'$ORDER' : state.vars.chx_order, '$VOUCHER' : conf_code}, lang));
            var conf_msg = msgs('chx_confirmation_sms', {'$ORDER' : state.vars.chx_order, '$VOUCHER' : conf_code}, lang);
            var msg_route = project.vars.sms_push_route;
            project.sendMessage({'to_number' : contact.phone_number, 'route_id' : msg_route, 'content' : conf_msg});
        }
        else{
            admin_alert('Account number ' + state.vars.account_number + ' not found in chicken dataset');
            return null;
        }
    }
    else{
        // return client to main menu
        var menu = populate_menu(state.vars.splash, lang);
        sayText(menu, lang);
        promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
        return null;
    }
});

// CODE BLOCKS BELOW ARE FOR OLD CONFIRMATION SERVICE
/* addInputHandler('chx_confirm', function(input){
    input = parseInt(input.replace(/\D/g,''));
    state.vars.current_step = 'chx_confirm';
    if(input > 0 && input <= state.vars.max_chx){
        var check_chx_conf = require('./lib/chx-check-reg');
        if(check_chx_conf(state.vars.account_number, chicken_client_table)){
            sayText(msgs('chx_already_confirmed', {}, lang));
            promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
            return null;
        }
        state.vars.confirmed_chx = input;
        sayText(msgs('chx_final_confirm', {'$CHX_NUM' : state.vars.confirmed_chx}, lang));
        promptDigits('chx_final_confirm', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
    else if(input > state.vars.max_chx){
        sayText(msgs('chx_too_many', {}, lang))
        promptDigits('invalid_input',{'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
    else{
        sayText(msgs('invalid_input', {}, lang));
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
});

addInputHandler('chx_final_confirm', function(input){ //final confirmation to ensure that correct number of chickens is picked
    input = parseInt(input.replace(/\D/g,''));
    if(input === 1){
        var save_chx_quant = require('./lib/chx-save-quant');
        var conf_code = save_chx_quant(state.vars.account_number, state.vars.confirmed_chx, chicken_client_table);
        var conf_msg = msgs('chx_confirmed', {'$CHX_NUM' : state.vars.confirmed_chx, '$CONFIRMATION_CODE' : conf_code}, lang);
        var msg_route = project.vars.sms_push_route;
        project.sendMessage({'to_number' : contact.phone_number, 'route_id' : msg_route, 'content' : conf_msg});
        sayText(conf_msg)
        promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
    else{
        sayText(msgs('chx_not_confirmed', {}, lang));
        promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
}); */

/*
generic input handler for returning to main splash menu
*/
addInputHandler('cor_continue', function(input){
    state.vars.current_step = 'cor_continue';
    input = parseInt(input.replace(/\D/g,''));
    if(input !== 99){
        var splash_menu = populate_menu(state.vars.splash, lang);
        var menu = splash_menu;
        if(typeof(menu) == 'string'){
            state.vars.current_menu_str = menu;
            sayText(menu);
            state.vars.multiple_input_menus = 0;
            state.vars.input_menu = menu;
            promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
        }
        else if(typeof(menu) == 'object'){
            state.vars.input_menu_loc = 0; //watch for off by 1 errors - consider moving this to start at 1
            state.vars.multiple_input_menus = 1;
            state.vars.input_menu_length = Object.keys(menu).length; //this will be 1 greater than max possible loc
            state.vars.current_menu_str = menu[state.vars.input_menu_loc];
            sayText(menu[state.vars.input_menu_loc]);
            state.vars.input_menu = JSON.stringify(menu);
            promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
        }
        return null;
    }
    else if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
});

/*
input handler for invalid input - input handlers dump here for unrecognized input if there's not already a loop
*/
addInputHandler('invalid_input', function(input){
    input = parseInt(input.replace(/\D/g,''));
    if(input == 1){ //continue on to previously failed step
        sayText(state.vars.current_menu_str);
        promptDigits(state.vars.current_step, {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
    else if(input == 99){ //exit
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else{
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
});

// input handler for registering serial number
addInputHandler('cor_payg_reg', function(serial_no){
    //serial_no = parseInt(serial_no.replace(/\D/g,''));
    serial_no = serial_no.replace(/^0+/,'');
    console.log("Serial number is " + serial_no + " and its type is " + typeof(serial_no));
    var serial_verify = require('./lib/cor-serial-verify');
    // if the input serial is valid, give the client their PAYG code
    if(serial_verify(serial_no)){
        sayText(msgs('cor_payg_true', {'$PAYG' : state.vars.payg_code}, lang));
        promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        return null;
    }
    // else prompt them to re-enter their serial number
    else if(state.vars.serial_status){
        sayText(msgs('cor_payg_invalid_serial', {}, lang));
        promptDigits('cor_payg_reg', {'submitOnHash' : false, 'maxDigits' : max_digits_for_account_number, 'timeout' : timeout_length})
        return null;
    }
    // if error occurs, print error message for the client
    else{
        sayText(msgs('cor_payg_error', {}, lang));
        return null;
    }
});


// Enrollement codes

//registration

/*
input handlers for registration steps
*/

//prompt for national Id then Show them the national id they have entered and ask for confirmation
addInputHandler('enr_reg_start',function(input){
    state.vars.current_step = 'enr_reg_start';
    input = String(input.replace(/\D/g,''));
    var check_if_nid = require('./lib/enr-check-nid');
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else if(!check_if_nid(input)){
        sayText(msgs('enr_invalid_nid', {}, lang));
        promptDigits('enr_reg_start', {'submitOnHash' : false, 'maxDigits' : max_digits_for_nid, 'timeout' : timeout_length})
    }
    else{
        state.vars.reg_nid = input;
        var confirmation_menu = msgs('enr_confirmation_menu',{},lang);
        var current_menu = msgs('enr_nid_client_confirmation', {'$ENR_NID_CONFIRM' : input, '$ENR_CONFIRMATION_MENU' : confirmation_menu}, lang);
        state.vars.current_menu_str = current_menu;
        sayText(current_menu);
        promptDigits('enr_nid_client_confirmation', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});

    }
});

// Checking confirmation from the user
addInputHandler('enr_nid_client_confirmation', function(input){
    state.vars.current_step = 'enr_nid_client_confirmation';
    input = String(input.replace(/\D/g,''));
    
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    
     // If the user does not confirm(chooses no)
    else if(input == 2){
        var current_menu = msgs('enr_reg_start', {}, lang);
        state.vars.current_menu_str = current_menu; // set the current menu to what the user choosed(yes/no)
        sayText(current_menu);
        promptDigits('enr_reg_start', {'submitOnHash' : false, 'maxDigits' : max_digits_for_nid, 'timeout' : timeout_length});
    }
    //If the user confirms (chooses yes)
    else if(input == 1){
        // Check if the client is already registered 
        var is_already_reg = require('./lib/enr-check-dup-nid');
        if(is_already_reg(state.vars.reg_nid , an_pool)){
            var get_client_by_nid = require('./lib/dpm-get-client-by-nid');
            var client = get_client_by_nid(state.vars.reg_nid , an_pool);
            var enr_msg = msgs('enr_reg_complete', {'$ACCOUNT_NUMBER' : client.account_number, '$NAME' : client.name1 + ' ' + client.name2}, lang)
            sayText(enr_msg);
            var enr_msg_sms = msgs('enr_reg_complete_sms', {'$ACCOUNT_NUMBER' : client.account_number, '$NAME' : client.name1 + ' ' + client.name2}, lang);
            var messager = require('./lib/enr-messager');
            messager(contact.phone_number, enr_msg_sms);
            if(state.vars.reg_pn){
                messager(state.vars.reg_pn, enr_msg_sms);
            }
            //Get client data from Roster so that all the client's data are available then redirect to the menu
            try{
            var verify = require('./lib/account-verify')
            var client_verified = verify(client.account_number);
            if(client_verified){
                sayText(msgs('account_number_verified'));
                state.vars.account_number = client.account_number;
                var splash = core_splash_map.queryRows({'vars' : {'district' : state.vars.client_district}}).next().vars.splash_menu;
                if(splash === null || splash === undefined){
                    admin_alert(state.vars.client_district + ' not found in district database');
                    throw 'ERROR : DISTRICT NOT FOUND';
                }
                state.vars.splash = splash;
                var menu = populate_menu(splash, lang);
                if(typeof(menu) == 'string'){
                    state.vars.current_menu_str = menu;
                    sayText(menu);
                    state.vars.multiple_input_menus = 0;
                    state.vars.input_menu = menu;
                    promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
                }
                else if(typeof(menu) == 'object'){
                    state.vars.input_menu_loc = 0; //watch for off by 1 errors - consider moving this to start at 1
                    state.vars.multiple_input_menus = 1;
                    state.vars.input_menu_length = Object.keys(menu).length; //this will be 1 greater than max possible loc
                    state.vars.current_menu_str = menu[state.vars.input_menu_loc];
                    sayText(menu[state.vars.input_menu_loc]);
                    state.vars.input_menu = JSON.stringify(menu);
                    promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
                }
            }
            else{
                sayText(msgs('account_number_not_found'));
            }
        }
            catch(error){
                console.log(error);
                admin_alert('Error on USSD test integration : '+ error + '\nAccount number: ' + response, "ERROR, ERROR, ERROR", 'marisa')
                stopRules();
            }
            }
            // start registration process by asking them to enter their id again
            else{
                var current_menu = msgs('enr_nid_confirm', {}, lang);
                state.vars.current_menu_str = current_menu;
                sayText(current_menu);// contains the menu that ask the user to reenter the id(after confirmation)
                promptDigits('enr_nid_confirm', {'submitOnHash' : false, 'maxDigits' : max_digits_for_nid, 'timeout' : timeout_length});
            }
            get_time();
        }
        else {
            sayText(msgs('invalid_input', {}, lang));
            promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});
        }
    

});


addInputHandler('enr_nid_confirm', function(input){ //step for dd of nid. input here should match stored nid nee
    state.vars.current_step = 'enr_nid_confirm';// need to add section to check if nid registerd already
    input = String(input.replace(/\D/g,''));
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else if(state.vars.reg_nid == input){
        sayText(msgs('enr_name_1', {}, lang));
        promptDigits('enr_name_1', {'submitOnHash' : false, 'maxDigits' : max_digits_for_name, 'timeout' : timeout_length});
    }
    else{
        sayText(msgs('enr_unmatched_nid', {}, lang));
        promptDigits('enr_reg_start', {'submitOnHash' : false, 'maxDigits' : max_digits_for_nid, 'timeout' : timeout_length});
    }
    get_time();
});

addInputHandler('enr_name_1', function(input){ //enr name 1 step
    state.vars.current_step = 'enr_name_1';
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
        promptDigits('enr_name_1',  {'submitOnHash' : false, 'maxDigits' : max_digits_for_name, 'timeout' : timeout_length});
    }
    else{
        state.vars.reg_name_1 = input;
        sayText(msgs('enr_name_2', {}, lang));
        promptDigits('enr_name_2',  {'submitOnHash' : false, 'maxDigits' : max_digits_for_name, 'timeout' : timeout_length});
    }
    get_time();
});

addInputHandler('enr_name_2', function(input){ //enr name 2 step
    state.vars.current_step = 'enr_name_2';
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
        promptDigits('enr_name_2',  {'submitOnHash' : false, 'maxDigits' : max_digits_for_name, 'timeout' : timeout_length});
    }
    else{
        state.vars.reg_name_2 = input;
        sayText(msgs('enr_pn', {}, lang));
        promptDigits('enr_pn', {'submitOnHash' : false, 'maxDigits' : max_digits_for_pn, 'timeout' : timeout_length});
    }
    get_time();
});

addInputHandler('enr_pn', function(input){ //enr phone number step
    state.vars.current_step = 'enr_pn';
    input = input.replace(/\D/g,'');
    var check_pn = require('./lib/phone-format-check');
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    if(check_pn(input)){
        state.vars.reg_pn = input;
        sayText(msgs('enr_glus', {}, lang));
        promptDigits('enr_glus', {'submitOnHash' : false, 'maxDigits' : max_digits_for_glus, 'timeout' : timeout_length});
    }
    else{
        sayText(msgs('invalid_pn_format', {}, lang));
        promptDigits('enr_pn', {'submitOnHash' : false, 'maxDigits' : max_digits_for_pn, 'timeout' : timeout_length});
    }
    get_time();
});

addInputHandler('enr_glus',function(input){
    
    input = input.replace(/\W/g,'');
    state.vars.current_step = 'enr_glus';
    
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else{
        state.vars.glus = input;
        // checking and retreiving info about the entered id
        var groupCheck = require('./lib/enr-check-gid');
        var group_information = groupCheck(input,'group_codes',lang);

        // if the info about the id is not null, ask for confirmation with the group info
        if(group_information != null){
            var confirmation_menu = msgs('enr_confirmation_menu',{},lang);
            var current_menu = msgs('enr_group_id_confirmation', {'$ENR_GROUP_ID' : input,'$LOCATION_INFO': group_information, '$ENR_CONFIRMATION_MENU' : confirmation_menu}, lang);
            state.vars.current_menu_str = current_menu;
            sayText(current_menu);
            promptDigits('enr_group_id_confirmation', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});

        }
        // if the group id is not valid, prompt them again
        else{
            sayText(msgs('invalid_group_id'));
            sayText(msgs('enr_glus', {}, lang));
            promptDigits('enr_glus', {'submitOnHash' : false, 'maxDigits' : max_digits_for_glus, 'timeout' : timeout_length});
        }
    }
    
});

addInputHandler('enr_group_id_confirmation', function(input){ //enr group leader / umudugudu support id step. last registration step

    state.vars.current_step = 'enr_glus';
    input = input.replace(/\W/g,'');
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    state.vars.confirmation = input;
    if(input  == 2){ // if the user chooses no, they will be prompt to enter the group code again
        var current_menu = msgs('enr_glus', {}, lang);
        state.vars.current_menu_str = current_menu;
        sayText(current_menu);
        promptDigits('enr_glus', {'submitOnHash' : false, 'maxDigits' : max_digits_for_glus, 'timeout' : timeout_length});

    }
    else if (input == 1) { // if the user chooses yes, that the id is correct, save the info
    var geo = state.vars.districtName;
    var check_live = require('./lib/enr-check-geo-active');
    if(geo){
        try{ // get this out of a try block as soon as bandwidth
            if(!check_live(geo, geo_menu_map)){
                console.log(geo);
                console.log(geo_menu_map);
                sayText(msgs('enr_order_period_finished', {}, lang));
                promptDigits('enr_glus', {'submitOnHash' : false, 'maxDigits' : max_digits_for_glus, 'timeout' : timeout_length});
                return 0;
            }
        }
        catch(error){
            console.log(error);
            var admin_alert = require('./lib/admin-alert');
            admin_alert('error on live - dead check\n' + error);
        }
        // if there isn't already an account number, get one
        if(state.vars.account_number == null){
            var client_log = require('./lib/enr-client-logger');
            client_log(state.vars.reg_nid, state.vars.reg_name_1, state.vars.reg_name_2, state.vars.reg_pn, state.vars.glus, geo, an_pool);
        }
        //check if group leader here
        var gl_check = require('./lib/enr-group-leader-check');
        var is_gl = gl_check(state.vars.account_number, state.vars.glus, an_pool, glus_pool);
        console.log('is gl? : ' + is_gl);
            var enr_msg = msgs('enr_reg_complete', {'$ACCOUNT_NUMBER' : state.vars.account_number, '$NAME' : state.vars.reg_name_2}, lang);
            sayText(enr_msg);
            //retreive ads per district entered by the user
            var retrieveAd = require('./lib/enr-retrieve-ad-by-district');
            var districtId = state.vars.districtId ;
            var sms_ad = retrieveAd(districtId,lang);
            var enr_msg_sms = msgs('enr_reg_complete_sms', {'$ACCOUNT_NUMBER' : state.vars.account_number, '$NAME' : state.vars.reg_name_2,'$AD_MESSAGE':sms_ad}, lang);
            var messager = require('./lib/enr-messager');
            messager(contact.phone_number, enr_msg_sms);
            messager(state.vars.reg_pn, enr_msg_sms);
            try{
                var verify = require('./lib/account-verify')
                var client_verified = verify(state.vars.account_number);
                if(client_verified){
                    sayText(msgs('account_number_verified'));
                    var splash = core_splash_map.queryRows({'vars' : {'district' : state.vars.client_district}}).next().vars.splash_menu;
                    if(splash === null || splash === undefined){
                        admin_alert(state.vars.client_district + ' not found in district database');
                        throw 'ERROR : DISTRICT NOT FOUND';
                    }
                    state.vars.splash = splash;
                    var menu = populate_menu(splash, lang);
                    if(typeof(menu) == 'string'){
                        state.vars.current_menu_str = menu;
                        sayText(menu);
                        state.vars.multiple_input_menus = 0;
                        state.vars.input_menu = menu;
                        promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
                    }
                    else if(typeof(menu) == 'object'){
                        state.vars.input_menu_loc = 0; //watch for off by 1 errors - consider moving this to start at 1
                        state.vars.multiple_input_menus = 1;
                        state.vars.input_menu_length = Object.keys(menu).length; //this will be 1 greater than max possible loc
                        state.vars.current_menu_str = menu[state.vars.input_menu_loc];
                        sayText(menu[state.vars.input_menu_loc]);
                        state.vars.input_menu = JSON.stringify(menu);
                        promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : 180});
                    }
                }
                else{
                    sayText(msgs('account_number_not_found'));
                }
            }
            catch(error){
                console.log(error);
                admin_alert('Error on USSD test integration : '+ error + '\nAccount number: ' + response, "ERROR, ERROR, ERROR", 'marisa')
                stopRules();
            }
            
    }
    else{
        sayText(msgs('enr_invalid_glus', {}, lang));
        promptDigits('enr_glus', {'submitOnHash' : false, 'maxDigits' : max_digits_for_glus, 'timeout' : timeout_length});
    }
}
else{// If there is an invalid input(not one or two)
    sayText(msgs('invalid_input', {}, lang));
    promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});
    
}
    get_time();
});//end registration steps input handlers



// input handler for entering glvv id. note, do we want to check if this matches the client's district?
//Called when the user ordering does not have a group id
addInputHandler('enr_glvv_id', function(input){
    state.vars.current_step = 'entered_glvv'; 
    // check if glvv is valid
    var check_glus = require('./lib/enr-check-glus');
    input = input.replace(/\W/g,''); //added some quick sanitation to this input
    if(check_glus(input, glus_pool)){
        state.vars.glus = input;
        var gl_check = require('./lib/enr-group-leader-check');
        var is_gl = gl_check(state.vars.account_number, state.vars.glus, an_pool);
        console.log('is gl? : ' + is_gl);
        // return to enr_order_start - give the client their account number in the message?
        sayText(msgs('enr_continue', {'$GROUP' : state.vars.glus}, lang));
        promptDigits('cor_menu_select', {'submitOnHash' : false, 'maxDigits' : 1, 'timeout' : timeout_length});
        return null;
    }
    else{
        sayText(msgs('enr_incorrect_glvv', {}, lang));
        promptDigits('enr_glvv_id', {'submitOnHash' : false, 'maxDigits' : 8, 'timeout' : timeout_length});
        return null;
    }
});

//Main menu from placing an order

addInputHandler('enr_input_splash', function(input){ //main input menu
    state.vars.current_step = 'enr_input_splash';
    input = parseInt(input.replace(/\D/g,''));
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    var product_menu_table_name = state.vars.product_menu_table_name;
    if(state.vars.multiple_input_menus){ //needs some serious cleanup here - this is messy
        if(input == 44 &&  state.vars.input_menu_loc > 0){
            state.vars.input_menu_loc = state.vars.input_menu_loc - 1;
            var menu = JSON.parse(state.vars.input_menu)[state.vars.input_menu_loc];
            state.vars.current_menu_str = menu;
            sayText(menu);
            promptDigits('enr_input_splash', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(input == 77 && (state.vars.input_menu_loc < state.vars.input_menu_length - 1)){
            state.vars.input_menu_loc = state.vars.input_menu_loc + 1;
            var menu = JSON.parse(state.vars.input_menu)[state.vars.input_menu_loc]
            state.vars.current_menu_str = menu;
            sayText(menu);
            promptDigits('enr_input_splash', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
        else if(input == 44 && state.vars.input_menu_loc == 0){
            var splash_menu = populate_menu('enr_splash', lang, 300);
            var menu = msgs('enr_splash', {'$ENR_SPLASH' : splash_menu}, lang);
            state.vars.current_menu_str = menu;
            sayText(menu);
            promptDigits('enr_splash', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});
        }
        else{
            var selection = get_menu_option(input, product_menu_table_name);
            if(selection == null){
                sayText(msgs('enr_invalid_product_selection', {}, lang))
                promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
            }
            else{
                state.vars.current_product = selection;
                var get_product_options = require('./lib/enr-get-product-options')
                var product_deets = get_product_options(selection, product_menu_table_name);
                state.vars.product_deets = JSON.stringify(product_deets);
                var process_prod = require('./lib/enr-format-product-options');
                var prod_deets_for_msg = process_prod(product_deets, lang);
                var prod_message = msgs('enr_product_selected', prod_deets_for_msg, lang)
                state.vars.prod_message = prod_message;
                sayText(prod_message);
                promptDigits('enr_input_order', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
            }
        }
    }
    else{
        var selection = get_menu_option(input, product_menu_table_name);
        if(selection == null){
            sayText(msgs('enr_invalid_product_selection', {}, lang))
            promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length})
        }
        else{
            state.vars.current_product = selection;
            var get_product_options = require('./lib/enr-get-product-options')
            var product_deets = get_product_options(selection, product_menu_table_name);
            state.vars.product_deets = JSON.stringify(product_deets);
            var process_prod = require('./lib/enr-format-product-options');
            var prod_deets_for_msg = process_prod(product_deets, lang);
            var prod_message = msgs('enr_product_selected', prod_deets_for_msg, lang)
            state.vars.prod_message = prod_message;
            sayText(prod_message);
            promptDigits('enr_input_order', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
        }
    }
    get_time();
});


addInputHandler('enr_input_order', function(input){ //input ordering function
    state.vars.current_step = 'enr_input_order';
    state.vars.current_menu_str = state.vars.prod_message;
    input = parseFloat(input.replace(/[^0-9,.,,]/g,'').replace(/,/g,'.'));
    var product_deets = JSON.parse(state.vars.product_deets);
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    if(input < product_deets.min || input > product_deets.max){
        sayText(msgs('enr_input_out_of_bounds', {}, lang)); //this shoud include 1 to continue 99 to quite
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length})
    }
    else if(input % product_deets.increment === 0){
        var format_order_message = require('./lib/enr-format-input-message');
        state.vars.current_input_quantity = input;
        var input_confirm_opts = format_order_message(input, product_deets, lang);
        var input_confirm_msg = msgs('enr_confirm_input_order', input_confirm_opts, lang);
        state.vars.current_menu_str = input_confirm_msg;
        sayText(input_confirm_msg);
        promptDigits('enr_confirm_input_order', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length})
    }
    else if(input % product_deets.increment !== 0){
        sayText(msgs('enr_bad_input_increment', {}, lang));
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length})
    }
    else{
        sayText(msgs('invalid_input', {}, lang));
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length})
    }
    get_time();
});


addInputHandler('enr_confirm_input_order', function(input){ //input ordering confirmation
    state.vars.current_step = 'enr_confirm_input_order'
    input = parseInt(input.replace(/\D/g,''));
    if(input === 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else if(input === 44){
        if(state.vars.multiple_input_menus){
            var menu = JSON.parse(state.vars.input_menu)[0];
        }
        else{
            var menu = state.vars.input_menu;
        }
        state.vars.current_menu_str = menu;
        sayText(menu)
        promptDigits('enr_input_splash', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length})
    }
    else if(input === 1){
        var log_input_order = require('./lib/enr-log-input-order');
        var product_deets = JSON.parse(state.vars.product_deets)
        console.log('product deets : ' + JSON.stringify(product_deets));
        var input_name = product_deets.input_name;
        log_input_order(state.vars.session_account_number, an_pool, input_name, state.vars.current_input_quantity)
        sayText(msgs('enr_input_order_success', {'$NAME' : product_deets[lang]}, lang));
        promptDigits('enr_input_order_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});
    }
    else{
        sayText(msgs('invalid_input', {}, lang));
        promptDigits('invalid_input', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length})
    }
    get_time();
});

addInputHandler('enr_input_order_continue', function(input){
    state.vars.current_step = 'input_order_continue';
    input = parseInt(input.replace(/\D/g,''));
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else{
        if(state.vars.multiple_input_menus){
            var menu = JSON.parse(state.vars.input_menu)[0];
        }
        else{
            var menu = state.vars.input_menu;
        }
        state.vars.current_menu_str = menu;
        sayText(menu)
        promptDigits('enr_input_splash', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length})
    }
    get_time();
});
//end input order handlers



/*
input handlers for order review
*/

addInputHandler('enr_order_review_continue', function(input){
    state.vars.current_step = 'enr_order_review_continue';
    input = parseInt(input.replace(/\D/g,''));
    if(input == 99){
        sayText(msgs('exit', {}, lang));
        stopRules();
        return null;
    }
    else if(state.vars.review_frame_loc < state.vars.review_frame_length - 1){ //watch for off by 1 errors
        state.vars.review_frame_loc = state.vars.review_frame_loc + 1;
        var input_review_menu = JSON.parse(state.vars.review_menu);
        state.vars.current_review_str = input_review_menu[state.vars.review_frame_loc];
        sayText(state.vars.current_review_str);
        promptDigits('enr_order_review_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
    }
    else{
        promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input,'timeout' : timeout_length});
    }
    get_time();
});
//end order review

/*
input handlers for finalize order
*/
addInputHandler('enr_finalize_verify', function(input){
    state.vars.current_step = 'enr_finalize_verify';
    input = parseInt(input.replace(/\D/g, ''));
    if(input == 1){
        sayText(msgs('enr_finalized', {}, lang));
        var client = get_client(state.vars.session_account_number, an_pool)
        client.vars.finalized = 1;
        client.save(); 
    }
    else{
        sayText(msgs('enr_not_finalized', {}, lang));
    }
    promptDigits('cor_continue', {'submitOnHash' : false, 'maxDigits' : max_digits_for_input, 'timeout' : timeout_length});
    get_time();
});

//end finalize order

