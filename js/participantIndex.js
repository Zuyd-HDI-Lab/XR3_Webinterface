function fileExists(url) {
    if(url){
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        req.send();
        return req.status==200;
    } else return false;
}
//var partInfo = createPartInfo(partlist);

function createFileList(){
    fileList = []
    partlist.forEach(function(partId){
        if (fileExists("/data/"+partId+"/S001/complete_trial_results.csv")){
            fileList.push(d3.csv("/data/"+partId+"/S001/complete_trial_results.csv"))
        }
    });
    return fileList;
}

function createPartInfo(part_details){
    var partInfoList = [["Project", "Participant ID", "Session ID", "Date", "Total time","Download"]];

    part_details.forEach(element => {
        if (element.length > 0){   
            var tmpPart = [];
            var projectName = "Unknown";
            tmpPart.push(element[0].experiment);
            tmpPart.push(element[0].ppid.toString().padStart(3, "0"));
            tmpPart.push(element[0].session_num);
            tmpPart.push(element[0].date);
            var totalTime = parseFloat(element[element.length-1].end_time - element[0].start_time).toFixed(2) +" sec"
            tmpPart.push(totalTime);
            partInfoList.push(tmpPart)
        }
    });
    return(partInfoList);
}