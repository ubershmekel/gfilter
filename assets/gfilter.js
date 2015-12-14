/* global dc */
/* global dnd */
/* global crossfilter */
var gfilter = function (data, rootElement) {
    gfilter.removeAll();
    gfilter.init(data, rootElement);
};

gfilter.className = "gfilter";
gfilter.width = 470;
gfilter.height = 300;

gfilter.removeAll = function () {
    // remove old
    d3.selectAll("." + gfilter.className).remove();
};

gfilter.addData = function (data) {
    gfilter.crossfilter.add(data);
    dc.redrawAll();
};

gfilter.init = function (data, rootElement) {
    var isNumeric = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    var addDiv = function (id) {
        var div = document.createElement("div");
        div.id = id;
        div.className = gfilter.className;
        rootElement.appendChild(div);
        return div;
    }

    var addText = function (text, parentDiv, cls) {
        var textNode = document.createTextNode(text);
        var line = document.createElement("div");
        line.className = cls;
        line.appendChild(textNode);
        parentDiv.appendChild(line);
    }

    var createDataWidget = function () {
        var dataTableId = "dataTable";
        var tableDiv = addDiv(dataTableId);
        d3.select(tableDiv).classed("table", true);
        var table = dc.dataTable("#" + dataTableId);
        //var table = dc.dataTable(".dc-data-table");
        var getFirstParam = function (d) {
            return d[params[0]];
        };
        var tableDim = ndx.dimension(getFirstParam);

        table
            .width(800)
            .height(600)
            .dimension(tableDim)
            .group(getFirstParam)
            .showGroups(false)
            .size(10)
            .columns(params)
    };
    
    var isNumericArray = function(seq) {
        for(var i = 0; i < seq.length; i++) {
            if(isNumeric(seq[i]))
                return true;
        }
    };

    var complaintsDiv = addDiv("complaints");
    var params = Object.keys(data[0]);
    var ndx = crossfilter(data);
    gfilter.crossfilter = ndx;
    gfilter.dimensions = {};

    var failedColumns = [];
    
    var createRowCounter = function() {
        var rowCounterId = 'rowCounter'
        addDiv(rowCounterId);
        var rowCounter = dc.dataCount('#' + rowCounterId);
        rowCounter
            .dimension(ndx)
            .group(ndx.groupAll())
            .html({
                some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                    ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
                all: 'All <strong>%total-count</strong> records shown. Click on the graphs to apply filters.'
        });;
    }

    var createHistogram = function (propName) {
        addText(propName, chartDiv, "chartTitle");
        var barChart = dc.barChart("#" + chartId);

        var numericValue = function (d) {
            if (d[propName] === "")
                return NaN;
            else
                return +d[propName];
        };
        var minMax = d3.extent(data, numericValue);
        var min = minMax[0];
        var max = minMax[1];
        var span = max - min;
        numericValue = function (d) {
            if (d[propName] === "")
                // I want to return NaN here but that appears for some reason in a middle bar
                // so this way I ensure it's outside of the domain of any chart.
                return min - max;
            else
                return +d[propName];
        };
        var dimNumeric = ndx.dimension(numericValue);
        gfilter.dimensions[propName] = dimNumeric;
        var countGroup;
        var lastBarSize = 0;
        var barCount = 30;
        if (5 < span && span < 60) {
            // Do not do 30 bins when you only have 10 distinct values.
            // I'm not sure if this is the right thing to do. 
            //barCount = Math.ceil(span);
        }
        
        // avoid very thin lines and a barcode-like histogram
        lastBarSize = span / barCount;
        var roundToHistogramBar = function (d) {
            if (isNaN(d) || d === "")
                d = NaN;
            if (d == max)
                // This fix avoids the max value always being in its own bin (max).
                // I should figure out how to make the grouping equation better and avoid this hack. 
                d = max - lastBarSize;
            var res = min + span * Math.floor(barCount * (d - min) / span) / barCount;
            return res;
        };
        countGroup = dimNumeric.group(roundToHistogramBar);
        gfilter.group = countGroup;
        barChart.xUnits(function () { return barCount; });

        //Can't use .xAxisLabel because rowChart have no equivalent - .xAxisLabel(propName)
        barChart
            .width(gfilter.width).height(gfilter.height)
            .dimension(dimNumeric)
            .group(countGroup)
            .x(d3.scale.linear().domain([min - lastBarSize, max + lastBarSize]).rangeRound([0, 500]))
        //.x(d3.scale.linear().range([100, 0]))
            .elasticY(true);
        barChart.yAxis().ticks(2);
    }

    var createRowChart = function (propName) {
        addText(propName, chartDiv, "chartTitle");
        var dim = ndx.dimension(function (d) { return d[propName]; });
        var group = dim.group().reduceCount();
        var rowChart = dc.rowChart("#" + chartId);
        rowChart
            .width(gfilter.width).height(gfilter.height)
            .dimension(dim)
            .group(group)
            .elasticX(true);
    }

    for (var i = 0; i < params.length; i++) {
        var propName = params[i];
        var chartId = "chart-hist-" + propName;
        var chartDiv = addDiv(chartId);

        var uniques = d3.map(data, function (d) { return d[propName] });
        var uniqueCount = uniques.size();
        if (uniqueCount < 2) {
            // Just one value is not interesting to visualize 
            failedColumns.push(propName);
            continue;
        } else if (uniqueCount < 6) {
            // arbitrary amount that feels better to click on than to drag filter
            createRowChart(propName);
        //} else if (isNumeric(data[0][propName])) {
        } else if (isNumericArray(uniques.keys())) {
            // Numerical data is shown in histograms
            createHistogram(propName);
        } else if (uniqueCount < 21) {
            // arbitrary amount that looks ok on the rowChart
            createRowChart(propName);
        } else {
            failedColumns.push(propName);
        }
    }

    createRowCounter();
    createDataWidget();

    if (failedColumns.length > 0)
        addText("Did not create chart for the columns: " + failedColumns.join(", "), complaintsDiv, "complaint");

    dc.renderAll();
};

(function () {
    ////////////////////////////////////////////////////////////////////////////
    // Drag and drop file handling
    // To avoid this from happening - don't have an element with the id "gfilterDropFiles"
    ////////////////////////////////////////////////////////////////////////////
    var dropperFileInput = d3.select("#gfilterDropFiles");
    var dropperSelect = d3.select(window);
    var dropperViz = d3.select("#dropzone");
    var isDefaultSetup = dropperSelect.length == 1;
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




    function getParameters() {
        var prmstr = window.location.search.substr(1);
        return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
    }

    function transformToAssocArray(prmstr) {
        var params = {};
        var prmarr = prmstr.split("&");
        for (var i = 0; i < prmarr.length; i++) {
            var tmparr = prmarr[i].split("=");
            params[tmparr[0]] = tmparr[1];
        }
        return params;
    }

    var params = getParameters();
    if (isDefaultSetup && params['dl']) {
        d3.csv(params['dl'], function (rows) {
            gfilter(rows, document.body);
        });
    }

})();

