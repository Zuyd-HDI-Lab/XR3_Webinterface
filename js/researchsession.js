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
        this.createCues();

        //Minimap data

        //Connection to html-elements
        this.timeBox = document.getElementById("video_time");
        this.questionBox = document.getElementById("question-timing");
        this.answerBox = document.getElementById("answer-timing");
        this.sliderBox = d3.select("#slider_controls");
        this.sliderProgress;//Does not exist while creacting ResearchSession!!
        this.progressPadding = 2;        
    }

    //Update the timer and set slider to start if time is 0.00
    timeUpdate() {
        var self = this;
        self.timingObject.on("timeupdate", function () {
            self.timeSec = self.timingObject.query().position.toFixed(2);
            self.timeBox.innerHTML = self.timeSec;

            if (self.timeSec == "0.00") {
                self.sliderProgress.style("width", 0);
            } else {
                self.sliderProgress.style("width", self.x(self.timeSec) + "px");
            }
        });
    }

    createCues(){
        let self = this;
        let answerSequence = new TIMINGSRC.Sequencer(this.timingObject);
        answerSequence = this.questionaire.createCues(answerSequence, self.delay);
        
        answerSequence.on("change", function (e) {
            var currentCue = answerSequence.getCue(e.key);
            self.questionBox.innerHTML = currentCue.data[0].showQuestionAnswers(currentCue.data);
            self.updateCircleStates(answerSequence.getCue(e.key));
            //self.playAnswerAudio(e.data.answer);
        });
        answerSequence.on("remove", function (e) {
            self.questionBox.innerHTML = "";
        });

        this.answerSequence = answerSequence;
    }

    getNearestCue(direction) {
        this.timingObject.update({ velocity: 0.0 });

        var cues = this.answerSequence.keys();
        var time = this.timingObject.query().position;
                
        var i;
        if (direction === "right") {
            i = d3.bisectRight(cues, time);
        } else if (direction === "left") {
            var iR = d3.bisectRight(cues, time);
            i = d3.bisectLeft(cues, time) - 1;
        }
        return this.answerSequence.getCue(cues[i]);
    }

    updateCircleStates(cue) {
        d3.selectAll(".question-marker").each(function (d) {
            let currentItem = d3.select(this);
            currentItem.classed("current", false);
        });
        
        var idString = "";
        if(typeof cue.key !== 'undefined') {
            idString = cue.key.replace('.', 'p')
        }
        d3.select("#t_" + idString).classed("current", true)
    }
}