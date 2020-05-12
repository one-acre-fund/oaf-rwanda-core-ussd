/*
module for checking the entered id to the datatable and return a message showing the district, site and group name
*/

/*
01646000404480
016460004-4880
01646-004-4880
01646-00404880


0164602302345 // both siteId and groupId +ve
01646*02302345 // siteId -ve groupId +ve
01646023*02345 // siteId +ve groupId -ve
01646*023*02345// both siteId and groupId -ve
*/

function parse_gid(gid) {

    var districtId = parseInt(gid.slice(0,5),10);
    var siteId, groupId;
    var group_code = gid.replace(/\W/g, '-');
    if(group_code[5] == '-'){ //siteId is negative
        siteId = parseInt(group_code.slice(5,9), 10);
        if(group_code[9] == '-'){ //groupId is negative
            groupId = parseInt(group_code.slice(9,group_code.length), 10);
        }else{
            groupId = parseInt(group_code.slice(8,group_code.length), 10);
        }
        
    }else{
        siteId = parseInt(group_code.slice(5,8), 10);
        if(group_code[9] == '-'){ //groupId is negative
            groupId = parseInt(group_code.slice(9,group_code.length), 10);
        }else{
            groupId = parseInt(group_code.slice(8,group_code.length), 10);
        }
    }

    return {
        districtId:districtId,
        siteId:siteId ,
        groupId: groupId
    }
}

module.exports = function(gid, table_name,lang){
    console.log('group Id'+gid);
    var data_table = project.getOrCreateDataTable(table_name);
    var parsed_gid = parse_gid(gid);
    var districtId = parsed_gid.districtId;
    var siteId = parsed_gid.siteId;
    var groupId = parsed_gid.groupId;
    var id = districtId + '-' + siteId + '-'+ groupId;
    var districtName = '';
    var siteName = '';
    var groupName = '';

    state.vars.glus = gid;
    state.vars.districtId = districtId;
    state.vars.siteId = siteId;
    state.vars.groupId = groupId;
    console.log('district'+ districtId +'siteId'+siteId+'groupId'+groupId);

    var cursor = data_table.queryRows({'vars' : {'group_code' : gid}})
    if(id === null){
        throw 'ERROR: null group code';
    }
    else if(cursor.hasNext()){

        var row = cursor.next();
        districtName = row.vars.district;
        siteName = row.vars.site;
        groupName = row.vars.group;
        state.vars.districtName = districtName;
        var msgs = require('./msg-retrieve');
        console.log('district', districtName+'siteId'+siteName+'groupId'+groupName);
        return msgs('enr_group_id_info',{'$DISTRICT' : districtName, '$SITE': siteName, '$GROUP': groupName},lang);
    }
    else{
        return null;
    }
};