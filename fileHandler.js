function readFile(){
    var file = document.getElementById('file').files[0];
    if (file){
      
        var reader = new FileReader();
        reader.readAsText(file, "");

        reader.onload = function(evt){
            var fileContents = evt.target.result;
            parseCSV(fileContents);
        }
    }
    else {
        // Check if some item from the list was selected
        $('#instanceList').val();
    }

}

/* Parse the .csv file containing lat; long; population; */
function parseCSV(fileContents){
    
    var lines = fileContents.split('\n');
    for(var i = 0; i < lines.length; i++){
        $('#results').html(lines[i]);

        // Split line into non-empty cells
        var data = $.grep(lines[i].split(';'), function(x){
            return x;
        });

        if(data.length == 3){
            LoadFile(data[0], data[1], data[2]);
        }
    }
    FirstInit(1.0);
    $('#results').html(lines.length);
}

