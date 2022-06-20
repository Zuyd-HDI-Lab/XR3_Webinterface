         

            function startSequencer(directory, urls) {
                console.log("function 'startSequencer' started") 

                if(typeof directory === 'undefined' || typeof urls.video === 'undefined' || typeof urls.answers === 'undefined' || typeof urls.questions === 'undefined') {
                    alert("Filename in urls object or directory is undefined. directory is undefined: " + typeof directory === 'undefined' + ", video is undefined: " + typeof urls.video === 'undefined' + ", answers is undefined: " + typeof urls.answers === 'undefined' + ", questions is undefined: " + typeof urls.questions === 'undefined');
                    return;
                }

                // Load data and video files
                d3.json(directory + urls.answers).then(function (answerData) {

                    d3.json(directory + urls.questions).then(function (questionData) {

                        loadVideo(document.getElementById("myVideo"), directory + urls.video).then(video => {

                            // Create new master sequencer object
                            let sequencer = new MasterSequencer(video, 0, timingProvider);

                            // Sort and set answers
                            let sortedAnswers = answerData.answers.slice().sort((a, b) => d3.ascending(a.questionAskTime, b.questionAskTime));
                            sequencer.setAnswers(sortedAnswers);

                            // Index questions
                            let indexedQuestions = {};
                            questionData["QuestionBlocks"].forEach(function (outer) {
                                outer["Questions"].forEach(function (inner) {
                                    thisObject = inner;
                                    thisObject["BlockSubTitle"] = outer["SubTitle"]
                                    thisObject["BlockQuestion"] = outer["BlockQuestion"]
                                    indexedQuestions[inner["question"]] = thisObject;
                                })
                            });
                            // Attach correct answers
                            sequencer.answers.forEach(function (answer) {
                                if (typeof indexedQuestions[answer.question] !== 'undefined') {
                                    let matchingQuestion = indexedQuestions[answer.question];
                                    matchingQuestion.correctAnswer = answer.answer;
                                    //console.log(matchingQuestion);
                                }

                            });
                            // Setup questions
                            sequencer.setQuestions(indexedQuestions);

                            // Setup question sequence
                            sequencer.questionSequence();

                            // Setup answer sequence
                            sequencer.answerSequence();

                            // Setup info header
                            let info = { subjectId: answerData.subjectID, researchID: answerData.researchID, dateTime: answerData.dateTime, subject: answerData.subject, researcher: answerData.researcher }
                            sequencer.setupHeader(info);

                            // Setup slider
                            sequencer.slider(8, 4);

                            // Setup controls
                            sequencer.setupButtons(sequencer.sequence);  

                            // Finish by calling timeUpdate once
                            sequencer.timeUpdate();
                            //console.log(sequencer.questions);

                            if(typeof urls.logs === 'undefined') {
                                alert("logs is undefined: " + typeof urls.logs === 'undefined' + ", press ok to continue without logs.");
                            } else {
                                // Load logs data
                                d3.json(directory + urls.logs).then(function (logData) {

                                    // Setup logs
                                    sequencer.setLogs(logData);
                                    
                                    // Setup log sequence
                                    sequencer.logSequence();

                                    // Init logs
                                    // startLogs(sequencer.logs[0]["TransformList"], sequencer.logBox);

                                    // let logHandler = new LogHandler(sequencer.logBox);
                                    // logHandler.init();
                                    // animate();
                                    // console.log(sequencer.logs)
                                    // logHandler.setupMeshes(sequencer.logs[0]["TransformList"]);
                                    // logHandler.animate(logHandler);
                                    // function animate() {
                                    //     requestAnimationFrame( animate );
                                    //     logHandler.render();

                                    // }

                                    if( !init(sequencer.logBox) )	animate();
                                    setupMeshes(sequencer.logs[0]["TransformList"])                                   
    

                                }).catch(function (error) {
                                    // alert("Failed to load log data, see console");
                                    console.log(error);
                                });
                            }

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

            // Directory and file location information
            let directory = "/data/"
            let urls = {
                "video": "[14.13654]SonificationResearch2_2021-01-20_18-51-09_2468x2740.mp4",
                "answers": "20210120SonificationResearch2.json",
                "questions": "SonificationQuestionnaire.json",
                "logs": "SonificationResearch2log.json"
            };


