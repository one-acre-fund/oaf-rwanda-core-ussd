

module.exports = function(survey_type){

    
    // load in relevant tables
    var session_table = project.getOrCreateDataTable('TestingSurvey');
    var number = contact.phone_number;
    var session_cursor = session_table.queryRows({
        from_number : contact.phone_number, 
         vars        : {
                         'status' : 'complete',
                         'survey_code': survey_type,
                         'phone_nbr': number
                        },
        sort_dir    : 'desc'
    });
    if(session_cursor.hasNext()){
       return true;
        }
    else{
        return false;

    }
}