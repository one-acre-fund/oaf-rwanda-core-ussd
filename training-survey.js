var geo_select = require('./lib/cta-geo-select');
var geo_process = require('./lib/cta-geo-string-processer');
var geo_data = require('./dat/rwanda-training-geography');
var msgs = require('./lib/msg-retrieve');
var reinit = require('./lib/training-reinitialization');



const lang = project.vars.trainings_language;
const max_digits = project.vars.max_digits;
const timeout_length = project.vars.timeout_length;


 global.main = function () {
    reinit();


    var getmenu = require('./lib/training-populate-menu');
    var surveys_obj= getmenu('Surveys',lang);
    console.log("*****************"+ surveys_obj);
    if(surveys_obj != null){
       
        if (typeof (surveys_obj) == 'string') {
            state.vars.current_menu_str = surveys_obj;
            menu  = surveys_obj
            //sayText(surveys_obj);
            state.vars.multiple_input_menus = 0;
            state.vars.input_menu = menu;
            //promptDigits('cor_menu_select', { 'submitOnHash': false, 'maxDigits': max_digits_for_input, 'timeout': 180 });
        }
        else if (typeof (surveys_obj) == 'object') {
            state.vars.input_menu_loc = 0; //watch for off by 1 errors - consider moving this to start at 1
            state.vars.multiple_input_menus = 1;
            state.vars.input_menu_length = Object.keys(surveys_obj).length; //this will be 1 greater than max possible loc
            state.vars.current_menu_str = surveys_obj[state.vars.input_menu_loc];
            //sayText(surveys_obj[state.vars.input_menu_loc]);
            menu = surveys_obj[state.vars.input_menu_loc];
            state.vars.input_menu = JSON.stringify(surveys_obj);
            //promptDigits('cor_menu_select', { 'submitOnHash': false, 'maxDigits': max_digits_for_input, 'timeout': 180 });
        }
        sayText(msgs('train_type_splash', {'$Type_MENU' : menu},lang));
        promptDigits('surveyType_selection', { 'submitOnHash' : false,
        'maxDigits'    : max_digits,
        'timeout'      : 180 });

    }
    else{
        sayText(msgs('no_quiz_menu',{},lang));
    }

};


addInputHandler('surveyType_selection',function(input){

    state.vars.current_step = 'surveyType_selection';
    input = parseInt(input.replace(/\D/g,''));
    var survey_type;
    var number_of_questions;
    var survey_table = project.getOrCreateDataTable('Surveys');
    var survey_cursor = survey_table.queryRows({
        vars        : { 'option_number': input},
        sort_dir    : 'desc'
    });
    
    if (state.vars.multiple_input_menus) {
        if (input == 44 && state.vars.input_menu_loc > 0) {
            state.vars.input_menu_loc = state.vars.input_menu_loc - 1;
            var menu = JSON.parse(state.vars.input_menu)[state.vars.input_menu_loc];
            state.vars.current_menu_str = menu;
            sayText(menu);
            promptDigits('surveyType_selection', { 'submitOnHash': false, 'maxDigits': max_digits_for_input, 'timeout': timeout_length });
            return null;
        }
        else if (input == 77 && (state.vars.input_menu_loc < state.vars.input_menu_length - 1)) {
            state.vars.input_menu_loc = state.vars.input_menu_loc + 1;
            var menu = JSON.parse(state.vars.input_menu)[state.vars.input_menu_loc]
            state.vars.current_menu_str = menu;
            sayText(menu);
            promptDigits('surveyType_selection', { 'submitOnHash': false, 'maxDigits': max_digits_for_input, 'timeout': timeout_length });
            return null;
        }
        else if (input == 44 && state.vars.input_menu_loc == 0) {
            sayText(msgs('invalid_input', {}, lang));
            promptDigits('invalid_input', { 'submitOnHash': false, 'maxDigits': max_digits_for_input, 'timeout': timeout_length });
            return null;
        }
    }

    if(survey_cursor.hasNext()){
        var row = survey_cursor.next();
        survey_type = row.vars.survey_code;
        number_of_questions = row.vars.number_of_questions;
        call.vars.survey_code = survey_type;
        call.vars.number_of_questions = number_of_questions;
       
        var geo_list = geo_process(geo_data);
        state.vars.current_menu = JSON.stringify(geo_list);
        sayText(msgs('training_province_splash', geo_list,lang));
        promptDigits('province_selection', { 'submitOnHash' : false,
                                            'maxDigits'    : max_digits,
                                            'timeout'      : timeout_length });
                                        }
    else if (input === 99){ // exit
        sayText(msgs('training_exit_message',{},lang));
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('training_invalid_input',{},lang));
        sayText(msgs('train_type_splash', {'$Type_MENU' : state.vars.current_menu},lang));
        promptDigits('surveyType_selection', { 'submitOnHash' : false,
                                                'maxDigits'    : max_digits,
                                                'timeout'      : timeout_length });
    }
                                    

});

