class Questionnaire{
    constructor(rawQuestionData, rawAnswerData) {
        console.log("Questionnaire created");
        this.rawQuestionData = rawQuestionData;
        this.rawAnswerData = rawAnswerData;

        console.log(this.rawQuestionData);
        console.log(this.rawAnswerData);

        //TODO:
        //List of questions
        var tmp = rawQuestionData.QuestionBlocks;
        console.log(tmp);
        //List of answerdata
        //Create cues?
    }
}

/*
class QuestionData{
    constructor() {
        console.log("Needed?");
    }
}
*/

/*
class AnwserData{
    constructor() {
        console.log("Needed?");
    }
}
*/