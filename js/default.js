//TODO: icons
//TODO: use minified js
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;
    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    //internal data structures
    var dataRows = [];
    var timestampMessage = null;
    var $container = null;
    var $tableBody = null;
    var $timestampMessage = null;
    var $cmdRefresh = null;
    var $spinner = null;

    //spinner options
    var spinnerOptions = {
        lines: 13, // The number of lines to draw
        length: 20, // The length of each line
        width: 10, // The line thickness
        radius: 30, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#FFF', // #rgb or #rrggbb
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    };

    var spinner = new Spinner(spinnerOptions);

    //object to store data for each row
    function DataRow(title, time, delay) {
        var titleSplit = title.split(" - ");

        this.start = titleSplit[0];
        this.end = titleSplit[1];
        this.time = time.substr(0, time.indexOf('(') - 1);
        this.delay = delay == "No delay"
            ? delay
            : "normal " + delay;
        this.icon = titleSplit[0]
            .substr(0, titleSplit[0].indexOf(" "))
            .replace('-', '');
    };

    //template for data row
    var templateRow = _.template("<tr>" +
        "<td class='icon'><img src='/images/<%= icon %>.png' /></td>" +
        "<td><%= start %><br /><%= end %></td>" +
        "<td><%= time %><br /><%= delay %></td>" +
        "</tr>");

    var applyTemplates = function () {
        $timestampMessage.html(timestampMessage);
        for (var i = 0; i < dataRows.length; i++) {
            $tableBody.append(templateRow(dataRows[i]));
        }
    };

    var clear = function () {
        dataRows = [];
        $timestampMessage.html("");
        $tableBody.html("");
    }

    //function that scraps info from DOT website and sets up internal data structures
    var scrapeDOT = function () {
        spinner.spin();
        $spinner.html(spinner.el);
        $container.hide();
        $spinner.show();

        WinJS.xhr({
            type: "GET",
            url: "http://www.dot.wi.gov/travel/milwaukee/times.htm",
            responseType: "document",
            headers: {
                "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT"    //prevents caching
            }
        }).done(
            function complete(response) {
                //parse HTML received
                var DOThtml = response.response.childNodes[0].innerHTML;
                var DOTtable = $(DOThtml).find("h2").siblings("table")[0].innerHTML;
                $(DOTtable).children("tr").each(function (i, el) {
                    if (i == 0) {
                        timestampMessage = $(el).find("b").text();
                    } else {
                        dataRows[i - 1] = new DataRow(
                            $(el).find("td")[0].innerText,
                            $(el).find("td")[1].innerText,
                            $(el).find("td")[2].innerText
                        );
                    }
                });
                //generate templates
                applyTemplates();

                spinner.stop();
                $spinner.hide();
                $container.show();
            },
            function error(response) {

            },
            function progress(response) {

            }
        );
    };

    //click handler for Refresh button in AppBar
    var onCmdRefresh = function (e) {
        clear();
        scrapeDOT();
    };

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // This application has been newly launched. Initialize
                // your application here.
                $container = $("#container");
                $tableBody = $("table#data").find("tbody");
                $timestampMessage = $("#timestampMessage");
                $spinner = $("div.spinner");

                $cmdRefresh = $("#RefreshButton");
                $cmdRefresh.on("click", onCmdRefresh);

                scrapeDOT();
            } else {
                // This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();
})();
