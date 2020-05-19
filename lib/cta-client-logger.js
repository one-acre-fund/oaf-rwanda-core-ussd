/*
data logger for external cta module
logs a data for each interaction
1 unique row per phone number - as much data as possible per interaction will be recorded
*/

module.exports = function(phone_number, data){
    var data_table = project.getOrCreateDataTable('cta_data'); // need to update this to attach a data table. maybe make this an object??
    var cursor = data_table.queryRows({'vars' : {'phone_number' : phone_number}});
    if(cursor.hasNext()){ //maybe want to create a unique data row per interaction?? not sure
        client_row = cursor.next();
        if('province' in data){
            client_row.vars.interaction_count = parseInt(client_row.vars.interaction_count) + 1;
        }
    }
    else{
        client_row = data_table.createRow({'vars' : {'phone_number' : phone_number, 'interaction_count' : 1}}); //better if we create a row for every interaction, but increment based on the number of previous interactions
    }
    for(var key in data){
        client_row.vars[key] = data[key];
    }
    client_row.save();
};
