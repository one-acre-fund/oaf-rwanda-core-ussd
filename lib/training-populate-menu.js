module.export = function(tableName,lang){

    console.log('*************************i am called*********************')
    var survey_table = project.getOrCreateDataTable(tableName);
        var survey_cursor = survey_table.queryRows({
        vars        : { 'status':"Active"},
        sort_dir    : 'desc'
    });

    var surveys_obj = '';
    while(survey_cursor.hasNext()){  
        try{
            var row = survey_cursor.next();
            var survey_type = row.vars.survey_type;
            var option_number = row.vars.option_number;
            surveys_obj = surveys_obj + String(option_number) + ")" + survey_type + '\n';
        }
        catch(error){
            console.log("error"+error);
            break;
        }
    }

    return surveys_obj;

}