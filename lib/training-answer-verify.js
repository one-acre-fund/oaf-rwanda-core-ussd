/*
    Script: training-answer-verify.js
    Description: check if selected response is correct or not and return a feedback string
    Status: in progress
*/

module.exports = function(response){
    // load in relevant tables
    var survey_table = project.getOrCreateDataTable('training_questions');
    var survey_row = survey_table.queryRows({'vars' : {'question_type' : state.vars.survey_type + state.vars.step}}).next();
    var correct_answer = survey_row.vars.correct_opt_text;
    var correct_opt = parseInt(survey_row.vars.correct_opt_num);
    var num_options = parseInt(survey_row.vars.num_options);

    var msgs = require('./msg-retrieve');
    const lang = project.vars.trainings_language;
    // provide feedback if the response is correct or not
    if(response === correct_opt){
        state.vars.num_correct = state.vars.num_correct + 1;
        call.vars.num_correct = state.vars.num_correct;
    } 
  
    else if(response < num_options){
        var feedback = msgs('wrong_answer_feedback',{'$ANS':correct_answer},lang);
    }
    else{
        var feedback = msgs('answer_feedback',{'$ANS':correct_answer},lang);
    }
    
    // save the session data and return the feedback
    return feedback;
}