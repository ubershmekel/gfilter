QUnit.test( "hello test", function( assert ) {
    assert.ok( "1" === "1", "Passed!" );
});

QUnit.test("test humanize", function( assert ) {
    // Num      Displayed
    var expectations = [
        [100, "100"],
        [99.99, "99.99"],
        [37.451, "37.45"],
        [10.5, "10.5"],
        [10.0, "10"],
        [9.5, "9.5"],
        [9.54, "9.54"],
        [9.543, "9.54"],
        [1.5, "1.5"],
        [0.5, "0.5"],
        [0.05, "0.05"],
        [22.34, "22.34"],  
    ];
    
    for(var i = 0; i < expectations.length; i++ ) {
        var input = expectations[i][0];
        var expected = expectations[i][1];
        var res = gfilter.humanizePercent(input);
        assert.ok( res === expected, input + " -> " + res + ' and expected: "' + expected + '"' );
    }
});