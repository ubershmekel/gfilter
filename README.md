# gfilter
A cross filter dashboard that can handle any csv you throw at it.

# Demo
https://ubershmekel.github.io/gfilter/

# Example Data

* https://ubershmekel.github.io/gfilter/?dl=testData/TechCrunchcontinentalUSA.csv
* https://ubershmekel.github.io/gfilter/?dl=testData/spent.csv
* https://ubershmekel.github.io/gfilter/?dl=testData/flights.csv
* https://ubershmekel.github.io/gfilter/?dl=testData/Sacramentorealestatetransactions.csv
* https://ubershmekel.github.io/gfilter/?dl=testData/SacramentocrimeJanuary2006.csv
* https://ubershmekel.github.io/gfilter/?dl=https://www.reddit.com/r/all.json&pre=data%3Ddata.data.children.map(function(v){return%20v.data})
* https://ubershmekel.github.io/gfilter/?dl=https://api.twitch.tv/kraken/streams&type=json&pre=data%3Ddata.streams
* https://ubershmekel.github.io/gfilter/?dl=https://api.twitch.tv/kraken/games/top.json&pre=data%3Ddata.top
* https://ubershmekel.github.io/gfilter/?dl:::https://api.twitch.tv/kraken/streams...type:::json...pre:::data=data.streams
* https://ubershmekel.github.io/gfilter/?dl:::https://api.twitch.tv/kraken/games/top.json...pre:::data=data.top
* http://ubershmekel.github.io/gfilter/?dl:::http://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=37ffef8fb84e03db2abad987cb1f9699&format=json...type:::json...pre:::data=data.tracks.track
* http://ubershmekel.github.io/gfilter/?dl:::https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22YHOO%22%2C%22AAPL%22%2C%22GOOG%22%2C%22MSFT%22%2C%20%22TSLA%22%2C%20%22INTC%22%2C%20%22ATVI%22)%0A%09%09&format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env...type:::json...pre:::data=data.query.results.quote


# Credits
* https://d3js.org/ - a JavaScript library for visualizing data with HTML, SVG, and CSS.
* https://square.github.io/crossfilter/ - a JavaScript library for exploring large multivariate datasets in the browser.
* https://dc-js.github.io/dc.js/ - a javascript charting library with native crossfilter support.
* https://dc-js.github.io/dc.js/examples/filtering.html - the example gfilter is based off of.
* http://meyerweb.com/eric/tools/css/reset/ - css reset.
* https://github.com/shawnbot/drag-n-data - drag and drop file parsing for d3js.
* Temp favicon https://www.iconfinder.com/icons/196747/analytics_bars_chart_statistic_icon

# License

* [MIT License](https://www.opensource.org/licenses/MIT)