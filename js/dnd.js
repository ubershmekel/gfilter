(function(exports) {

  if (window.File && window.FileReader && window.FileList && window.Blob) {
  } else {
    throw "Sorry, your browser doesn't support drag-and-drop file input.";
  }

  var dnd = exports.dnd = {
    version: "0.0.2"
  };

  // DSV parser helpers
  dnd.parse = {
    // the uncomment helper strips out lines that are empty or start with #
    uncomment: function(parse) {
      return function(str) {
        var lines = str.split("\n")
          .filter(function(line) {
            return line.length > 0 && line.charAt(0) !== "#";
          })
          .join("\n");
        return parse(lines);
      };
    }
  };

  // CSV and TSV uncommenting parsers
  dnd.parse.csv = dnd.parse.uncomment(d3.csv.parse);
  dnd.parse.tsv = dnd.parse.uncomment(d3.tsv.parse);

  dnd.file = {
    // mime type -> text parser
    parsers: {
      "text/csv": dnd.parse.csv,
      "text/tsv": dnd.parse.tsv,
      "application/json": JSON.parse
    },
    // filename extension -> mime type
    extensions: {
      "csv": "text/csv",
      "tsv": "text/tsv",
      "txt": "text/csv",
      "json": "application/json"
    },

    // string suffixes for bytes, kilobytes, etc.
    sizeFormats: ["bytes", "K", "MB", "GB"],
    // dnd.file.formatSize(1024) -> "1K"
    formatSize: function(bytes) {
      if (bytes <= 0) {
        return [0, dnd.file.sizeFormats[0]];
      }
      var i = ~~(~~Math.log(bytes) / Math.log(1024));
      return [(bytes / Math.pow(1024, i)).toFixed(1), dnd.file.sizeFormats[i]].join(" ");
    }
  };

  // guess the mime type of a File object, returning only types matching in
  // dnd.file.parsers or dnd.file.extensions
  dnd.guessFileType = function(file) {
    if (file.type in dnd.file.parsers) {
      return file.type;
    }
    var ext = file.name.split(".").pop();
    return dnd.file.extensions[ext];
  };

  // asynchronously read a file's contents as an array
  dnd.read = function(file, callback) {
    var type = dnd.guessFileType(file),
        parse = dnd.file.parsers[type];

    if (!parse) {
      throw "Unrecognized file type: " + type;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var input = e.target.result,
          data = parse(input);
      callback.call(file, null, data);
    };

    reader.onerror = function(e) {
      callback.call(file, e, null);
    };

    reader.readAsText(file);
  };

  /*
   * d3 selection helper, e.g.:
   *
   * d3.select("#dnd")
   *  .call(dnd.dropper()
   *    .on("read", function(files) {
   *      // do something with files[0].data here
   *    }));
   */
  dnd.dropper = function() {
    var ns = ".dnd",
        dropper = function(selection) {
          selection
            .on("dragover" + ns, dragover)
            .on("dragout" + ns, dragout)
            .on("drop" + ns, drop);
        },
        dispatch = d3.dispatch("dragover", "dragout", "drop", "read", "error");

    function dragover() {
      dispatch.dragover(d3.event);
      d3.event.dataTransfer.dropEffect = "copy";
      cancel(d3.event);
    }

    function dragout() {
      // XXX doesn't fire? :(
      dispatch.dragout(d3.event);
      cancel(d3.event);
    }

    function drop() {
      var files = d3.event.dataTransfer.files,
          len = files.length;
      dispatch.drop(files);
      cancel(d3.event);

      [].forEach.call(files, function(file, i) {
        dnd.read(file, function(error, data) {
          if (data) {
            file.data = data;
          } else {
            dispatch.error(file);
          }
          if (--len === 0) {
            dispatch.read(files);
          }
        });
      });
    }

    d3.rebind(dropper, dispatch, "on");
    return dropper;
  };

  function cancel(e) {
    e.stopPropagation();
    e.preventDefault();
  }

})(this);
