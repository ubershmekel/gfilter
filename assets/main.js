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
        if (prmstr != null && prmstr != "") {
            if (prmstr.indexOf(':::') === -1)
                return transformToAssocArray(prmstr, "&", "=");
            else
                // Special characters that I've never seen in a url or js code
                // so I can more easily link to websites and include preprocessing code
                return transformToAssocArray(prmstr, "...", ":::");
        } else {
            return {};
        }
    }

    function transformToAssocArray(prmstr, enderStr, equalStr) {
        var params = {};
        var prmarr = prmstr.split(enderStr);
        for (var i = 0; i < prmarr.length; i++) {
            var pairs = prmarr[i].split(equalStr);
            params[pairs[0]] = decodeURIComponent(pairs[1]);
        }
        return params;
    }
    
    function error(line) {
        humane.error(line);
        console.error(line);
    }
    
    function main() {
        var params = getParameters();
        var downloadUrl = params['dl'];
        var preProcessCode = params['pre'];
        var type = params['type'];
        var vizType = params['viz'];
        var xprop = params['xprop'];
        var lineTypeProp = params['linetypeprop'];
        
        function handleData(data) {
            if(preProcessCode) {
                eval(preProcessCode);
            }
            if(data == null) {
                error("Failed to fetch CSV url");
                return;
            }
            if(!data.length) {
                error("Empty or invalid CSV from url");
                return;
            }
            var rootElement = document.body;
            switch(vizType) {
                case "plot":
                    // remove help header, I'm not sure if I want to do this at all now.
                    //d3.selectAll('#tutorialsInHeader').remove();

                    plotter.show(rootElement, data, xprop, lineTypeProp)
                    break;
                case "gfilter":
                default:
                    gfilter(data, rootElement);
                    break;
            }
        }

        if (downloadUrl) {
            var dotLoc = downloadUrl.lastIndexOf('.');
            var extension = null;
            if(dotLoc != -1)
                extension = downloadUrl.substring(dotLoc);
            if(extension === '.json' || type === 'json') {
                d3.json(downloadUrl, handleData);
            } else {
                d3.csv(downloadUrl, handleData);
            }
        }
    }
    
    main();
})();