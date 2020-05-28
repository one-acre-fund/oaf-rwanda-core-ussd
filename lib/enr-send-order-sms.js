/*
module to send an sms of the client's order. code borrowed from enr-gen-order-review.js 
*/

// load in different modules
var account_verify = require('./account-verify');
// save options for calculating prepayment
const repayment_calc_options = {
    'default'           : core_prepayment_calc
};
repayment_calc_options[service.vars.input21ATable] = rgo_prepayment_calc;

// calculate prepayment based on Ruhango rules
function rgo_prepayment_calc(client, input_menu_name){
    // assign clients to a prepayment calculation option, with default as non-20a
    state.vars.prev_client = false;
    var new_client = client.vars.new_client;
    // clients use the prev_client calc if their last season credit is positive and they didn't overpay
    if(new_client == null || new_client == undefined){
        account_verify(client.vars.account_number);
        var client_object = JSON.parse(state.vars.client_json);
        const arrayLength = client_object.BalanceHistory.length;
        // calculate balance and credit for returning clients
        if(arrayLength > 1){
            const index = arrayLength - 1;
            var balance = client_object.BalanceHistory[index].Balance;
            var credit = client_object.BalanceHistory[index].TotalCredit;
            if(credit > 0){
                state.vars.prev_client = true;
            }
        }
    }
    if(state.vars.prev_client){ // returning client remainder: 60% of 20A total credit eligibility
        const req_perc = 0.6;
        var perc_repaid = (credit - balance) / credit;
        var remainder = (req_perc - perc_repaid) * credit;
        if(remainder < 0){
            remainder = 0;
        }
        return remainder;
    }
    else{ // prepayment: 30% of 20B tx size
        var input_table = project.getOrCreateDataTable(input_menu_name);
        var percent = .3; 
        var products = input_table.countRowsByValue('bundle_name');
        var price = 0;
        for(prod in products){
            var prod_row = input_table.queryRows({'vars' : {'bundle_name' : prod}}).next();
            if(parseFloat(client.vars[prod_row.vars.bundle_name]) > 0){
                if(prod == 'shs_20a'){
                    price += 18625; //using this because our prices arent consistent!!
                }
                else if(prod == 'maize'){ // for ruhango only; don't know maize variety generally
                    price += 1000;
                }
                else{
                    price += parseFloat(client.vars[prod_row.vars.bundle_name]) * parseFloat(prod_row.vars.price);
                }
            }
        }
        console.log('Left the product for loop');
        var prepayment = price * percent;
        return prepayment;
    }
}

function core_prepayment_calc(client_row, input_menu_name){
    console.log('trying core prep calc on : ' + client_row + ' ' + input_menu_name);
    throw 'Passing on prepayment for the moment here';
}

module.exports = function(account_number, input_menu_name, an_table, lang, max_chars){ //here there be tygers
    var get_client = require('./enr-retrieve-client-row');
    var client = get_client(account_number, an_table);
    max_chars = max_chars || 130;
    var input_table = project.getOrCreateDataTable(input_menu_name);
    var products = input_table.countRowsByValue('bundle_name');
    var msgs = require('./msg-retrieve');
    var pre_str = ''
    try{
        var prepayment = repayment_calc_options[input_menu_name](client, input_menu_name);
        if(state.vars.prev_client){
            pre_str = msgs('enr_repayment_alert', {'$REMAINDER' : prepayment}, lang) || ' ';
        }
        else{
            pre_str = msgs('enr_prepayment', {'$PREP' : prepayment}, lang) || ' ';
        }
    }
    catch(err){
        console.log(err);
        pre_str = '';
    }
    var outstr = ' ';
    var totalPrice = 0;
    var currentPrice = 0;
    for(prod in products){
        var prod_row = input_table.queryRows({'vars' : {'bundle_name' : prod}}).next();
        var bundle_name = prod_row.vars['bundle_name'].replace(/ /g,"_");
        if(parseFloat(client.vars[bundle_name]) > 0){
            currentPrice = parseFloat(client.vars[bundle_name])*parseFloat(prod_row.vars.price);
            totalPrice = totalPrice + currentPrice;
            tempstr = prod_row.vars[lang]+':'+client.vars[bundle_name]+' ' +prod_row.vars.unit+' - '+(parseFloat(client.vars[bundle_name])*parseFloat(prod_row.vars.price))+'RWF';
            outstr = outstr + '\n' + tempstr;
        }
    }

        var msgs = require('./msg-retrieve');
        var msg = msgs('ENR-SMS-ORDER-FINALIZE',{'$TotalPrice' : totalPrice, '$OrderDetails': outstr}, lang);
        var msg_route = project.vars.sms_push_route;
        project.sendMessage({ 'to_number': client.vars.pn, 'route_id': msg_route, 'content': msg });

    

};
