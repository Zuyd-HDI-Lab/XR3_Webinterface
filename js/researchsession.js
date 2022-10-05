class ResearchSession {
    
    constructor(video, delay, rawQuestionData, rawAnswerData, minimapData, trial_results) {
        //Video-feed
        this.video = video;
        this.delay = delay;
        this.timeSec = 0.00;
        //Synchronisation
        this.timingObject = new TIMINGSRC.TimingObject({ range: [0, this.video.duration] });
        this.videosync = MCorp.mediaSync(document.getElementById('video-feed'), this.timingObject);
        
        //Questionnaire data
        this.questionaire = new Questionnaire(rawQuestionData, rawAnswerData, trial_results);
        this.questionSequence;
        this.answerSequence;
        this.createAnswerCues();

        this.trial_results = trial_results;
        //Minimap data        
        this.minimapBox = d3.select("#minimap-canvas");
        this.minimapPlotter = new MinimapPlotter(minimapData, this.minimapBox, trial_results);
        this.createMinimapCues();

        //Connection to html-elements
        this.timeBox = document.getElementById("video_time");
        this.questionBox = document.getElementById("question-timing");
        this.answerBox = document.getElementById("answer-timing");
        this.sliderBox = d3.select("#slider_controls");
        this.sliderProgress; //Does not exist while creacting ResearchSession
        this.progressPadding = 2;        
    }

    //Update the timer and set slider to start if time is 0.00
    timeUpdate() {
        var rs = this;
        rs.timingObject.on("timeupdate", function () {
            rs.timeSec = rs.timingObject.query().position.toFixed(2);
            rs.timeBox.innerHTML = rs.timeSec;

            if (rs.timeSec == "0.00") {
                rs.sliderProgress.style("width", 0);
            } else {
                rs.sliderProgress.style("width", rs.x(rs.timeSec) + "px");
            }
        });
    }

    createMinimapCues(){        
        let self = this;
        let minimapSequence = new TIMINGSRC.Sequencer(this.timingObject);
        minimapSequence = this.minimapPlotter.createCues(minimapSequence, this.delay, this.video.duration);
        
        minimapSequence.on("change", function (e) {
            var currentCue = minimapSequence.getCue(e.key);
            self.minimapPlotter.plotObjects(currentCue.data);
        });
        minimapSequence.on("remove", function (e) {});
        this.minimapSequence = minimapSequence;
    }

    createAnswerCues(){
        let self = this;
        let answerSequence = new TIMINGSRC.Sequencer(this.timingObject);
        answerSequence = this.questionaire.createCues(answerSequence, this.delay);
        
        if (answerSequence != undefined){
            answerSequence.on("change", function (e) {
                var currentCue = answerSequence.getCue(e.key);
                self.questionBox.innerHTML = currentCue.data[0].showQuestionAnswers(currentCue.data);
                self.updateCircleStates(answerSequence.getCue(e.key));
            });
            answerSequence.on("remove", function (e) {
                self.questionBox.innerHTML = "";
            });
        }
        this.answerSequence = answerSequence;
    }

    getNearestCue(direction) {
        if (this.answerSequence != undefined){
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