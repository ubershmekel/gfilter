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

    }

    var complaintsDiv = addDiv("complaints");
    var params = Object.keys(data[0]);
    var ndx = crossfilter(data);
    gfilter.crossfilter = ndx;

    var failedColumns = [];

    for (var i = 0; i < params.length; i++) {
        var propName = params[i];
        var chartId = "chart-hist-" + propName;
        var chartDiv = addDiv(chartId);

        var uniques = d3.map(data, function (d) { return d[propName] });
        if (isNumeric(data[0][propName])) {
            addText(propName, chartDiv, "chartTitle");
            var barChart = dc.barChart("#" + chartId);

            var minMax = d3.extent(data, function (d) { return +d[propName] });
            var min = +minMax[0];
            var max = +minMax[1];
            var dimNumeric = ndx.dimension(function (d) { return +d[propName]; });
            var countGroup;
            if(uniques.size() < 10) {
                countGroup = dimNumeric.group().reduceCount();
            } else {
                // avoid very thin lines and a barcode-like histogram
                var sections = 30;
                var span = max - min;
                countGroup = dimNumeric.group(function (d) { return min + span * Math.floor(sections * (d - min) / span) / sections; });
                barChart.xUnits(function(){return sections;});
            }

            //Can't use .xAxisLabel because rowChart have no equivalent - .xAxisLabel(propName)
            barChart
                .width(gfilter.width).height(gfilter.height)
                .dimension(dimNumeric)
                .group(countGroup)
                .x(d3.scale.linear().domain([min, max]).rangeRound([0, 500]))
                //.x(d3.scale.linear().range([100, 0]))
                .elasticY(true);
            barChart.yAxis().ticks(2);
        } else {
            // arbitrary amount that looks ok on the rowChart
            if (1 < uniques.size() && uniques.size() < 21) {
                addText(propName, chartDiv, "chartTitle");
                var dim = ndx.dimension(function (d) { return d[propName]; });
                var group = dim.group().reduceCount();
                var rowChart = dc.rowChart("#" + chartId);
                rowChart
                    .width(gfilter.width).height(gfilter.height)
                    .dimension(dim)
                    .group(group)
                    .elasticX(true);
            } else {
                failedColumns.push(propName);
            }
        }
    }

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
    var dropperSelect = d3.select("#gfilterDropFiles");
    var isDefaultSetup = dropperSelect.length == 1;
    var dropper = dropperSelect
        .call(dnd.dropper()
            .on("dragover", function () {
                dropper.classed("active", true);
            })
            .on("drop", function () {
                dropper.classed("active", false);
            })
            .on("read", function (files) {
                var dataArray = files[0].data;
                gfilter(dataArray, document.body);
            }));

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

