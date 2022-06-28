function initialise(){
    concole.log("function initialise started");
}

let researchSession;

// essential to the functioning of the timing sequencer
var run = function () {   
    const loadVideo = (object, source) => { return new Promise((resolve, reject) => {
        let sourceObject = document.createElement("source");
        sourceObject.src = source;
        sourceObject.id = "mp4_src";
        sourceObject.type = "video/mp4";
        object.append(sourceObject);

        object.load();
        object.onloadedmetadata = function () {
            resolve(object);
        }
    });}
    
    // Kick it all off
    startResearchReporter(directory, urls);            

    function startResearchReporter(directory, urls) {
        if(typeof directory === 'undefined' || typeof urls.video === 'undefined'){ // || typeof urls.answers === 'undefined' || typeof urls.questions === 'undefined') {
            alert("Filename in urls object or directory is undefined."); //directory is undefined: " + typeof directory === 'undefined' + ", video is undefined: " + typeof urls.video === 'undefined' + ", answers is undefined: " + typeof urls.answers === 'undefined' + ", questions is undefined: " + typeof urls.questions === 'undefined');
            return;
        }

        // Load data and video files
        d3.json(directory + urls.answers).then(function (answerData) { 
        d3.json(directory + urls.questions).then(function (questionData) {
                
            loadVideo(document.getElementById("video-feed"), getVideoPath(directory, urls)).then(video => {
                // Create new researchsession object
                researchSession = new ResearchSession(video, 0, questionData, answerData);
                setupButtons();
                setupHeader(answerData);
                setupSlider(researchSession, 8, 4);                

                // Finish by calling timeUpdate once
                researchSession.timeUpdate();                
            });
              
        }).catch(function (error) {
            alert("Failed to load question data, see console");
            console.log(error);
        });    
        }).catch(function (error) {
            alert("Failed to load answer data, see console")
            console.log(error);
        });        
    }
            
    //First version of getting correct path to video.
    //Change if directory is saved by participant ID
    function getVideoPath(directory, urls)
    {
        if(typeof directory === 'undefined' || typeof urls.video === 'undefined'){ // || typeof urls.answers === 'undefined' || typeof urls.questions === 'undefined') {
            alert("Can't find video. Filename in urls object or directory is undefined.");
            return;
        }
        return directory + urls.video;
    }

    //Add the onClick event with specific actions according to button_id
    function setupButtons() {    
        var buttonsElem = document.getElementsByClassName("btn_control");
        for(var i = 0; i < buttonsElem.length; i++) {
            researchSession.addClickEvent(buttonsElem[i]);
        }
    }

    function setupHeader(infoData) {
        if (infoData.researchID !== 'undefined') {
            document.getElementById("research").innerHTML = infoData.researchID;
        }
        if (infoData.researcher !== 'undefined') {
            document.getElementById("researcher").innerHTML = infoData.researcher;
        }
        document.getElementById("test-subject").innerHTML = "Anonymous";
        if (infoData.subject !== 'undefined') {
            document.getElementById("test-subject").innerHTML = infoData.subject;
        }
        if (infoData.subjectID !== 'undefined') {
            document.getElementById("subject-id").innerHTML = infoData.subjectID;
        }
    }

    function setupSlider(researchSession, r, m){
        //console.log(researchSession.sliderBox.node())
        let windowWidth = 680;//parseInt(getComputedStyle(researchSession.sliderBox.node()).width, 10)
        let x = d3.scaleLinear()
            .range([0, windowWidth, 10])    
            .domain([0, researchSession.timingObject._range[1]]);
        
        let margin = { top: r * 2 + m };
        
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        let sliderContainer = d3.select("#slider_controls");
        
        let divSlider = sliderContainer.append("div")
            .attr("id", "slider-div")
            .style("position", "relative")
            .style("display", "block")
            .style("top", margin.top)
            .style("left", 0)
            //.style("width", x.range()[1] + "px");
            .style("width", "680px");

        let navCircles = sliderContainer.append("div")
            .style("position", "relative")
            .attr("id", "question-marker-parent")
            .selectAll("div.question-marker")
            .data(researchSession.questionSequence.getCues())
            .enter()
            .append("div")
            .attr("class", "question-marker")
            .style("position", "absolute")
            .style("display", "block")
            .style("left", function (d) {
                return (x(d.interval.low) - 9) + "px";
            })
            .attr("id", function (d) { return "t_" + d.key.replace('.', 'p'); })
            .attr("time", function (d) { return d.key; })
            .on("mouseover", function (d, i) {
                if (!d3.select(this).classed("circle-hover")) {
                    d3.select(this).classed("circle-hover", true)
                }
                div.transition()
                    .duration(200)
                    .style("opacity", .9)
                    .style("left", (d.pageX) + "px")
                    .style("top", (d.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                d3.select(this).classed("circle-hover", false)
                div.transition()
                    .duration(100)
                    .style("opacity", 0);
            })
            .on("click", function (d, i) {
                //console.log("clicked: ", parseFloat(i.key));
                researchSession.timingObject.update({ position: parseFloat(i.key) });
            });

        let sliderProgress = divSlider.append("div")
            .attr("id", "slider-progress")
            .style("position", "relative")
            .style("display", "block")
            .on("mouseover", function (d) {
                if (!d3.select(this).classed("progress-hover")) {
                    d3.select(this).classed("progress-hover", true)
                }
            })
            .on("mouseout", function (d) {
                d3.select(this).classed("progress-hover", false)
            });

        this.sliderProgress = sliderProgress;
        this.x = x;

        divSlider.on("mouseover", function (d) {
            if (!d3.select(this).classed("slider-hover")) {
                d3.select(this).classed("slider-hover", true)
            }
            if (!d3.select("#slider-progress").classed("progress-hover")) {
                d3.select("#slider-progress").classed("progress-hover", true)
            }
        })
        .on("mouseout", function (d) {
            d3.select("#slider-progress").classed("progress-hover", false)
        })
        .on("click", function (d) {
            researchSession.timingObject.update({ position: x.invert(d.pageX - d3.select(this).node().getBoundingClientRect().x) });
        });    
    }
//End run-function
}