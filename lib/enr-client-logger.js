/*
module for logging client data collected through the USSD enr system
*/

module.exports = function(nid, name1, name2, pn, glus, geo, an_table_name){
    var an_table = project.getOrCreateDataTable(an_table_name);
    var cursor = an_table.queryRows({'vars' : {'geo' : geo, 'registered' : {exists : 0}, 'nid' : {exists : 0}}});
    var client_row = null;
    var clientData = null;

    //Client Json data to send to roaster
    var clientJSON ={
        "districtId" : state.vars.districtId,
        "siteId":state.vars.siteId,
        "groupId":state.vars.groupId,
        "firstName":name1,
        "lastName":name2,
        "nationalIdNumber":nid,
        "phoneNumber":pn
    };
    //Getting client data from roster to retrieve account number
    var rosterRegister = require('./roster/register-client');
    try{
    clientData = JSON.parse(rosterRegister(clientJSON));
    console.log('client Data ****************'+clientData.AccountNumber);

    console.log('type of data:'+ typeof(clientData));
    // storing client account nuumber in a datatable
    }catch(e){
        console.log('error getting account from roster');
    }
    if(clientData != null){
        client_row = an_table.createRow({'vars' : {'account_number' : clientData.AccountNumber, 'via_api' : true}});

    // if(!cursor.hasNext()){
    //     if(geo == 'Giheke'){// stopgap measure for Giheke/Rusizi split. fix later!
    //         geo = 'Rusizi';
    //         client_row = an_table.queryRows({'vars' : {'geo' : geo, 'registered' : {exists : 0}, 'nid' : {exists : 0}}}).next();
    //     }
    //     else{ 
    //         admin_alert = require('./admin-alert');
    //         admin_alert('NO REMAINING ANs for location : ' + geo, 'TR: NO REMAING ANs');
    //         admin_alert('NO REMAINING ANs for location : ' + geo, 'TR: NO REMAING ANs', 'zach');
    //         admin_alert('NO REMAINING ANs for location : ' + geo, 'TR: NO REMAING ANs', 'theo');
    //         client_row = an_table.createRow({'from_number' : contact.phone_number, 'vars' : {'account_number' : 'TEMP'}});
    //     }
    // }
    // else{
    //     client_row = cursor.next();
    // }
    }

    // If no response from roster, notify admin and write temp in place of the account number
    else{
        //Notify admin :TODO
        client_row = an_table.createRow({'from_number' : contact.phone_number, 'vars' : {'account_number' : 'TEMP'}});
    }

    //save the rest of data in telerivet
    client_row.vars.nid = nid;
    client_row.vars.name1 = name1;
    client_row.vars.name2 = name2;
    client_row.vars.pn = pn;
    client_row.vars.glus = glus;
    client_row.vars.registered = 1;
    client_row.vars.user_pn = contact.phone_number;
    client_row.vars.new_client = 1;
    client_row.vars.geo = geo;
    console.log(JSON.stringify(client_row.vars))
    state.vars.account_number = client_row.vars.account_number;
    if(state.vars.account_number === null){
        throw 'ERROR: error in client logger'
    }
    client_row.save();
    return null; 
}
