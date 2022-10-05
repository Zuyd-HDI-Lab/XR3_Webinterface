class Questionnaire{
    constructor(rawQuestionData, rawAnswerData, trial_results) {
        this.trial_results = trial_results;
        console.log(trial_results);
        //List of questions
        if (rawQuestionData == undefined || rawQuestionData.questions == undefined){
            this.questionObjects = undefined;
            this.answerObjects = undefined;
        }
        else {
            if (rawAnswerData == undefined){
                this.answerObjects = undefined;
            }
            else{
                this.questionObjects = this.createQuestionList(rawQuestionData.questions); 
                this.answerObjects = this.createAnswerList(rawAnswerData);
            }     
        }
    }

    //Extract questionData based on VR_Questionaire data input
    createQuestionList(questionData){
        //Dict of questions
        var questions = {}
        questionData.forEach(element => {
            var tmpQP = new QuestionPageData(element);
            questions[tmpQP.pageId] = tmpQP;
        });
        return questions;
    }

    //Extract questionData based on VR_Questionaire data input
    createAnswerList(answerData){
        //List of questions
        var answers = []
        answerData.forEach(element => {           
            var tmpQP = new AnwserData(element, this.questionObjects, answers.length);
            answers.push(tmpQP);
        });
        return answers;
    }

    createCues(answerSequence, delay){
        if (this.answerObjects == undefined){
            console.log("AnswerObjects not loaded");
            return undefined;
        }

        //Go through every timestamp in the answers
        this.answerObjects.forEach(element => {

            var cueStartTime = parseFloat((element.startTime - delay).toFixed(0));
            var cueEndTime = parseFloat((element.endTime - delay).toFixed(0));
            var interval = new TIMINGSRC.Interval(cueStartTime, cueEndTime);
            
            //Check if the time is already included -> Multiple questionspage
            if (answerSequence.hasCue(cueStartTime.toString())){
                //Add answer to the existing cue
                var cue = answerSequence.getCue(cueStartTime.toString());
                cue.data.push(element);
            }
            else{
                //Startingtime not cued yet
                answerSequence.addCue(cueStartTime.toString(), interval, [element]);
            }
        })
        return answerSequence;
    }
}

class QuestionPageData{
    constructor(pqData) {
        //Setup general Pageinfo (each page is a screen in VR, possibly with several questions)
        this.pageId = pqData.pId;
        this.questionType = pqData.qType;
        this.qInstructions = pqData.qInstructions;
        this.qOptions = pqData.qOptions;
        this.qConditions = pqData.qConditions;
        
        //Extract questionData per Page
        this.questions = {}        
        pqData.qData.forEach(element => {
            var tmpQ = new QuestionData(element)
            this.questions[tmpQ.qId] = tmpQ;
        });
    }
}

class QuestionData{
    constructor(qDataElem) {
        this.taskId = qDataElem.taskId;
        this.qId = qDataElem.qId;
        this.qText = qDataElem.qText;
        this.mandatory =  qDataElem.qMandatory;
        this.qOptions = qDataElem.qOptions;
        
        //Linear grid and linear slideroptions
        this.qMin = qDataElem.qMin;        
        this.qMax = qDataElem.qMax;
        this.qMinLabel = qDataElem.qMinLabel;
        this.qMaxLabel = qDataElem.qMaxLabel;
    }

    dropdownGetOptionText(answer){
        console.log(this.qOptions);
        var optionText = this.qOptions[answer];
        console.log(optionText);
        return optionText;
    }
}

class AnwserData{
    constructor(answerData, questionObjects) {
        this.answerId  = answerData.answerId;
        this.answer = answerData.Answer;
        this.startTime = answerData.StartTime;
        this.endTime = answerData.EndTime;

        this.questionId = answerData.QuestionID;
        this.questionType = answerData.QuestionType;
        this.questionText = answerData.Question;
        this.cId = answerData.ConditionID;
        for (var key in questionObjects){            
            if (answerData.QuestionID in questionObjects[key].questions){
                this.pageObject = questionObjects[key];    
            }
        }
    }

