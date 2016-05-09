var plotter = {};

(function(){
    //function removeConstPrefixSuffix(arr) {
    //    TODO:
    //}
    
    plotter.guessColumnTypes = function(data) {
        var columnNames = Object.keys(data[0]);
        // Sort for consistency, sadly with JS there's no way we can get
        // ordering out of JSON web APIs
        columnNames.sort();
        var columnTypes = [];
        var numericColumns = [];
        for(var i = 0; i < columnNames.length; i++) {
            var cname = columnNames[i];
            var uniques = d3.map(data, function (d) { return d[cname] });
            var uniqueCount = uniques.size();
            var isNumeric = gfilter.isNumericArray(uniques.keys())
            if(isNumeric)
                numericColumns.push(cname);
            var typeInfo = {
                name: cname,
                isNumeric: isNumeric,
                unqiues: uniques
            };
            columnTypes.push(typeInfo);
        }
        return {
            types: columnTypes,
            numericColumns: numericColumns
        };
    }

    function removeFromArray(arr, item) {
        // http://stackoverflow.com/questions/9792927/javascript-array-search-and-remove-string
        var index = arr.indexOf(item);    // <-- Not supported in <IE9
        if (index !== -1) {
            arr.splice(index, 1);
        }
    }
    
    plotter.show = function(rootElement, allRows, xprop, lineTypeProp) {
        var columnsInfo = plotter.guessColumnTypes(allRows);
        console.log(columnsInfo);
        //console.log(allRows);

        var x = [];
        var ySeq = [];
        var xtitle = undefined;
        var ytitle = undefined;
        if(xprop) {
            xtitle = xprop;
            removeFromArray(columnsInfo.numericColumns, xprop);
            for (var i = 0; i < allRows.length; i++) {
                row = allRows[i];
                x.push( row[xprop] );
                
                // TODO: y.push
            }
        } else {
            if(columnsInfo.numericColumns.length == 1) {
                xtitle = 'Row index';
                for (var i = 0; i < allRows.length; i++) {
                    x.push(i);
                }
            }
        }
        
        // traces = [{x: x, y:y1}, {x: x, y: y2}];
        var tracesList = [];
        
        for(var colIndex = 0; colIndex < columnsInfo.numericColumns.length; colIndex++) {
            var cname = columnsInfo.numericColumns[colIndex];
            ytitle = cname;
            var yVals = [];
            tracesList.push({
                name: cname,
                x: x,
                y: yVals,
            });
            for (var rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
                yVals.push(allRows[rowIndex][cname]);
            }
        }
        
        var plotDiv = document.getElementById("plot");
        var div = document.createElement("div");
        div.id = "myplotyo";
        div.className = "plot";
        rootElement.appendChild(div);
        var layout = {
            //title: 'Plotting CSV data from AJAX call',
            yaxis: {
                title: ytitle
            },
            xaxis: {
                title: xtitle
            }
        };
        Plotly.newPlot(div, tracesList, layout);
        logStatus("");
        mainDone();
    };
})();