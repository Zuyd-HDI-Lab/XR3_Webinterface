class MinimapPlotter{
    constructor(rawMinimapData, minimapBox, trial_results){    
        //this.windowSquare = 400; 
        var element = document.querySelector('#minimap-canvas');
        this.windowSquare = getComputedStyle(element).height.replace('px','');
        this.rawMinimapData = rawMinimapData.Entries;
        this.trial_results = trial_results;
        this.combineTrialResults();

        this.minimapBox = minimapBox;
        this.minimapSvg = this.minimapBox
            .append("svg")
            .attr("id", "minimapSvg")
            .attr("width", this.windowSquare)
            .attr("height", this.windowSquare);
        this.sCorr = this.windowSquare/7;   //scaleCorrection
        this.cpCorr = this.windowSquare/2;  //centerpointCorrection
        this.gridlineSpace = this.windowSquare/6;

        this.objectList = ["Hmd", "Left Controller", "Right Controller", "Objects", "GridLines"];
        this.createMinimapSettings();
    }

    getCSSProperty(cssClass, property){
        const div = $("<div>").addClass(cssClass).attr("id",cssClass).appendTo(document.body);
        const prop = div.css(property);
        div.remove();
        return prop;
    }

    createMinimapSettings(){
        var mm_settings = d3.select("#minimap-settings");    
        var onEnter = mm_settings.selectAll("div")
            .data(this.objectList).enter().append("div").attr("id", function(d) { return "div"+ d;});

        onEnter.append("input")
            .attr("type","checkbox").attr("name", "minimap_object")
            .attr("id", function(d) { return "mm_setting"+ d;})
            .attr("value", function(d) { return d; })
            .attr("checked", "TRUE")
        
        onEnter.append("label")
            .attr("id", function(d) { return "lbl_mm_setting"+ d;})
            .attr("value", function(d) { return d; })
            .text(function(d) { return d; })                
    }

    combineTrialResults(){
        
        var trialIndex = 0;
        while (this.trial_results[trialIndex].trial_num == ""){ //Skip Questionaire sections
            trialIndex++;
        }
        var currentTrialResult = this.trial_results[trialIndex];

        for (var i = 0; i < this.rawMinimapData.length && trialIndex < this.trial_results.length; i++){
            if (currentTrialResult.start_time <= this.rawMinimapData[i].Timestamp && currentTrialResult.end_time > this.rawMinimapData[i].Timestamp){
                var target_id = parseInt(currentTrialResult.target_id);
                var clicked_id = parseInt(currentTrialResult.sphere_clicked);
                var highlighted = (currentTrialResult.highlighted == "TRUE");
                for (let j = 0; j < this.rawMinimapData[i].Objects.length; j++) {
                    this.rawMinimapData[i].Objects[j].Target = (this.rawMinimapData[i].Objects[j].Id == target_id)                    
                    this.rawMinimapData[i].Objects[j].Clicked = (this.rawMinimapData[i].Objects[j].Id == clicked_id)
                    if (this.rawMinimapData[i].Objects[j].Id == target_id ) this.rawMinimapData[i].Objects[j].Highlighted = highlighted;
                    else this.rawMinimapData[i].Objects[j].Highlighted = false;
                }
            }
            else if (currentTrialResult.end_time <= this.rawMinimapData[i].Timestamp){
                trialIndex++;
                while (trialIndex < this.trial_results.length && this.trial_results[trialIndex].trial_num == ""){
                    trialIndex++;                    
                }
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

    //TODO: 'Hardcoded' with the objects for the sonification-study.
    //Add flexibility -> Only add position and css-class
    plotObjects(cueData){
        this.removeObjects();
        var checkBoxes = document.querySelectorAll('input');

        //Draw gridlines
        if (checkBoxes[4].checked){ 
            
            //Horizontal Lines            
            for (let gridY = this.gridlineSpace; gridY < this.windowSquare; gridY+=this.gridlineSpace) {
                this.minimapSvg.append("svg:line").attr("class","gridlines")
                    .attr("x1", 0).attr("x2", this.windowSquare)
                    .attr("y1", gridY).attr("y2", gridY)
            }   
            //Vertical Lines            
            for (let gridX = this.gridlineSpace; gridX < this.windowSquare; gridX+=this.gridlineSpace) {
                this.minimapSvg.append("svg:line").attr("class","gridlines")
                    .attr("x1", gridX).attr("x2", gridX)
                    .attr("y1", 0).attr("y2", this.windowSquare);   
            }   
        }

        if (checkBoxes[3].checked){ 
            //Draw objects / spheres
            //console.log("Spheres:",cueData.Objects)
            for (let i = 0; i < cueData.Objects.length; i++) {
                const element = cueData.Objects[i];
                var cssClass = "sphereInvisible";
                if (element.Visible || element.Target || element.Clicked){
                    cssClass = "sphereNormal";
                    //console.log(element)
                    if (element.Highlighted) cssClass = "sphereHighlighted";
                    if (element.Clicked){
                        cssClass = "sphereClicked";
                        if (element.Target) cssClass = "sphereClickedTarget";                        
                    }
                }
                
                var cx = this.cpCorr + (element.Position.X *  this.sCorr)
                var cy = this.cpCorr + (element.Position.Y * -this.sCorr)
                if (element.Target){
                    this.minimapSvg.append("circle")
                        .attr("id","Object"+element.Id)
                        .attr("cx", cx).attr("cy", cy).attr("r", 13)
                        .attr("stroke", "black")
                        .attr("fill", "transparent")
                        .attr("transform", "rotate(" + element.Rotation + "," + cx + "," + cy + ")");
                }                    
                this.minimapSvg.append("circle")
                    .attr("id","Object"+element.Id)
                    .attr("class", cssClass)
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", 10)
                    .attr("transform", "rotate(" + element.Rotation + "," + cx + "," + cy + ")");

                var eltxt = element.Id;
                if (eltxt == 0) eltxt = 8;
                this.minimapSvg.append("text")
                    .attr("id","Text"+element.Id)
                    .attr("x", this.cpCorr + (element.Position.X *  this.sCorr) - 5)
                    .attr("y", this.cpCorr + (element.Position.Y * -this.sCorr) + 5)
                    .attr("fill", "white")
                    .text(eltxt);                    
            }
        }

        this.controllerHeight = this.getCSSProperty('controller', 'height').replace('px','');
        this.controllerWidth = this.getCSSProperty('controller', 'width').replace('px','');
        this.controllerLineLen = this.getCSSProperty('controllerLine', 'height').replace('px','');
        if (checkBoxes[1].checked){
            //Draw Left Controller
            var lcXcenter = this.cpCorr + (cueData.Controllers[0].Position.X *  this.sCorr);
            var lcYcenter = this.cpCorr + (cueData.Controllers[0].Position.Y * -this.sCorr);

            this.minimapSvg.append("svg:line")
                .attr("id","LeftLine").attr("class","controllerLine")
                .attr("x1", lcXcenter).attr("x2", lcXcenter)
                .attr("y1", lcYcenter).attr("y2", lcYcenter - this.controllerLineLen)
                .attr("transform", "rotate(" + -cueData.Controllers[0].Rotation + "," + lcXcenter + "," + lcYcenter + ")");

            this.minimapSvg.append("svg:image")
                .attr("id","LeftController")
                .attr("class","controller")
                .attr("x", lcXcenter - (this.controllerWidth/2))
                .attr("y", lcYcenter - (this.controllerHeight/2))
                .attr("xlink:href", "css/img/imgController.png")
                .attr("transform", "rotate(" + -cueData.Controllers[0].Rotation + "," + lcXcenter + "," + lcYcenter + ")");
        }

        if (checkBoxes[2].checked){
            //Draw Right Controller
            var rcXcenter = this.cpCorr + (cueData.Controllers[1].Position.X *  this.sCorr);
            var rcYcenter = this.cpCorr + (cueData.Controllers[1].Position.Y * -this.sCorr);

            this.minimapSvg.append("svg:line")
                .attr("id","RightLine").attr("class","controllerLine")
                .attr("x1", rcXcenter).attr("x2", rcXcenter)
                .attr("y1", rcYcenter).attr("y2", rcYcenter - this.controllerLineLen)
                .attr("transform", "rotate(" + -cueData.Controllers[1].Rotation + "," + rcXcenter + "," + rcYcenter + ")");

            this.minimapSvg.append("svg:image")
                .attr("id","RightController").attr("class","controller")
                .attr("x", rcXcenter - (this.controllerWidth/2))
                .attr("y", rcYcenter - (this.controllerHeight/2))
                .attr("xlink:href", "css/img/imgController.png")
                .attr("transform", "rotate(" + -cueData.Controllers[1].Rotation + "," + rcXcenter + "," + rcYcenter + ")");
        }

        if (checkBoxes[0].checked){
            //Draw HMD
            var hmdHeight = this.getCSSProperty('HMD', 'height').replace('px','');
            var hmdWidth = this.getCSSProperty('HMD', 'width').replace('px','');
            var hmdXcenter = this.cpCorr + (cueData.Hmd.Position.X *  this.sCorr);
            var hmdYcenter = this.cpCorr + (cueData.Hmd.Position.Y * -this.sCorr);
            //this.minimapSvg.append("rect")
            this.minimapSvg.append("svg:image")
                .attr("id","HMD").attr("class","HMD")
                .attr("x", hmdXcenter - (hmdHeight/2))
                .attr("y", hmdYcenter - (hmdWidth/2))
                .attr("xlink:href", "css/img/imgHMD.png")
                .attr("transform", "rotate(" + -cueData.Hmd.Rotation +","+ hmdXcenter +","+ hmdYcenter +")");       
        }        
    }

    removeObjects(){
        d3.select("#minimapSvg").selectAll('*').remove();
    }
}