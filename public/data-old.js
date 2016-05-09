var displayPage;
var cacheData;

function handleInput(e) {
    console.log('in handle');
    e.preventDefault();

    var words = $("#login-info").text().split(" ");
    // var username = words[words.length-1];
    var username = 'aaaa';

    //alert(words[words.length-1]);
    //$("#results").css('text-align', 'center');
    //$("#results").css('display', 'block');
    var org = document.getElementById("org_url").value;
    var repo = document.getElementById("repo_url").value;
    var numReq = $("#req-num option:selected").val();
    if (repo == "" || 
        repo == undefined ||
        org == "" ||
        org == undefined ||
        numReq == "" ||
        numReq == undefined) {
        $("#error").css('display','block');
        $("#error").text('Please Fill in all Fields.');
        return;
    } else {
        $("#error").css('display', 'none');
    }

    $("#results").html('');
    $("#wait-icon").css('display', 'block');
    //$("#wait-icon").html('Please Wait');
    //alert('numReq: ' + numReq);
    var state = document.querySelector('input[name="status"]:checked').value;
   
    sendMessage(org, repo, state, numReq, username, 1);
}

function sendMessage(org, repo, state, per_page, username, page_num) {
    console.log('in send message');
    var fd = new FormData(document.getElementById('input_form'));
    fd.append("org", org);
    fd.append("repo", repo);
    fd.append("state", state);
    fd.append("per_page", per_page);
    fd.append("username", username);
    fd.append("page_num", page_num);
    //fd.append("numReq", numReq);

    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        console.log("received " + req.readyState + ", " + req.status);
       
        if (req.readyState == 4 && req.status == 200) {
            var data = jQuery.parseJSON(req.responseText);
            cacheData = data;
            var display = '<div class="pull_request">' 
            var options = {weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"};


            $("#results").text("");

            var pull_request_dict = {};
           
            for (var i in data) {
                // created_at = new Date(Date.parse(data[i].created_at)).toLocaleTimeString("en-us", options);
                // updated_at = new Date(Date.parse(data[i].updated_at)).toLocaleTimeString("en-us", options);
                // closed_at = new Date(Date.parse(data[i].closed_at)).toLocaleTimeString("en-us", options);

                created_at = Date.parse(data[i].created_at);
                updated_at = Date.parse(data[i].updated_at);
                closed_at = Date.parse(data[i].closed_at);

                text = ''; 

                if (i == data[data.length-1]) {
                    text += '<div class="single_request" style="margin-bottom: 0px">';
                } else { 
                    text += '<div class="single_request">';
                }
                
                text += '<div id="user-info"><img class="profile_img" src=' + data[i].user.avatar_url + '>' +
                    '<div class="user_login"><a href=\"' + data[i].user.html_url + '\">' + data[i].user.login + '</a></div>' +
                    '<div class="state" >state: ' + data[i].state + '</div>' +
                    '<div class="request_number" >number: ' + data[i].number + '</div>' +
                    '<div class="created_at" >created at ' + new Date(created_at).toLocaleTimeString("en-us", options) + '</div>' +
                    '<div class="updated_at" >updated at ' + new Date(updated_at).toLocaleTimeString("en-us", options) + '</div>';
                
                if (data[i].state == "open"){
                    text += '<div class="closed_at" >open till now</div></div>';
                } else {
                    text += '<div class="closed_at" >closed at ' + new Date(closed_at).toLocaleTimeString("en-us", options) + '</div></div>';
                }

                text += '<div class="request_title" ><a href=\"' + data[i].html_url + '\">' +  data[i].title + '</a></div>' +
                    '<div class="request_body" >  ' + data[i].body + '</div>' +
                    '</div>';  

                pull_request_dict[data[i].number] = {
                    created_at: created_at,
                    updated_at: updated_at,
                    closed_at: closed_at,
                    text: text
                };

                display += text;          	
            }

            console.log(pull_request_dict);
            $("#wait-icon").css('display','none');
            $("#results").css('display', 'block');
            display = display + '</div>'
            $('#results').append(display);
            $("#menu").css('display', 'block');
            
            var minDate = getMinDate(pull_request_dict);
            var maxDate = getMaxDate(pull_request_dict);

            $("#slider").dateRangeSlider({
                bounds: {
                    min: new Date(minDate),
                    max: new Date(maxDate)
                }, 
                defaultValues: {
                    min: new Date(minDate),
                    max: new Date(maxDate)
                }
            });
            $("#slider").on("valuesChanged", function(e, data) {
                minDate = data.values.min;
                maxDate = data.values.max;
                console.log(minDate + ", " + maxDate);
            });

            displayPage = 'user';

            //if ()

            // d3 goes here
            display  = ''

            //timeline_graph(data);

            

        }
    };

    req.open('POST', '/data/' + org + '/' + repo + '/' + state + '/' + per_page + '/' + username + '/' + page_num, true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(fd);
}








function timeline_graph(data){

    var options = {weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"};

    var visData = new Array(data.length);
    var i;
    var j = 0;
    for (i=data.length-1; i>-1; i--) {
        visData[j] = [data[i].user.login, data[i].number, Date.parse(data[i].created_at), Date.parse(data[i].updated_at), Date.parse(data[i].closed_at), data[i].user.avatar_url];
        j++;
    }

    // console.log(visData);

    var userList = [];
            
            var visDataUser = []
            var startDate = new Date(visData[0][2]);
            var endDate = new Date();
            
            for (i=0; i<visData.length; i++){
                var createD = new Date(visData[i][2]);
                var closedD = new Date(visData[i][4]);
                if (startDate > createD){
                    startDate = createD;
                }
                var index = userList.indexOf(visData[i][0]);
                if (index == -1){
                    userList.push(visData[i][0]);
                    visDataUser.push([visData[i][0], [visData[i]]])
                } else {
                    visDataUser[index][1].push(visData[i]);
                }
            }

            // console.log(userList);
            // console.log(visDataUser);

            var range = endDate - startDate;

            //Width and height
            var w = 1000;
            var h = 750;
            var t = 550;
            
    
            //Create SVG element
            var svg = d3.select("body")
                        .append("svg")
                        .attr("width", w+100)
                        .attr("height", h);

            var backgroundPanel = d3.select("body")
              .append("div")
              .style("position", "absolute")
              .style("top", "80px")
              .style("left", "350px")
              .style("z-index", "-10")
              .style("width", "800px")
              .style("height", "600px")
              .style("background-color", "#f8f8fa")
              .style("box-shadow", "6px 3px 5px #8181ae");

            var timelinebarPanel = d3.select("body")
              .append("div")
              .style("position", "absolute")
              .style("top", "170px")
              .style("left", "480px")
              .style("z-index", "-9")
              .style("width", "600px")
              .style("height", "420px")
              .style("opacity", "0.8")
              .style("border-radius", "5px")
              .style("background-color", "#8181ae");



            var tooltip = d3.select("body")
              .append("div")
              .style("position", "absolute")
              .style("z-index", "10")
              .style("visibility", "hidden")
              .text("a simple tooltip")
              .style("width", "200px")
              .style("background-color", "#ffffcc")
              .style("font-size", "10px")
              .style("border-radius", "3px")
              .style("color", "#800080")
              .style("opacity", "0.9");


            svg.selectAll("rectBackground")
            .data(visData)
            .enter()
            .append("rect")
            .attr("x", 500)
            .attr("y", function(d){
                var i = userList.indexOf(d[0]);
                return 190 + 30*i;
            })
            .attr("width", t)
            .attr("height", 20)
            .attr("fill", "#ffe6ff")
            .attr("opacity", "0.9");

            svg.selectAll("userBackground")
            .data(visData)
            .enter()
            .append("rect")
            .attr("x", 360)
            .attr("y", function(d){
                var i = userList.indexOf(d[0]);
                return 190 + 30*i;
            })
            .attr("width", 100)
            .attr("height", 20)
            .attr("fill", "#9999ff")
            .attr("opacity", "0.9");



            svg.selectAll("rectTime")
            .data(visData)
            .enter()
            .append("rect")
            .attr("x", function(d){
                var s = new Date(d[2]);
                var s2 = (s - startDate)/range;
                return 500 + s2 * t;
            })
            // .attr("x", 0)
            .attr("y", function(d){
                // c = new Date(d[2]).toLocaleTimeString("en-us", options);
                // e = new Date(d[4]).toLocaleTimeString("en-us", options);
                // console.log(c + e);

                var i = userList.indexOf(d[0]);
                return 190 + 30*i;
                
            })
            .attr("width", function(d){
                var s = new Date(d[2]);
                var c = new Date(d[4]);
                var s2 = (s - startDate)/range;
                var c2;
                if (c == "Invalid Date"){
                    c2 = 1;
                }else{
                    c2 = (c - startDate)/range;
                }
                return (c2 - s2) * t;
            })
            .attr("height", 20)
            .attr("fill", "blue")
            .attr("opacity", "0.5")
            .on("mouseover", function(d){
                d3.select(this).style({fill:'#ff4dd2',});
                c = new Date(d[2]).toLocaleTimeString("en-us", options);
                e = new Date(d[4]).toLocaleTimeString("en-us", options);
                if (e == "Invalid Date" ){
                    e = "still open now";
                }
                tooltip.text("created at: " + c + " " + "closed at: " + e);
                tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(d){
                d3.select(this).style({fill:'#ff4dd2',});
                c = new Date(d[2]).toLocaleTimeString("en-us", options);
                e = new Date(d[4]).toLocaleTimeString("en-us", options);
                if (e == "Invalid Date" ){
                    e = "still open now";
                }
                tooltip.text("created at: " + c + " " + "closed at: " + e);
                tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
            })
            .on("mouseout", function(){
                d3.select(this).style({fill:'blue',});
                tooltip.style("visibility", "hidden");
            });

            var circles = svg.selectAll("circle")
                          .data(visDataUser)
                          .enter()
                          .append("circle")
                          .attr("cx", 1063)
                            .attr("cy", function (d, i) {
                                return 200 + 30*i;
                            })
                            .attr("r", 10)
                            .style("fill", "#ffffb3")
                            .style("opacity", "0.7");


            svg.selectAll("usernametext")
               .data(userList)
               .enter()
               .append("text")
               .text(function(d) {
                    return d;
               })
               .attr("x", 380)
               .attr("y", function(d, i) {
                    return 200 + 30*i;
               })
               .attr("font-family", "sans-serif")
               .attr("font-size", "11px")
               .attr("fill", "white");

            svg.selectAll("number count")
               .data(visDataUser)
               .enter()
               .append("text")
               .text(function(d) {
                    return d[1].length;
               })
               .attr("x", 1060)
               .attr("y", function(d, i) {
                    return 203 + 30*i;
               })
               .attr("font-family", "sans-serif")
               .attr("font-size", "11px")
               .attr("fill", "#660066");
            
    

            var width = 500,
            height = 160,
            padding = 50;


            //Width and height
            var h = 180;
            var padding = 50;

            //Create scale functions
            var xScale = d3.time.scale()
                                 // .domain([0, d3.max(dataset, function(d) { return d[0]; })])
                                 .domain([startDate, endDate])
                                 .range([500, 1050]);

            
            //Define X axis
            var xAxis = d3.svg.axis()
                              .scale(xScale)
                              .orient("bottom")
                              .ticks(11);        
            
            
            //Create X axis
            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + (h - padding) + ")")
                .call(xAxis)
                .attr("fill", "#8862b7");

               svg.selectAll(".axis text")  // select all the text elements for the xaxis
          .attr("transform", function(d) {
              return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
        });    

}



function linechart(data){
    console.log("call linechart");
    console.log(data);

    var options = {weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"};

    var visData = new Array(data.length);
    for (var i=0; i<data.length; i++) {
        visData[i] = [data[i].user.login, data[i].number, Date.parse(data[i].created_at), Date.parse(data[i].updated_at), Date.parse(data[i].closed_at), data[i].user.avatar_url];
    }

    // console.log(visData);

    // var userList = [];
            
    // var visDataUser = []
    var startDate = new Date(visData[0][2]);
    var endDate = new Date();
    
    for (i=0; i<visData.length; i++){
        var createD = new Date(visData[i][2]);
        var closedD = new Date(visData[i][4]);
        if (startDate > createD){
            startDate = createD;
        }
        // var index = userList.indexOf(visData[i][0]);
        // if (index == -1){
        //     userList.push(visData[i][0]);
        //     visDataUser.push([visData[i][0], [visData[i]]])
        // } else {
        //     visDataUser[index][1].push(visData[i]);
        // }
    }

    // console.log(userList);
    // console.log(visDataUser);

    var range = endDate - startDate;
    var oneDay = 24*60*60*1000;
    var rangeDays = Math.round(Math.abs((endDate.getTime() - startDate.getTime())/(oneDay)));
    // console.log(rangeDays);
    var daysActive = new Array(rangeDays);
    var maxq = 0;
    
    for (var i=0; i<rangeDays; i++) {
        daysActive[i] = [0,[]];
    }

    for (var i=0; i<visData.length; i++) {
        var s = new Date(visData[i][2]);
        var e = new Date(visData[i][4]);
        var uname = visData[i][0];
        var sIndex = Math.round(Math.abs((s.getTime() - startDate.getTime())/(oneDay)));
        var eIndex = Math.round(Math.abs((e.getTime() - startDate.getTime())/(oneDay)));
        for (var j=sIndex; j<eIndex; j++) {
            daysActive[j][0] += 1;
            daysActive[j][1].push(uname);
            if (daysActive[j][0]>maxq){
                maxq = daysActive[j][0];
            }
        }

    }

    // console.log(daysActive);






    var w = 1000;
    var h = 750;
    var t = 550;

    var svg = d3.select("body")
                        .append("svg")
                        .attr("width", w+100)
                        .attr("height", h);

    var height = 320;

    plots = "";
    for (var i=0; i<daysActive.length; i++) {
        var x = 520 + t*(i/rangeDays);
        var y = 520 - daysActive[i][0]/(maxq+1)*height;
        plots = plots + x + "," + y;
        if (i != daysActive.length-1) {
            plots = plots + ", ";
        }
    }


    svg.append("polyline")      
    .style("stroke", "black")  
    .style("fill", "none")     
    .attr("points", plots)
    .style("stroke", "#80dfff");


    // var width = 500,
    //     height = 460,
    //     padding = 50;

    var tooltip = d3.select("body")
              .append("div")
              .style("position", "absolute")
              .style("z-index", "10")
              .style("visibility", "hidden")
              .text("a simple tooltip")
              .style("width", "100px")
              .style("background-color", "#ffe6ff")
              .style("font-size", "10px")
              .style("border-radius", "3px")
              .style("color", "#660066")
              .style("opacity", "0.8");

    
    var circles = svg.selectAll("circle")
                          .data(daysActive)
                          .enter()
                          .append("circle")
                          .attr("cx", function (d, i) {
                                return 520 + t*(i/rangeDays);
                            })
                            .attr("cy", function (d, i) {
                                return 520 - d[0]/(maxq+1)*height;
                            })
                            .attr("r", 4)
                            .style("fill", "#ffffb3")
                            .style("opacity", "0.9")
                            .on("mouseover", function(d){
                                d3.select(this).style({fill:'#000099',});
                                // c = new Date(d[2]).toLocaleTimeString("en-us", options);
                                // e = new Date(d[4]).toLocaleTimeString("en-us", options);
                                // if (e == "Invalid Date" ){
                                //     e = "still open now";
                                // }
                                // tooltip.text("created at: " + c + " " + "closed at: " + e);
                                tooltip.style("visibility", "visible");
                            })
                            .on("mousemove", function(d, i){
                                d3.select(this).style({fill:'#000099',});
                                // c = new Date(d[2]).toLocaleTimeString("en-us", options);
                                // e = new Date(d[4]).toLocaleTimeString("en-us", options);
                                // if (e == "Invalid Date" ){
                                //     e = "still open now";
                                // }
                                // tooltip.text("created at: " + c + " " + "closed at: " + e);
                                
                                var date = new Date(startDate.getTime() + i*oneDay).toLocaleTimeString("en-us", {weekday: "short", year: "numeric", month: "short", day: "numeric", hour: 'numeric'});
                                for (var j=0; j<6; j++){
                                    date = date.substring(0, date.length - 1);
                                }


                                var dis = date + "\n" + "Active users: " + "\n";
                                for (var j=0; j<d[1].length; j++){
                                    dis = dis + d[1][j] + " \n";
                                }
                                tooltip.text(dis);
                                tooltip.style("height", 30*d[1].length + "px");
                                tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
                            })
                            .on("mouseout", function(){
                                d3.select(this).style({fill:'#ffffb3',});
                                tooltip.style("visibility", "hidden");
                            });



        //Width and height
        var h = 580;
        var padding = 50;

        //Create scale functions
        var xScale = d3.time.scale()
                             // .domain([0, d3.max(dataset, function(d) { return d[0]; })])
                             .domain([startDate, endDate])
                             .range([515, 1050]);       
        //Define X axis
        var xAxis = d3.svg.axis()
                          .scale(xScale)
                          .orient("bottom")
                          .ticks(11);        
    
        var yScale = d3.scale.linear()
          .domain([maxq+1, 0])    // values between 0 and 100
        .range([200, 520]);  


        var yAxis = d3.svg.axis()
            .orient("left")
            .scale(yScale);

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + 510 + ",0)")
            .call(yAxis)
            .attr("fill", "white");  
        
        //Create X axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis)
            .attr("fill", "white");

           svg.selectAll(".axis text")  // select all the text elements for the xaxis
              .attr("transform", function(d) {
                  return "translate(" + this.getBBox().height*-0.4 + "," + this.getBBox().height + ")rotate(45)";
            });    









}














var minDate;
var maxDate;

function getMinDate(dict) {
    var min = Number.MAX_SAFE_INTEGER;

    for (var key in dict) {
        if (dict[key]['created_at'] < min) {
            min = dict[key]['created_at'];
        }
    }
    return min;
}

function getMaxDate(dict) {
    var max = 0;

    for (var key in dict) {
        if (dict[key]['created_at'] > max) {
            max = dict[key]['created_at'];
        }
    }
    return max;
}

window.addEventListener('load', function(){

    var username = $("#login-info").val();
    console.log('username: ' + username);
    //input_form.addEventListener('submit', handleInput, false);
    $("#send_button").click(handleInput);
    $("#clear-btn").click(function(){
        $("#results").css('display', 'none');
    });

    $("#timeline-graph").click(function(){
        $("#user-search").css('color', '#8181ae');
        $("#user-search").css('background-color', 'white');
        $("#timeline-graph").css('color', 'white');
        $("#timeline-graph").css('background-color', '#8181ae');
        $("#graph2").css('color', '#8181ae');
        $("#graph2").css('background-color', 'white');
        if (displayPage == 'graph') {
            return;
        }
        displayPage = 'graph';
        $("#results").css('display', 'none');
        timeline_graph(cacheData);
        $("graph-panel").css('display', 'block');
    });

    $("#graph2").click(function(){
        $("#user-search").css('color', '#8181ae');
        $("#user-search").css('background-color', 'white');
        $("#timeline-graph").css('color', '#8181ae');
        $("#timeline-graph").css('background-color', 'white');
        $("#graph2").css('color', 'white');
        $("#graph2").css('background-color', '#8181ae');
        $("#results").css('display', 'none');
        d3.select("svg").remove();
        linechart(cacheData);
    });

    $("#user-search").click(function(){
        $("#user-search").css('color', 'white');
        $("#user-search").css('background-color', '#8181ae');
        $("#timeline-graph").css('color', '#8181ae');
        $("#timeline-graph").css('background-color', 'white');
        $("#graph2").css('color', '#8181ae');
        $("#graph2").css('background-color', 'white');
        if(displayPage == 'user') {
            return;
        }
        displayPage = 'user';
        d3.select("svg").remove();
        $("#results").css('display', 'block');
        $("#graph-panel").css('display', 'none');

    });

    
}, false);