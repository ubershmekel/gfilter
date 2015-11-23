/* global dc */
/* global crossfilter */
var gfilter = function (data, rootElement) {
    gfilter.removeAll();
    gfilter.init(data, rootElement);
};

gfilter.className = "gfilter";
gfilter.width = 500;
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

    var complaintsDiv = addDiv("complaints");
    var params = Object.keys(data[0]);
    var ndx = crossfilter(data);
    gfilter.crossfilter = ndx;

    var failedColumns = [];

    for (var i = 0; i < params.length; i++) {
        var propName = params[i];
        var chartId = "chart-hist-" + propName;
        var chartDiv = addDiv(chartId);
        var dim = ndx.dimension(function (d) { return d[propName]; });

        if (isNumeric(data[0][propName])) {
            var theChart = dc.barChart("#" + chartId);

            var countGroup = dim.group().reduceCount();
            var minMax = d3.extent(data, function (d) { return +d[propName] });
            var min = +minMax[0];
            var max = +minMax[1];
            theChart
                //Can't use xAxisLabel because rowChart have no equivalent - .xAxisLabel(propName)
                .width(gfilter.width).height(gfilter.height)
                .dimension(dim)
                .group(countGroup)
                .x(d3.scale.linear().domain([min, max]))
                .elasticY(true);
            theChart.yAxis().ticks(2);
            addText(propName, chartDiv, "chartTitle");
        } else {
            var uniques = d3.map(data, function (d) { return d[propName] });
            // arbitrary amount that looks ok on the rowChart
            if (1 < uniques.size() && uniques.size() < 21) {
                var group = dim.group().reduceCount();
                var theChart = dc.rowChart("#" + chartId);
                theChart
                    .width(gfilter.width).height(gfilter.height)
                    .dimension(dim)
                    .group(group)
                    .elasticX(true);
                addText(propName, chartDiv, "chartTitle");
            } else {
                failedColumns.push(propName);
            }
        }
    }

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
    
    function transformToAssocArray( prmstr ) {
        var params = {};
        var prmarr = prmstr.split("&");
        for ( var i = 0; i < prmarr.length; i++) {
            var tmparr = prmarr[i].split("=");
            params[tmparr[0]] = tmparr[1];
        }
        return params;
    }
    
    var params = getParameters();
    if(isDefaultSetup && params['dl']) {
        d3.csv(params['dl'], function(rows) {
            gfilter(rows, document.body);
        });
    }

})();


