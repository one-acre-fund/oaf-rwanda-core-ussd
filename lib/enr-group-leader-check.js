/*
    script: enr-group-leader-check.js
    function: saves client as GL if there isn't a GL already in the group
*/

module.exports = function(client, glus_id, an_table_name, glus_table_name){
    var an_table = project.getOrCreateDataTable(an_table_name);
    var glus_table = project.getOrCreateDataTable(glus_table_name);
    var group = glus_table.queryRows({vars : {'glus_id' : glus_id}}).next();
    var group_leader = an_table.queryRows({vars : {'glus' : glus_id, 'group_leader' : 1}})
    var client = an_table.queryRows({vars : {'account_number' : client}}).next(); //assumes that this client has been saved already
    state.vars.needs_name = false; 
    // assign client to be a group leader if there are no other group leaders in the group; otherwise, assign to be member
    if(group_leader.count() < 1){
        console.log('in gl check: vars: ' + JSON.stringify(client.vars) + '\ngl check count : ' + group_leader.count());
        client.vars.group_leader = 1;
        client.save();
        console.log('gl? (line18): ' + client.vars.group_leader);
        // if the group name is empty, needs_name is true
        group = glus_table.queryRows({vars : {'glus_id' : glus_id, 'group_name' : {exists : 1}}});
        if(group.count() < 1){
            state.vars.needs_name = true;
        }
        return true;
    }
    else{
        //client.vars.group_leader = 0;
        //client.save();
        return false;
    }
};
