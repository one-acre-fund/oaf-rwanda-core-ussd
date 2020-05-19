/*
    Script: ext-survey-start.js
    Description: begins the survey, starting with demographic questions
    Status: complete
*/

module.exports = function(){
    // load in modules and set constants
    var populate_menu = require('./populate-menu');
    var msgs = require('./msg-retrieve');
    const timeout_length = project.vars.timeout_length;
    const lang = project.vars.cor_lang;

    // update session row
    call.vars.status = 'survey_start';
    
    // if mon, go to crop demo questions first; if tra, go straight to survey response
    var next_step = 'survey_response';
    if(state.vars.survey_type === 'mon'){
        var next_step = 'crop_demo_question';
    }
    console.log('next step is ' + next_step);

    // initialize counter variables
    state.vars.question_number = 1;
    state.vars.num_correct = 0;
    state.vars.survey_type = 'crop';
    state.vars.step = 1;
                            
    // display crop survey menu
    sayText(msgs('survey_start', {}, lang));
    var menu = populate_menu('crop_menu', lang);
    sayText(menu, lang);
    promptDigits(next_step, {   'submitOnHash' : false, 
                                        'maxDigits'    : project.vars.max_digits_for_input,
                                        'timeout'      : timeout_length});
}
