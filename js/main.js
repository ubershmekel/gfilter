
var yearRingChart   = dc.pieChart("#chart-ring-year"),
    spendHistChart  = dc.barChart("#chart-hist-spend"),
    spenderRowChart = dc.rowChart("#chart-row-spenders");

// use static or load via d3.csv("spendData.csv", function(error, spendData) {/* do stuff */});
var spendDatax = [
    {Name: 'Mr A', Spent: '$40', Year: 2011},
    {Name: 'Mr B', Spent: '$10', Year: 2011},
    {Name: 'Mr C', Spent: '$40', Year: 2011},
    {Name: 'Mr A', Spent: '$70', Year: 2012},
    {Name: 'Mr B', Spent: '$20', Year: 2012},
    {Name: 'Mr B', Spent: '$50', Year: 2013},
    {Name: 'Mr C', Spent: '$30', Year: 2013}
];

// set crossfilter
var main = function(spendData) {
    // normalize/parse data
    spendData.forEach(function(d) {
        d.Spent = d.Spent.match(/\d+/);
    });
    var ndx = crossfilter(spendData),
        yearDim  = ndx.dimension(function(d) {return +d.Year;}),
        spendDim = ndx.dimension(function(d) {return Math.floor(d.Spent/10);}),
        nameDim  = ndx.dimension(function(d) {return d.Name;}),
        spendPerYear = yearDim.group().reduceSum(function(d) {return +d.Spent;}),
        spendPerName = nameDim.group().reduceSum(function(d) {return +d.Spent;}),
        spendHist    = spendDim.group().reduceCount();

    setTimeout(function() {
        console.log('hey ' + ndx.size());
        ndx.add([{Name: 'Mr B', Spent: '$120'.match(/\d+/), Year: 2014}]);
        console.log('hey ' + ndx.size());
        dc.redrawAll();
    }, 5000);
        
    yearRingChart
        .width(200).height(200)
        .dimension(yearDim)
        .group(spendPerYear)
        .innerRadius(50);

    spendHistChart
        .width(300).height(200)
        .dimension(spendDim)
        .group(spendHist)
        .x(d3.scale.linear().domain([0,15]))
        .elasticY(true);

    spendHistChart.xAxis().tickFormat(function(d) {return d*10}); // convert back to base unit
    spendHistChart.yAxis().ticks(2);

    spenderRowChart
        .width(350).height(200)
        .dimension(nameDim)
        .group(spendPerName)
        .elasticX(true);

    dc.renderAll();
}

d3.csv("js/spent.csv", function(error, spendData) {
    if(error)
        alert(error);
    main(spendData);
});