    getSingleAnswer(){
        var answerText = "";     

        switch(this.questionType){
        case "task":
            //Task screen, do not show in answerBox
            return "";
        case "radio": 
        case "dropdown":
            answerText = this.questionText +"</br>";
            answerText += this.pageObject.questions[this.questionId].qOptions[this.answer];
            break;
        case "radioGrid": 
            for (var key in this.pageObject.qConditions){
                if (this.pageObject.qConditions[key].qId === this.cId){                    
                    answerText = this.pageObject.qConditions[key].qText +"</br>";
                    answerText += this.pageObject.qOptions[parseInt(this.answer)];
                }
            }     
            break;
        case "checkbox":           
            answerText = "<tr><td>";
            if (this.answer === "1") answerText += "X   ";
            answerText += "</td><td>"+this.cId+"</td></tr>";
            break; 
        case "likert":
            answerText += "<table width='80%'>";
            var optionText = "<tr>";
            var answermark = "<tr>";
            var width = 80/this.pageObject.qOptions.length;
            for (var i in this.pageObject.qOptions) {
                optionText += "<td>|</td><td align='center' width='"+width+"%'>"+this.pageObject.qOptions[i]+"</td>";
                answermark += "<td>|</td><td align='center' width='"+width+"%'>";
                if (i == parseInt(this.answer)){
                    answermark += " X ";
                }
                else answermark += "  ";
                answermark += "</td>";
            }
            optionText += "<td>|</td></tr>";
            answermark += "<td>|</td></tr>";
            answerText += optionText + answermark + "</table></br>";
            break;                                    
        case "linearSlider":
        case "linearGrid": 
            answerText = this.questionText +"</br>"; 
            answerText += "<table><tr>";
            var min = this.pageObject.questions[this.questionId].qMin;
            var max = this.pageObject.questions[this.questionId].qMax;
            answerText += "<td>"+this.pageObject.questions[this.questionId].qMinLabel+"</td>";
            for (var i = min; i < max; i++) {
                answerText += "<td>";
                if (i == parseInt(this.answer)){
                    answerText += this.answer;
                }
                else answerText += " - ";
                answerText += "</td>";
            }
            answerText += "<td>"+this.pageObject.questions[this.questionId].qMaxLabel+"</td>";
            answerText += "</tr></table></br>";
            break;        
        default:
            console.log(this);
            console.log("default markup.. TODO");
            break;          
        }  

        return answerText;
    }

    showQuestionAnswers(cueAnswers){
        var answerString = "";
        //console.log(this.questionType, cueAnswers);
        switch(this.questionType){
        case "task":
            //answerString = this.pageObject.qInstructions + "</br><br>"; 
            //answerString += this.questionText;           
            break;
        case "numericInput":
            answerString = this.questionText +"</br>"+ this.answer;
            break;
        case "radio":
        case "dropdown":
            answerString = "";
            for (var key in cueAnswers){
                answerString += cueAnswers[key].getSingleAnswer() +"</br></br>";
            }
            break;
        case "likert":
            answerString = this.questionText +"</br>"; 
            for (var key in this.pageObject.qConditions){
                if (this.pageObject.qConditions[key].qId === this.cId){                    
                    answerString += this.pageObject.qConditions[key].qText +"</br></br>";
                }
            } 
            for (var key in cueAnswers){
                answerString += cueAnswers[key].getSingleAnswer();
            }
            break;
        case "radioGrid":
            answerString = this.pageObject.questions[this.questionId].qText +"</br></br>";
            for (var key in cueAnswers){
                answerString += cueAnswers[key].getSingleAnswer() +"</br></br>";
            }
            break;
        case "checkbox": 
            answerString = this.pageObject.questions[this.questionId].qText +"</br></br>";
            answerString += "<table>";            
            for (var key in cueAnswers){
                answerString += cueAnswers[key].getSingleAnswer();
            }
            answerString += "</table>"
            break;
        case "linearSlider":
        case "linearGrid": 
            answerString = "";
            for (var key in cueAnswers){
                answerString += cueAnswers[key].getSingleAnswer();
            }
            break;
        default:
            console.log("default markup.. TODO");
            console.log(this);
            console.log(cueAnswers);
            
            answerString = "Unknown questiontype, see log";
            break;          
        }
        return answerString;
    }
}