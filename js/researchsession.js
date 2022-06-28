class ResearchSession {
    
    constructor(video, delay, rawQuestionData, rawAnswerData) {
        //Video-feed
        this.video = video;
        this.delay = delay;
        this.timeSec = 0.00;
        //Synchronisation
        this.timingObject = new TIMINGSRC.TimingObject({ range: [0, this.video.duration] });
        this.videosync = MCorp.mediaSync(document.getElementById('video-feed'), this.timingObject);
        
        //Questionnaire data
        //this.questionData = rawQuestionData;
        //this.answerData = rawAnswerData;
        this.questionaire = new Questionnaire(rawQuestionData, rawAnswerData);
        this.questionSequence;
        this.answerSequence;
        //this.createQuestionCues();
        //this.createAnswerCues();
        this.createCues();

        //Minimap data

        //Connection to html-elements
        this.timeBox = document.getElementById("video_time");
        this.questionBox = document.getElementById("question-timing");
        this.answerBox = document.getElementById("answer-timing");
        this.sliderBox = d3.select("#slider_controls");
        this.progressPadding = 2;        
    }

    //Add the onClick event with specific actions according to button_id
    addClickEvent(elem){
        var self = this;
        elem.onclick = function (e) {
            if (elem.id === "btn_replay") {
                self.timingObject.update({ position: 0.0 });
                self.updateCircleStates(self.timingObject._range[0])            
            }
            else if (elem.id === "btn_previouscue") {
                var nearestCue = self.getNearestCue(self.sequence.keys(), self.timingObject.query().position, "left")
                self.timingObject.update({ position: parseFloat(nearestCue.key) });
            }
            else if (elem.id === "btn_pause") {
                console.log(self.timingObject)
                self.timingObject.update({ velocity: 0.0 });
            } 
            else if (elem.id === "btn_play") {
                var v = self.timingObject.query();
                if (v.position === 100 && v.velocity === 0) {
                    self.timingObject.update({ position: 0.0, velocity: 1.0 });
                } else self.timingObject.update({ velocity: 1.0 });
            }
            else if (elem.id === "btn_nextcue") {
                var nearestCue = self.getNearestCue(self.sequence.keys(), self.timingObject.query().position, "right");
                self.timingObject.update({ position: parseFloat(nearestCue.key) });
            }
            else if (elem.id === "btn_toend") { //btn not implemented?
                self.timingObject.update({ position: self.timingObject._range[1] });
                self.updateCircleStates(self.timingObject._range[1])
            }
        }          
    }

    //Shows the current video-time in the timeBox
    showTime(){
        this.timeBox.innerHTML = this.timeSec;
    }

    //Update the timer and set slider to start if time is 0.00
    timeUpdate() {
        var self = this;
        self.timingObject.on("timeupdate", function () {
            self.timeSec = self.timingObject.query().position.toFixed(2);
            //console.log("Call time.update(), time: " + self.timeSec);
            self.showTime();
            /*
            if (self.timeSec == "0.00") {
                self.sliderProgress.style("width", 0);
            } else {
                self.sliderProgress.style("width", self.x(self.timeSec) + "px");
            }
            */
        });
    }

    createCues(){
        let self = this;
        let questionSequence = new TIMINGSRC.Sequencer(this.timingObject);
        let answerSequence = new TIMINGSRC.Sequencer(this.timingObject);

        //Go through every timestamp in the answers
        self.questionaire.rawAnswerData.answers.forEach(function(element, i) {
            if (typeof element === 'undefined') {
                // should be skipped, it's an implicit question
                console.log("should be skipped, it's an implicit question")
            }
            else{                
                var cueStartTimeQ = parseFloat(element.questionAskTime.toFixed(2) - self.delay);
                var cueStartTimeA = parseFloat(element.questionAnswerTime.toFixed(2) - self.delay);             
                var cueEndTimeQ = self.timingObject._range[1]
                var cueEndTimeA = self.timingObject._range[1]
                if (i < self.questionaire.rawAnswerData.length - 1){                    
                    cueEndTimeQ  = parseFloat(self.questionaire.rawAnswerData[i + 1].questionAskTime.toFixed(2) - self.delay);
                    cueEndTimeA = parseFloat(self.questionaire.rawAnswerData[i + 1].questionAnswerTime.toFixed(2) - self.delay);
                }
                var intervalQ = new TIMINGSRC.Interval(cueStartTimeQ, cueEndTimeQ);
                var intervalA = new TIMINGSRC.Interval(cueStartTimeA, cueEndTimeA);
                questionSequence.addCue(parseFloat(cueStartTimeQ).toString(), intervalQ, { "question": element.question, "answer": element.answer });
                  answerSequence.addCue(parseFloat(cueStartTimeA).toString(), intervalA, { "question": element.question, "answer": element.answer })
            }
        })
        questionSequence.on("change", function (e) {
            //console.log("on question sequence update called");
            //TODO -> Vragen al creeeren klaarzetten met een ID, deze dan ophalen ipv creeeren
            //self.newQuestion = new QuestionHandler(self.questions[e.data.question], self.questionBox);
            self.updateCircleStates(questionSequence.getCue(e.key))
        });
        questionSequence.on("remove", function (e) {
            self.questionBox.innerHTML = "";
        });
        answerSequence.on("change", function (e) {
            //console.log("on answer sequence update called");
            self.newQuestion.showAnswer()
            self.playAnswerAudio(e.data.answer);
        });
        this.questionSequence = questionSequence;
        this.answerSequence = answerSequence;
    }

    /* Combined createQuestionCues and createAnswerCues
    createQuestionCues(){
        let self = this;
        let questionSequence = new TIMINGSRC.Sequencer(this.timingObject);
        console.log(self)

        //Go through every timestamp in the answers
        self.answerData.answers.forEach(function(element, i) {
            if (typeof element === 'undefined') {
                // should be skipped, it's an implicit question
                console.log("should be skipped, it's an implicit question")
            }
            else{                
                var cueStartTime = parseFloat(element.questionAskTime.toFixed(2) - self.delay)                
                var cueEndTime = self.timingObject._range[1]
                if (i < self.answerData.length - 1){                    
                    cueEndTime = parseFloat(self.answerData[i + 1].questionAskTime.toFixed(2) - self.delay)
                }
                //Add the time a question is asked as a cue
                var interval = new TIMINGSRC.Interval(cueStartTime, cueEndTime)
                questionSequence.addCue(parseFloat(cueStartTime).toString(), interval, { "question": element.question, "answer": element.answer });
            }
        })
        questionSequence.on("change", function (e) {
            //console.log("on question sequence update called");
            self.newQuestion = new QuestionHandler(self.questions[e.data.question], self.questionBox);
            self.updateCircleStates(questionSequence.getCue(e.key))
        });
        questionSequence.on("remove", function (e) {
            self.questionBox.innerHTML = "";
        });
        this.questionSequence = questionSequence;
    }

    createAnswerCues() {
        let self = this;
        let answerSequence = new TIMINGSRC.Sequencer(this.timingObject);
        self.answerData.answers.forEach(function(element, i) {
            if (typeof element === 'undefined') {
                // should be skipped, it's an implicit question
                console.log("should be skipped, it's an implicit question")
            }
            else{
                var cueStartTime = parseFloat(element.questionAnswerTime.toFixed(2) - self.delay);              
                var cueEndTime = self.timingObject._range[1]
                if (i < self.answerData.length - 1){                    
                    cueEndTime = parseFloat(self.answerData[i + 1].questionAnswerTime.toFixed(2) - self.delay)
                }

                let answerInterval = new TIMINGSRC.Interval(cueStartTime, cueEndTime)
                answerSequence.addCue(parseFloat(element.questionAnswerTime.toFixed(2) - self.delay).toString(), answerInterval, { "question": element.question, "answer": element.answer })
            }
        })    
        answerSequence.on("change", function (e) {
            //console.log("on answer sequence update called");
            self.newQuestion.showAnswer()
            self.playAnswerAudio(e.data.answer);
        });
        this.answerSequence = answerSequencer;
    }
*/

    updateCircleStates(cue) {
        let modes = ["previous", "current", "next"];
        let allCues = this.sequence.getCues().filter(function (d) { return d.key });
        console.log(allCues)
        d3.selectAll(".question-marker").each(function (d) {
            let currentItem = d3.select(this);
            for (var i = 0; i < modes.length; i++) {
                currentItem.classed(modes[i], false);
            }
            if (parseFloat(currentItem.attr("time")) < parseFloat(cue.key)) {
                currentItem.classed(modes[0], true);
            }
            else if (parseFloat(currentItem.attr("time")) > parseFloat(cue.key)) {
                currentItem.classed(modes[2], true);
            }
        });

        var idString = "";
        if(typeof cue.key !== 'undefined') {
            idString = cue.key.replace('.', 'p')
        }

        this.setActiveCircle(idString);
    }
}