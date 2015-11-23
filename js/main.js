var className = "gfilter"

var addGraph = function (id) {
    var div = document.createElement("div");
    div.id = id;
    div.className = className;
    document.body.appendChild(div);
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// set crossfilter
var main = function (spendData) {
    // remove old
    d3.selectAll("." + className).remove();
    
    var params = Object.keys(spendData[0]);
    var charts = [];
    var ndx = crossfilter(spendData);
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
    var addData = function (rows) {
        console.log('hey ' + ndx.size());
        ndx.add(rows);
        console.log('hey ' + ndx.size());
        dc.redrawAll();
    }

    dc.renderAll();
    return addData;
}


////////////////////////////////////////////////////////////////////////////
// Drag and drop file handling
////////////////////////////////////////////////////////////////////////////
var dropper = d3.select("#dropFiles")
    .call(dnd.dropper()
        .on("dragover", function () {
            dropper.classed("active", true);
        })
        .on("drop", function () {
            dropper.classed("active", false);
        })
        .on("read", function (files) {
            // files[0].data is an array
            main(files[0].data)
        }));

/*function handleFile(file) {
    var reader = new FileReader();
    reader.onloadend = function(data) {
        //return main(data);
        d3.csv(data, main);
    };
    // readAsText
    reader.readAsDataURL(file);
}

var tooManyFilesError = function() {
    alert('Please drop just one file - only the first one will be handled');
}

var dropFiles = document.getElementById('dropFiles');
dropFiles.ondrop = function (e) {
    //this.className = '';
    console.log('hello');
    e.preventDefault();
    if(e.dataTransfer.files.length > 1)
        return tooManyFilesError();
    handleFile(e.dataTransfer.files[0]);
} */

//d3.csv("data/TechCrunchcontinentalUSA.csv", function(error, spendData) {
//d3.csv("data/Sacramentorealestatetransactions.csv", function(error, spendData) {
//d3.csv("data/SacramentocrimeJanuary2006.csv", function(error, spendData) {
//d3.csv("data/other.csv", function(error, spendData) {
/*    if(error)
        alert(error);
    main(spendData);
});*/