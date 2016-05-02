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

gfilter.humanizePercent = function(x) {
    // http://stackoverflow.com/questions/661562/how-to-format-a-float-in-javascript/29249277#29249277
    // For displaying percents to humans this should behave like so:
    return x.toFixed(2).replace(/\.?0*$/,'');
}

gfilter.isNumeric = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
    
gfilter.isNumericArray = function(seq) {
    for(var i = 0; i < seq.length; i++) {
        if(gfilter.isNumeric(seq[i]))
            return true;
    }
};

gfilter.init = function (data, rootElement) {
    var parseDate = function(obj) {
        var iso = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
        return iso.parse(obj);
    };
    
    var isDate = function(obj) {
        return parseDate(obj) != null;
    };

    var addDiv = function (id) {
        var div = document.createElement("div");
        div.id = id;
        div.className = gfilter.className;
        rootElement.appendChild(div);
        
        return div;
    }

    function createFilterDiv(div) {
        var controls = document.createElement("div");
        controls.className = 'filter';
        div.appendChild(controls);
    }
    
    function createChartDiv(propName) {
        // Spaces confuse query selectors. This escaping prevents:
        // Uncaught SyntaxError: Failed to execute 'querySelector' on 'Document': '#chart-hist-Running Bal.' is not a valid selector.
        var escapedName = propName.replace(' ', '').replace('.', '');
        var chartId = "chart-hist-" + escapedName;
        var chartDiv = addDiv(chartId);
        createFilterDiv(chartDiv);
        return chartDiv;
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
    
    var complaintsDiv = addDiv("complaints");
    var params = Object.keys(data[0]);
    var ndx = crossfilter(data);
    gfilter.crossfilter = ndx;
    gfilter.dimensions = {};

    var failedColumns = [];
    var createRowCounter = function() {
    
        var rowCounterId = 'rowCounter'
        addDiv(rowCounterId);
        var rowCounter = dc.numberDisplay ('#' + rowCounterId);
        rowCounter
            .dimension(ndx)
            .group(ndx.groupAll())
            .formatNumber(function() {
                var selectedCount = rowCounter.group().value();
                var total = rowCounter.dimension().size();
                if(selectedCount == total) {
                    return 'All <strong>' + total + '</strong> records shown. Click on the graphs to apply filters.'
                }
                var resetButton = '<a href="javascript:dc.filterAll(); dc.renderAll();">Reset All</a>';
                var percent = gfilter.humanizePercent(100 * selectedCount / total);
                return 'Selected ' + percent + '% (' + selectedCount + ' out of ' + total + ' records) | ' + resetButton;
        });
    }

    var createDateHistogram = function (propName) {
        var chartDiv = createChartDiv(propName);
        addText(propName, chartDiv, "chartTitle");
        data.forEach(function (d) {
            d[propName] = parseDate(d[propName]);
        });
        var valueFunc = function(d) {
            return d[propName];
        };
        var minMax = d3.extent(data, valueFunc);
        var min = minMax[0];
        var max = minMax[1];
        var span = max - min;

        var lastBarSize = 0;
        var barCount = 30;

        // avoid very thin lines and a barcode-like histogram
        lastBarSize = span / barCount;
        var roundToHistogramBar = function (d) {
            if (isNaN(d) || d === "")
                d = NaN;
            if (d == max)
                // This fix avoids the max value always being in its own bin (max).
                // I should figure out how to make the grouping equation better and avoid this hack. 
                d = max - lastBarSize;
            var res = new Date(min.getTime() + span * Math.floor(barCount * (d - min) / span) / barCount);
            return res;
        };

        var dimDate = ndx.dimension(valueFunc);
        var barChart = dc.barChart(chartDiv);
        barChart
            .width(gfilter.width).height(gfilter.height)
            .controlsUseVisibility(true)
            .dimension(dimDate)
            .group(dimDate.group(roundToHistogramBar))
            //.group(dimDate.group().reduceCount())
            .x(d3.time.scale.utc().domain([min, max]))
            .elasticY(true)
            .yAxis().ticks(2);
        barChart.xUnits(function () { return barCount; })
    };
        
    var createHistogram = function (propName) {
        var chartDiv = createChartDiv(propName);
        addText(propName, chartDiv, "chartTitle");
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
        var barChart = dc.barChart(chartDiv);
        barChart.xUnits(function () { return barCount; });

        //Can't use .xAxisLabel because rowChart have no equivalent - .xAxisLabel(propName)
        barChart
            .width(gfilter.width).height(gfilter.height)
            .dimension(dimNumeric)
            .group(countGroup)
            .x(d3.scale.linear().domain([min - lastBarSize, max + lastBarSize]).rangeRound([0, 500]))
        //.x(d3.scale.linear().range([100, 0]))
            .elasticY(true)
            .controlsUseVisibility(true);
        barChart.yAxis().ticks(2);
    }

    var createRowChart = function (propName) {
        var chartDiv = createChartDiv(propName);
        addText(propName, chartDiv, "chartTitle");
        var dim = ndx.dimension(function (d) {
            // toString here because `undefined` can cause crossfilter to crash Chrome/FF with out of memory.
            // https://github.com/square/crossfilter/issues/133
            // https://github.com/square/crossfilter/wiki/API-Reference#dimension
            return "" + d[propName];
        });
        var group = dim.group().reduceCount();
        var rowChart = dc.rowChart(chartDiv);
        rowChart
            .width(gfilter.width).height(gfilter.height)
            .controlsUseVisibility(true)
            .dimension(dim)
            .group(group)
            .elasticX(true);
    }
    
    function analyzeAndShowColumns() {
        var allowedTypes = ["boolean", "number", "string"];
        for (var i = 0; i < params.length; i++) {
            var propName = params[i];

            var propFirstType = typeof data[0][propName];
            if (allowedTypes.indexOf(propFirstType) === -1) {
                // type not supported
                failedColumns.push(propName);
                continue;
            }

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
            } else if (gfilter.isNumericArray(uniques.keys())) {
                // Numerical data is shown in histograms
                createHistogram(propName);
            } else if (uniqueCount < 21) {
                // arbitrary amount that looks ok on the rowChart
                createRowChart(propName);
            } else if (isDate(data[0][propName])) {
                createDateHistogram(propName);
            } else {
                failedColumns.push(propName);
            }
        }
    }

    function main() {
        analyzeAndShowColumns();
        createRowCounter();
        createDataWidget();

        if (failedColumns.length > 0)
            addText("Did not create chart for the columns: " + failedColumns.join(", "), complaintsDiv, "complaint");

        dc.renderAll();
    }
    
    main();
};


