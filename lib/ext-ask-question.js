/*
    Script: ext-ask-question.js
    Description: displays survey question and prompts user to select a response
    Status: complete
*/

module.exports = function(feedback){
    // feedback defaults to blank if not provided (e.g. for first survey question)
    feedback = feedback || '';

    // load modules and variables, and save the current question row
    var msgs = require('./msg-retrieve');
    const lang = project.vars.cor_lang;
    var survey_table = project.getOrCreateDataTable('SurveyQuestions');
    state.vars.question_id = state.vars.crop + 'Q' + state.vars.question_number;
    var question = survey_table.queryRows({'vars' : {'questionid' : state.vars.question_id}}).next();
    console.log('1 q is ' + state.vars.question_number + ' id is ' + state.vars.question_id);
    // accounting for survey questions with fewer options
    var num_opts = question.vars.numoptions;
    var opt3 = '';
    var opt4 = '';
    if(num_opts > 2){
        opt3 = '3) ' + question.vars.opt3;
        if(num_opts > 3){
            opt4 = '4) ' + question.vars.opt4;
        }
    }
    console.log('2 q is ' + state.vars.question_number + ' id is ' + state.vars.question_id);
    // display text and prompt user to select their choice
    sayText(msgs('survey_question',    {'$FEEDBACK' : feedback,
                                            '$TEXT' : question.vars.questiontext,
                                            '$OPT1' : '1) ' + question.vars.opt1, 
                                            '$OPT2' : '2) ' + question.vars.opt2,
                                            '$OPT3' : opt3,
                                            '$OPT4' : opt4}, lang));
    console.log('3 q is ' + state.vars.question_number + ' id is ' + state.vars.question_id);
    promptDigits('survey_response', {   'submitOnHash' : false, 
                                        'maxDigits'    : project.vars.max_digits_for_input,
                                        'timeout'      : project.vars.timeout_length});
    return true;
}