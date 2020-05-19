/*
    Script: ext-reinitization.js
    Description: if same service called by same user within 15 minutes, put them back at their last survey question
    Status: complete
*/

module.exports = function(){
    // load relevant tables
    var session_table = project.getOrCreateDataTable('Extension Survey');
    var session_cursor = session_table.queryRows({
        from_number : contact.phone_number, 
        vars        : { 'villageid' : state.vars.vid,
                        'ext_main_splash' : call.vars.ext_main_splash,
                        'completed' : {exists : 0},
                        'status' : {exists : 1}},
        sort_dir    : 'desc'
    });
    // if previous session was called by same user within previous 60 minutes, run reinitization process
    if(session_cursor.hasNext() & !state.vars.test){
        var row = session_cursor.next();
        var diff = (state.time_updated - row.time_updated) / 60;
        var status = row.vars.status;
        if(diff < 60){
            console.log('reinitizing...');
            // copy data entries from previous session row into current session row
            call.vars.fp_age = row.vars.fp_age || row.vars.fp_age_tra;
            call.vars.fp_gender = row.vars.fp_gender || row.vars.fp_gender_tra;
            call.vars.fp_tenure = row.vars.fp_tenure || row.vars.fp_tenure_tra;
            call.vars.fp_trained = row.vars.fp_trained;
            call.vars.crop = row.vars.crop;
            call.vars.fp_tr_num = row.vars.fp_tr_num;
            call.vars.num_farmers = row.vars.num_farmers;
            call.vars.num_females = row.vars.num_females;
            call.vars.num_females_crop = row.vars.num_females_crop;
            call.vars.num_groups = row.vars.num_groups;
            call.vars.num_males = row.vars.num_males;
            call.vars.num_males_crop = row.vars.num_males_crop;
            call.vars.num_plots = row.vars.num_plots;
            call.vars.survey_id = String(row.vars.survey_id);
            call.vars.villageid = row.vars.villageid;
            call.vars.demo_question = row.vars.demo_question;
            call.vars.crop_demo_question = row.vars.crop_demo_question;
            call.vars.Q1 = row.vars.Q1;
            call.vars.Q2 = row.vars.Q2;
            call.vars.Q3 = row.vars.Q3;
            call.vars.Q4 = row.vars.Q4;
            call.vars.Q5 = row.vars.Q5;
            call.vars.Q6 = row.vars.Q6;
            call.vars.Q7 = row.vars.Q7;
            call.vars.Q8 = row.vars.Q8;
            call.vars.Q9 = row.vars.Q9;
            call.vars.Q10 = row.vars.Q10; 
            call.vars.num_correct = parseInt(row.vars.num_correct);
            state.vars.num_correct = parseInt(row.vars.num_correct);
            if(!state.vars.num_correct){
                state.vars.num_correct = 0;
            }
            state.vars.crop = call.vars.crop;
            call.vars.status = status;
            // mark previous session as reinitized
            row.vars.completed = 'reinit';
            row.save();

            // find where we are
            if(row.vars.Q1){
                // update various tracker variables and ask the next question
                console.log('')
                state.vars.question_number = parseInt(status.slice(1)) + 1;
                state.vars.question_id = state.vars.crop + 'Q' + state.vars.question_number;
                console.log('Question number: ' + state.vars.question_number + ', question id: ' + state.vars.question_id);
                var ask = require('./ext-ask-question');
                ask();
                return true;
            }
            else if(call.vars.crop_demo_question || call.vars.demo_question){
                var msgs = require('./msg-retrieve');
                const timeout_length = project.vars.timeout_length;
                const lang = project.vars.lang;
                // update various tracker variables and ask the current question
                if(call.vars.crop_demo_question){
                    var prompt_name = 'crop_demo_question';
                }
                else{
                    var prompt_name = 'demo_question';
                }
                state.vars.survey_type = status.replace(/[^a-z_]/ig,'');
                state.vars.step = parseInt(status.replace(/\D/g,'')) || 1;
                // retrieve the relevant crop demo question
                var demo_table = project.getOrCreateDataTable('demo_table');
                var prev_question = demo_table.queryRows({'vars' : {'question_id' : status}}).next();
                sayText(msgs(prev_question.vars.msg_name, {}, lang));
                promptDigits(prompt_name, {     'submitOnHash' : false, 
                                                    'maxDigits'    : prev_question.vars.max_digits,
                                                    'timeout'      : timeout_length});
                return true;
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
    }
    else{
        return false;
    }
}