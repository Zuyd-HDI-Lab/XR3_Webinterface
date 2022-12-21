function fileExists(url) {
    if(url){
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        req.send();
        return req.status==200;
    } else return false;
}

function openCSVFiles(partIDList){
    fileList = []
    partIDList.forEach(function(partId){
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

const createCombinedFile = function(partIDList){
//    var file1 = "/data/001/S001/complete_trial_results.csv";
//    var file2 = "/data/002/S001/complete_trial_results.csv";;
    var combinedData = [];
    var outputStr = ""

    var fileList = openCSVFiles(partIDList);
    console.log(fileList)
    Promise.all(fileList/*.map(d3.csv)*/).then(function(files) {
        console.log(files)
        files.forEach(element => {
            console.log("File: ", element)
            combinedData = combinedData.concat(element);
        });
        //console.log("CombinedData: ", combinedData)
        
        var output = [];
        combinedData.forEach(element => {
            output.push(csvmaker(element, output.length==0))
        });
        
        outputStr = output.join("\n")
        //var output = csvmaker(fileData3)
        return downloadCSV(outputStr);

    }).catch(function(err) {
        console.log(err);
    })
    //return outputStr;
}

const csvmaker = function(data, includeHeader=false) {
    // Empty array for storing the values
    csvRows = []; 
    // Headers is basically a keys of an object which is id, name, and profession
    const headers = Object.keys(data);
    // As for making csv format, headers must be separated by comma and pushing it into array
    if (includeHeader){
        csvRows.push(headers.join(','));
    }
    //console.log(csvRows)
    var values = [];
    var tmpArr = Object.values(data);
    tmpArr.forEach(element => {
        values.push(element.replace(',',':'))
        //if (element.contains(",")){}
        //console.log(element.replace(',',':'))
    });
    // Pushing Object values into array with comma separation
    csvRows.push(values.join(','))
 
    // Returning the array joining with new line
    //console.log(csvRows.join('\n'))
    return csvRows.join('\n')
}

const downloadCSV = function (data) {
    console.log("download ", data)
    // Creating a Blob for having a csv file format
    // and passing the data with type
    const blob = new Blob([data], { type: 'text/csv' });
    // Creating an object for downloading url
    const url = window.URL.createObjectURL(blob)
 
    // Creating an anchor(a) tag of HTML
    const a = document.createElement('a')
 
    // Passing the blob downloading url
    a.setAttribute('href', url)
 
    // Setting the anchor tag attribute for downloading
    // and passing the download file name
    a.setAttribute('download', 'download.csv');
 
    // Performing a download with click
    a.click()
}

/*
const get = async function () {
 
    // JavaScript object
    const data = {
        id: 1,
        name: "Geeks",
        profession: "developer"
    }
 
    const csvdata = csvmaker(data);
    download(csvdata);
}*/