addInputHandler('province_selection', function(input){
    state.vars.current_step = 'geo_selection_1';
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var keys = Object.keys(geo_data);
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        state.vars.region = selection;
        state.vars.region_name = keys[selection];
        call.vars.region = state.vars.region_name;
        geo_data = geo_select(selection, geo_data)
        var selection_menu = geo_process(geo_data);
        state.vars.current_menu = JSON.stringify(selection_menu);
        sayText(msgs('training_district_splash', selection_menu,lang));
        promptDigits('district_selection', {'submitOnHash' : false, 'maxDigits' : max_digits,'timeout' : timeout_length});
    }
    else if (input === 99){ // exit
        sayText(msgs('training_exit_message',{},lang));
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('training_invalid_input',{},lang));
        sayText(msgs('training_province_splash', JSON.parse(state.vars.current_menu),lang));
        promptDigits('province_selection', {'submitOnHash' : false, 'maxDigits' : max_digits,'timeout' : timeout_length});
    }
});
// input handler for district selection
addInputHandler('district_selection', function(input){
    state.vars.current_step = 'geo_selection_2';
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var region = parseInt(state.vars.region);
    geo_data = geo_select(region, geo_data);
    var keys = Object.keys(geo_data);
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        state.vars.district = selection;
        state.vars.district_name = keys[selection];
        call.vars.district = state.vars.district_name;

        geo_data = geo_select(selection, geo_data)
        var selection_menu = geo_process(geo_data);
        state.vars.current_menu = JSON.stringify(selection_menu);
        sayText(msgs('training_sector_splash', selection_menu,lang));
        promptDigits('sector_selection', {'submitOnHash' : false, 'maxDigits' : max_digits,'timeout' : timeout_length});
    }
    else if (input == 99){ // exit
        sayText(msgs('training_exit_message',{},lang));
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('training_invalid_input',{},lang));
        sayText(msgs('training_district_splash', JSON.parse(state.vars.current_menu),lang));
        promptDigits('district_selection', {'submitOnHash' : false, 'maxDigits' : max_digits,'timeout' : timeout_length});
    }
});

// input handler for sector selection
addInputHandler('sector_selection', function(input){
    state.vars.current_step = 'geo_selection_3';
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var region = parseInt(state.vars.region);
    geo_data = geo_select(region, geo_data);
    var district = parseInt(state.vars.district);
    geo_data = geo_select(district, geo_data);
    var keys = Object.keys(geo_data);
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        state.vars.sector = selection;
        state.vars.sector_name = keys[selection];
        call.vars.sector = state.vars.sector_name;

        geo_data = geo_select(selection, geo_data)
        var selection_menu = geo_process(geo_data);
        state.vars.current_menu = JSON.stringify(selection_menu);
        sayText(msgs('training_site_splash', selection_menu,lang));
        promptDigits('site_selection', {'submitOnHash' : false, 'maxDigits' : max_digits,'timeout' : timeout_length});
    }
    else if (input == 99){ // exit
        sayText(msgs('training_exit_message',{},lang));
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('training_invalid_input',{},lang));
        sayText(msgs('training_sector_splash', JSON.parse(state.vars.current_menu),lang));
        promptDigits('sector_selection', {'submitOnHash' : false, 'maxDigits' : max_digits,'timeout' : timeout_length});
    }
});
addInputHandler('site_selection', function(input){
    state.vars.current_step = 'geo_selection_4';
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var region = parseInt(state.vars.region);
    geo_data = geo_select(region, geo_data);
    var district = parseInt(state.vars.district);
    geo_data = geo_select(district, geo_data);
    var sector = parseInt(state.vars.sector);
    geo_data = geo_select(sector, geo_data);

    var keys = Object.keys(geo_data);
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        state.vars.site = selection;
        state.vars.site_name = keys[selection];
        call.vars.site = state.vars.site_name;

        state.vars.survey_type = call.vars.survey_code;
        state.vars.step = 1;
        state.vars.num_correct = 0;
        // ask first quiz question
        var ask = require('./lib/training-ask-question');
        ask();
    }
    else if (input == 99){ // exit
        sayText(msgs('exit')); // need to add this to the list
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('training_invalid_input',{},lang));
        sayText(msgs('training_site_splash', JSON.parse(state.vars.current_menu),lang));
        promptDigits('site_selection', {'submitOnHash' : false, 'maxDigits' : max_digits,'timeout' : timeout_length});
    }
});

// input handler for survey questions
addInputHandler('quiz_question', function(input){
    // test and store input response
    input = parseInt(input.replace(/\s/g,''));
    if (input === 99){ // exit
        sayText(msgs('training_exit_message',{},lang));
        stopRules();
    }
    call.vars.status = state.vars.survey_type + state.vars.step;
    var question = 'opt'+ String(state.vars.step);
    call.vars[question] = input;
    var survey_length = call.vars.number_of_questions ; 

    // verify response and retrieve relevant feedback string
    var verify = require('./lib/training-answer-verify');
    var feedback = verify(input);
    state.vars.step += 1;

    // ask next question or display score if complete
    if(state.vars.step <= survey_length){
        var ask = require('./lib/training-ask-question');
        ask(feedback);
        return null;
    }
    else{
    
        var saving = require('./lib/training-save-version-number');
        saving(); // save the number of time an individual responded to the survey
        call.vars.status = 'complete';
        sayText(msgs('training_closing_message', {   '$FEEDBACK'    : feedback,
                                            '$NUM_CORRECT' : state.vars.num_correct}, lang));
        return null;
    }
});