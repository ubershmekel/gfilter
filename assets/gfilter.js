var gfilter = function(data) {
    gfilter.removeAll();
    gfilter.draw(data);
};

gfilter.className = "gfilter";

gfilter.removeAll = function() {
    // remove old
    d3.selectAll("." + gfilter.className).remove();
}

gfilter.addData = function(data) {
    gfilter.crossfilter.add(rows);
    dc.redrawAll();
}

gfilter.draw = function(spendData) {
    var isNumeric = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    var addGraph = function (id) {
        var div = document.createElement("div");
        div.id = id;
        div.className = gfilter.className;
        document.body.appendChild(div);
    }
    
    var params = Object.keys(spendData[0]);
    var charts = [];
    var ndx = crossfilter(spendData);
    gfilter.crossfilter = ndx;
    for (var i = 0; i < params.length; i++) {
        var propName = params[i];
        var chartId = "chart-hist-" + propName;
        addGraph(chartId);
        if (isNumeric(spendData[0][propName])) {
            var theChart = dc.barChart("#" + chartId);
            charts.push(theChart);

            var dim = ndx.dimension(function (d) { return d[propName]; });
            //var spendPerName = dim.group().reduceSum(function(d) {return d[propName];});
            var spendPerName = dim.group().reduceCount();
            var minMax = d3.extent(spendData, function (d) { return +d[propName] });
            var min = +minMax[0];
            var max = +minMax[1];
            theChart
                .xAxisLabel(propName)
                .width(500).height(300)
                .dimension(dim)
                .group(spendPerName)
                .x(d3.scale.linear().domain([min, max]))
                .elasticY(true);
            theChart.yAxis().ticks(2);
        }
    }

    dc.renderAll();
};

(function () {
    ////////////////////////////////////////////////////////////////////////////
    // Drag and drop file handling
    // To avoid this from happening - don't have an element with the id "gfilterDropFiles"
    ////////////////////////////////////////////////////////////////////////////
    var dropper = d3.select("#gfilterDropFiles")
        .call(dnd.dropper()
            .on("dragover", function () {
                dropper.classed("active", true);
            })
            .on("drop", function () {
                dropper.classed("active", false);
            })
            .on("read", function (files) {
                var dataArray = files[0].data;
                if(dataArray === undefined)
                    // page refresh after a file was dropped
                    return;
                gfilter(dataArray);
            }));
})();


