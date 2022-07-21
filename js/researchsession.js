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
                var nearestCue = self.getNearestCue(self.answerSequence.keys(), self.timingObject.query().position, "left")
                if (nearestCue !== undefined){
                    self.timingObject.update({ position: parseFloat(nearestCue.key) });
                }
                else{
                    //No previous cue found, go to start
                    self.timingObject.update({ position: 0.0 });
                    self.updateCircleStates(self.timingObject._range[0])
                }                
            }
            else if (elem.id === "btn_pause") {
                self.timingObject.update({ velocity: 0.0 });
            } 
            else if (elem.id === "btn_play") {
                var v = self.timingObject.query();
                if (v.position === 100 && v.velocity === 0) {
                    self.timingObject.update({ position: 0.0, velocity: 1.0 });
                } else self.timingObject.update({ velocity: 1.0 });
            }
            else if (elem.id === "btn_nextcue") {
                var nearestCue = self.getNearestCue(self.answerSequence.keys(), self.timingObject.query().position, "right");
                if (nearestCue !== undefined) self.timingObject.update({ position: parseFloat(nearestCue.key) });
                //else: No next cue found
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
        //let questionSequence = new TIMINGSRC.Sequencer(this.timingObject);
        let answerSequence = new TIMINGSRC.Sequencer(this.timingObject);
        answerSequence = this.questionaire.createCues(answerSequence);
        
        answerSequence.on("change", function (e) {
            var currentCue = answerSequence.getCue(e.key);
            self.questionBox.innerHTML = currentCue.data[0].showQuestionAnswers(currentCue.data);

            self.updateCircleStates(answerSequence.getCue(e.key)); //<-- DO not check every circle but update only current affected
            //self.playAnswerAudio(e.data.answer);
        });
        answerSequence.on("remove", function (e) {
            //console.log("on answer sequence remove called");
            self.questionBox.innerHTML = "";
        });

        this.answerSequence = answerSequence;
    }

    getNearestCue(cues, time, direction) {
        var i;
        if (direction === "right") {
            i = d3.bisectRight(cues, time);
        } else if (direction === "left") {
            i = d3.bisectLeft(cues, time) - 1;
            //if(time - parseFloat(cues[i]) < 0.5) {
            //    i--;
            //}
        }
        return this.answerSequence.getCue(cues[i]);
    }

    updateCircleStates(cue) {
        let modes = ["previous", "current", "next"];
        let allCues = this.answerSequence.getCues().filter(function (d) { return d.key });
        //console.log(allCues)
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

    setActiveCircle(id) {
        d3.select("#t_" + id).classed("current", true)
    }
}