function fetchRegistrationState(phoneNumber){
    var reg_sessions = project.getOrCreateDataTable('RegistrationSessions');
    var cursor = reg_sessions.queryRows({ 'vars': { 'phone_number': phoneNumber } });
    if(!cursor.hasNext()){
        return null
    }
    var row = cursor.next();
    const nowUnixTimeStamp = new Date().getTime() / 1000;
    const sessionTimeout = 60*60;
    return {
        sessionInfo: JSON.parse(row.vars.sessionInfo),
        isExpired: row.time_updated +sessionTimeout < nowUnixTimeStamp,
        remove:function () {
            row.delete();
        }
    }
}
/**
 * 
 * @param {string} phoneNumber 
 * @param {object} handlers 
 */
function resumeRegistration(phoneNumber,handlers) {
    var registrationState = fetchRegistrationState(phoneNumber);
    if(registrationState == null ){
        return false;
    }
    if( registrationState.isExpired){
        registrationState.remove()
        return false;
    }
    const state = registrationState.sessionInfo.state;
    for (const key in state) {
        if (state.hasOwnProperty(key)) {
            state.vars[key] = state[key];            
        }
    }
    // TODO: call handler with input
    const handler = registrationState.sessionInfo.handler;
    const input = registrationState.sessionInfo.input;
    if(handlers[handler]){
        handlers[handler](input);
        return true;
    }
    return false;
};

function clearRegistrationSession(phoneNumber){
    var reg_sessions = project.getOrCreateDataTable('RegistrationSessions');
    var cursor = reg_sessions.queryRows({ 'vars': { 'phone_number': phoneNumber } });
    if(!cursor.hasNext()){
        return 
    }
    var row = cursor.next();
    row.delete();
}

/**
 * 
 * @param {string} phoneNumber 
 * @param {object} state 
 * @param {string} handler 
 * @param {string} input 
 */
function saveRegistrationSession(phoneNumber, stateVars, handler, input) {
    const sessionInfo = {
        state:stateVars,
        handler:handler,
        input:input
    }
    var reg_sessions = project.getOrCreateDataTable('RegistrationSessions');
    var row = reg_sessions.initRowById(phoneNumber);
    row.vars.sessionInfo = JSON.stringify(sessionInfo);
    row.vars.phone_number = phoneNumber
    row.vars.handler = handler;
    row.vars.input = input;
    row.save()
}
module.exports = {
    resume: resumeRegistration,
    clear: clearRegistrationSession,
    save: saveRegistrationSession
}