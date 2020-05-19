/*
    Function: registration_check.js
    Purpose: allows a client to register their SHS product
    Status: complete
*/

module.exports = function(accnum){
    // load relevant functions and data tables
    var admin_alert = require('./admin-alert');
    var table = project.getOrCreateDataTable("SerialNumberTable");
    state.vars.duplicate = false; 

    // retrieve rows where account number in table corresponds to input account number
    ListRows = table.queryRows({
        vars: {'accountnumber': accnum} 
    });

    // get unlock code if client has paid up; else get the latest activation code
    console.log("ListRows count is " + ListRows.count());
    if(ListRows.count() === 1){
        var Serial = ListRows.next();
        state.vars.serial_no = Serial.vars.serialnumber;
        var Activationtable = project.getOrCreateDataTable("ActivationCodes");

        // if the serial number is unlocked, retrieve the the relevant activation code
        if (Serial.vars.unlock == "Yes"){
            state.vars.unlock = true;
            ActList = Activationtable.queryRows({
                vars: {
                    'activated': "Yes",
                    'unlock': "Yes",
                    'serialnumber': state.vars.serial_no
                },
            });
            
            // if the serial number is in the table, retrieve the corresponding activation code; else send alert to admin
            if(ActList.count() >= 1){
                var Act = ActList.next();
                state.vars.ActCode = Act.vars.code;
                return true;
            }
            else{
                admin_alert('No rows in ActTable for serial no: ' + state.vars.serial_no, 'Missing Serial Number in ActivationCodes', 'marisa');
                return false;
            }
        }
        else{
            console.log('About to get the latest activation code');
        // Get latest activation code
            state.vars.unlock = false;
            var Activationtable = project.getOrCreateDataTable("ActivationCodes");
            ActList = Activationtable.queryRows({
                vars: {
                    'activated': "Yes",
                    'serialnumber': state.vars.serial_no
                },
            });
            // save the client's number of codes used
            Serial.vars.numbercodes = ActList.count();
            Serial.save();
            
            // 
            var LatestDateActivated = "";
            while(ActList.hasNext()){
                var Act = ActList.next();
                var current_date = new Date(Act.vars.dateactivated);
                if(current_date > LatestDateActivated){
                    LatestDateActivated = current_date;
                    state.vars.ActCode = Act.vars.code;
                }
            }
            return true;
        }
    }
    // if there are multiple serial numbers assigned to the same account, the client may have multiple products
    else if(ListRows.count() > 1){
        state.vars.duplicate = true;
        return false;
    }
    else{
        console.log("Client has not yet registered.")
        return false;
    }
}