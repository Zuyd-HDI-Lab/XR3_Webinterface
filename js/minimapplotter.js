class MinimapPlotter{
    constructor(rawMinimapData, minimapBox, trial_results){    
        var windowSquare = 400;   
        this.rawMinimapData = rawMinimapData.Entries;
        this.trial_results = trial_results;
        this.combineTrialResults();

        this.minimapBox = minimapBox;
        this.minimapSvg = this.minimapBox
            .append("svg")
            .attr("id", "minimapSvg")
            .attr("width", windowSquare)
            .attr("height", windowSquare);
        this.sCorr = windowSquare/6;//Actual width & height: 480, in VR: 6 meter //scaleCorrection
        this.cpCorr = windowSquare/2; //centerpointCorrection

    }

    combineTrialResults(){
        var trialIndex = 0;
        var currentTrialResult = this.trial_results[trialIndex];
        for (var i = 0; i < this.rawMinimapData.length && trialIndex < this.trial_results.length; i++){
            var element = this.rawMinimapData[i];
            if (currentTrialResult.start_time <= element.Timestamp && currentTrialResult.end_time > element.Timestamp){
                var target_id = parseInt(currentTrialResult.target_id);
                var clicked_id = parseInt(currentTrialResult.sphere_clicked);
                var highlighted = (currentTrialResult.highlighted == "TRUE");
                for (let j = 0; j < element.Objects.length; j++) {
                    if (element.Objects[j].Id == target_id){
                        element.Objects[j].Target = true;
                        element.Objects[j].Highlighted = highlighted;
                    }
                    if (element.Objects[j].Id == clicked_id){
                        element.Objects[j].Clicked = true;
                    }                
                }
            }
            else if (currentTrialResult.end_time <= element.Timestamp){
                trialIndex++;
                currentTrialResult = this.trial_results[trialIndex];
            }
        }
    }

    createCues(minimapSequence, delay, duration){
        if (this.rawMinimapData === undefined){
            console.log("TimestampedData not loaded");
            return undefined;
        }
        
        //Go through every timestamp in the log
        var i = 1;
        for (let i = 0; i < this.rawMinimapData.length-1; i++) {
            if (this.rawMinimapData[i].Timestamp-delay >= 0){
                const element = this.rawMinimapData[i];
                var nexElement = this.rawMinimapData[i+1];

                var interval = new TIMINGSRC.Interval(element.Timestamp-delay, nexElement.Timestamp-delay);
                minimapSequence.addCue(parseFloat(element.Timestamp-delay).toString(), interval, element);
            }
        }
        //Add last cue until end of video
        var interval = new TIMINGSRC.Interval(this.rawMinimapData[i].Timestamp, duration);
        minimapSequence.addCue(parseFloat(this.rawMinimapData[i]).toString(), interval, this.rawMinimapData[i]);
        
        return minimapSequence;
    }

    //TODO: 'Hardcoded' with the object for the sonification-study.
    //Add flexibility -> Only add position and css-class
    plotObjects(cueData){
        this.removeObjects();

        //Draw left and right controller
        var controllerWidth = 30;
        var controllerHeigth = 30;

        var lcXcenter = this.cpCorr + (cueData.Controllers[0].Position.X * this.sCorr);
        var lcYcenter = this.cpCorr + (cueData.Controllers[0].Position.Y * -this.sCorr);

        this.minimapSvg.append("svg:line")
            .attr("id","LeftLine")
            .attr("x1", lcXcenter)
            .attr("y1", lcYcenter)
            .attr("x2", lcXcenter)
            .attr("y2", lcYcenter - 300)
            .attr("stroke-width", 2)
            .attr("stroke", "black")
            .attr("transform", "rotate(" + -cueData.Controllers[0].Rotation + "," + lcXcenter + "," + lcYcenter + ")");

        this.minimapSvg.append("svg:image")
            .attr("id","LeftController")
            .attr("x", lcXcenter - (controllerWidth/2))
            .attr("y", lcYcenter - (controllerHeigth/2))
            .attr("width", controllerWidth)
            .attr("height", controllerHeigth)
            .attr("xlink:href", "css/img/imgController.png")
            .attr("transform", "rotate(" + -cueData.Controllers[0].Rotation + "," + lcXcenter + "," + lcYcenter + ")");

        var rcXcenter = this.cpCorr - (controllerWidth/2) + (cueData.Controllers[1].Position.X * this.sCorr);
        var rcYcenter = this.cpCorr - (controllerHeigth/2) + (cueData.Controllers[1].Position.Y * -this.sCorr);

        this.minimapSvg.append("svg:line")
            .attr("id","LeftLine")
            .attr("x1", rcXcenter)
            .attr("y1", rcYcenter)
            .attr("x2", rcXcenter)
            .attr("y2", rcYcenter - 300)
            .attr("stroke-width", 2)
            .attr("stroke", "black")
            .attr("transform", "rotate(" + -cueData.Controllers[1].Rotation + "," + rcXcenter + "," + rcYcenter + ")");

        this.minimapSvg.append("svg:image")
            .attr("id","RightController")
            .attr("x", rcXcenter - (controllerWidth/2))
            .attr("y", rcYcenter - (controllerHeigth/2))
            .attr("width", controllerWidth)
            .attr("height", controllerHeigth)
            .attr("xlink:href", "css/img/imgController.png")
            .attr("transform", "rotate(" + -cueData.Controllers[1].Rotation + "," + rcXcenter + "," + rcYcenter + ")");
    
        for (let i = 0; i < cueData.Objects.length; i++) {
            const element = cueData.Objects[i];
            if (element.Visible){
                var cx = this.cpCorr + (element.Position.X * this.sCorr)
                var cy = this.cpCorr + (element.Position.Y * -this.sCorr)
                this.minimapSvg.append("circle")
                    .attr("id","Object"+element.Id)
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", 5)
                    .attr("stroke", "black")
                    .attr("fill","#93278F")
                    .attr("transform", "rotate(" + element.Rotation + "," + cx + "," + cy + ")");
                   
                this.minimapSvg.append("text")
                    .attr("id","Text"+element.Id)
                    .attr("x", this.cpCorr + (element.Position.X * this.sCorr))
                    .attr("y", this.cpCorr + (element.Position.Y * -this.sCorr))
                    .attr("r", 5)
                    .attr("stroke", "black")
                    .text(element.Id);                    
            }
        }

        //Draw HMD
        var hmdWidth = 30;
        var hmdXcenter = this.cpCorr  + (cueData.Hmd.Position.X * this.sCorr);
        var hmdYcenter = this.cpCorr  + (cueData.Hmd.Position.Y * -this.sCorr);
        //this.minimapSvg.append("rect")
        this.minimapSvg.append("svg:image")
            .attr("id","HMD")
            .attr("x", hmdXcenter - (hmdWidth/2))
            .attr("y", hmdYcenter - (hmdWidth/2))
            .attr("xlink:href", "css/img/imgHMD.png")
            .attr("transform", "rotate(" + -cueData.Hmd.Rotation +","+ hmdXcenter +","+ hmdYcenter +")");               
    }


    removeObjects(){
        d3.select("#minimapSvg").selectAll('*').remove();
    }
}