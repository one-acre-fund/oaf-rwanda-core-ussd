/*
module to check prepayment in certain rgo sites
*/

module.exports = function(account_number, prepayment_amount){
    var client = null;
    var api = require('ext/Roster_v1_2_0/api'); //roster. occasiontally will need updates
    api.dataTableAttach('ExternalApis');
    var country = project.vars.country; //todo: make more general
    api.verbose = true;
    api.dataTableAttach('ExternalApis'); 
    try{
        client_auth = api.authClient(account_number, country);
        if(client_auth){
            var client = api.getClient(account_number);
            var paid = 0;
            var array_length = client.BalanceHistory.length;
            var overpayment = 0;
            for (var i = 0; i < array_length; i++){
                if (client.BalanceHistory[i].Balance > 0){    
                    paid = client.BalanceHistory[i].TotalCredit-client.BalanceHistory[i].Balance;
                }
                if(client.BalanceHistory[i].Balance < 0){
                    overpayment = overpayment + client.BalanceHistory[i].Balance;
                }
            }
            var total = paid + Math.abs(overpayment);
            console.log('paid: ' + paid)
            console.log('overpayment: ' + overpayment)
            console.log('total: ' + total)
            if(total < prepayment_amount){
                return false;
            }
            else{
                return true;
            }
        }
        else{
            return false;
        }
    }
    catch(error){
        console.log('error : ' + error);
        admin_alert = require('./admin-alert')
        admin_alert('API failure on account number ' + account_number + '\nError : ' + error + '\n' + JSON.stringify(client));
        return false;
    }
};
