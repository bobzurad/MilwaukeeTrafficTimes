﻿(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;
    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    //internal data structures
    var dataRows = [];
    var timestampMessage = null;
    var $tableBody = null;

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
        for (var i = 0; i < dataRows.length; i++) {
            $tableBody.append(templateRow(dataRows[i]));
        }
    };

    //function that scraps info from DOT website and sets up internal data structures
    var scrapeDOT = function () {
        WinJS.xhr({
            type: "GET",
            url: "http://www.dot.wi.gov/travel/milwaukee/times.htm",
            responseType: "document"
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
            },
            function error(response) {

            },
            function progress(response) {

            }
        );
    };

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
                $tableBody = $("table#data").find("tbody");
                scrapeDOT();
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();
})();