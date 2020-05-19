/*
    script: enr-name-group.js
    function: saves group name 
*/

module.exports = function(glus_id, glus_table_name, name){
    var glus_table = project.getOrCreateDataTable(glus_table_name);
    var group = glus_table.queryRows({vars : {'glus_id' : glus_id}}).next();
    group.vars.group_name = name;
    console.log('group vars from name group: ' + JSON.stringify(group.vars))
    group.save();
};
