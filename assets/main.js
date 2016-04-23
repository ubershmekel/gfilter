// The main function to set up the git hub page demo.
// See the `gfilter` invocation.
(function () {
    ////////////////////////////////////////////////////////////////////////////
    // Drag and drop file handling
    // To avoid this from happening - remove the element with the id "gfilterDropFiles" from the html
    ////////////////////////////////////////////////////////////////////////////
    var dropperFileInput = d3.select("#gfilterDropFiles");
    var dropperSelect = d3.select(window);
    var dropperViz = d3.select("#dropzone");
    var uiUpdateTitle = function(title) {
        d3.select("#fileName").text(" - " + title);
    }
    var uiFileHover = function() {
        dropperViz.classed("active", true);
    };
    var uiEndFileHover = function() {
        dropperViz.classed("active", false);
    };
    var readFiles = function (files) {
        var dataArray = files[0].data;
        uiUpdateTitle(files[0].name);
        gfilter(dataArray, document.body);
    };
    var dropper = dropperSelect
        .call(dnd.dropper()
            .on("dragover", uiFileHover)
            .on("drop", uiEndFileHover)
            .on("read", readFiles)
            );
    
    dropperFileInput.on("change", function() {
        var file = this.files[0];
        dnd.read(file, function(error, data) {
            file.data = data;
            readFiles([file]);
        });
    });
    
    window.addEventListener("dragleave", function (e) {
        dropperViz.classed("active", false);
    });




    ////////////////////////////////////////////////////////////////////////////
    // GET "dl=" parameter to present a csv file
    ////////////////////////////////////////////////////////////////////////////
    function getParameters() {
        var prmstr = window.location.search.substr(1);
        return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
    }

    function transformToAssocArray(prmstr) {
        var params = {};
        var prmarr = prmstr.split("&");
        for (var i = 0; i < prmarr.length; i++) {
            var pairs = prmarr[i].split("=");
            params[pairs[0]] = decodeURIComponent(pairs[1]);
        }
        return params;
    }

    function handleUrlData() {
        var params = getParameters();
        var downloadUrl = params['dl'];
        var preProcessCode = params['pre'];
        var type = params['type'];
        if (downloadUrl) {
            var dotLoc = downloadUrl.lastIndexOf('.');
            var extension = null;
            if(dotLoc != -1)
                extension = downloadUrl.substring(dotLoc);
            if(extension === '.json' || type === 'json') {
                d3.json(downloadUrl, function(data) {
                    if(preProcessCode)
                        eval(preProcessCode);
                    gfilter(data, document.body);
                });
            } else {
                d3.csv(downloadUrl, function (rows) {
                    gfilter(rows, document.body);
                });
            }
        }
    }
    
    handleUrlData();
})();