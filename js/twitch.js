var APP = APP || {};

//Results per page - will be delievered in blocks of 10. Server will provide the next 10
//when client requests it.
APP.limit = 20;
APP.url = "https://api.twitch.tv/kraken/search/streams?client_id=jm0p9mftpjmm92knye870nwhthlrej&limit=" + APP.limit;
APP.searchTerm = "";

APP.init = function()
{
	//Setup event listener for "Enter" key
	document.getElementById('searchBox').onkeypress = function(e)
	{
    	var keyCode = e.keyCode;
    	if (keyCode == '13')
      		APP.submitQuery();
 	}

	//Setup listener for Search button - callback to JSONP function will be the updateModel function
	//Initially the offset is 0, since we're viewing the first set of 10 results (offset of 10 is next set of 10)
	//This offset term is defined by the Twitch API
	document.getElementById("searchButton").addEventListener("click",function()
	{
		APP.submitQuery();
	},true);

	//Setup click handlers for pagination
	document.getElementById("prevBtn").addEventListener("click",function(evt){
		APP.offset -= APP.limit;
		if(APP.offset < 0)
			APP.offset = 0;
		evt.stopPropagation();
		APP.requestData(APP.url,APP.updateModel,APP.offset);
	},true);

	document.getElementById("nextBtn").addEventListener("click",function(evt){
		APP.offset += APP.limit;
		evt.stopPropagation();
		APP.requestData(APP.url,APP.updateModel,APP.offset);
	},true);
}

APP.submitQuery = function(){
	APP.searchTerm = document.getElementById("searchBox").value;
	APP.requestData(APP.url, APP.updateModel,0);
}

APP.setupResultsContainer = function()
{
	document.getElementById("resultsContainer").style.display = "";
	document.getElementById("resultsArea").innerHTML = "";
}

APP.requestData = function(url, callback, offset)
{
	//Request data  - this is where we setup the JSONp callback and URL params
	//the offset is needed for pagination.
	//Since the limit is 10/page, we're requesting them in blocks of 10
	var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
    };

    APP.offset = offset;
    var script = document.createElement('script');
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=APP.updateModel&offset=' + offset + '&query=' + APP.searchTerm;
    document.body.appendChild(script);
}

APP.updateModel = function(data)
{
	//Update local model with results from query
	this.model = {};
	this.model.streamData = data.streams;
	this.model.totalRows = data._total;

	//Update view
	this.updateResults();
}

APP.updateCounts = function()
{
	//Update results and pagination counts
	document.getElementById("resultCount").innerHTML = "Total Results: " + this.model.totalRows;
	document.getElementById("page").innerHTML = (APP.offset / APP.limit + 1) + " / " +
					(Math.ceil(this.model.totalRows / APP.limit) == 0 ? 1 : Math.ceil(this.model.totalRows / APP.limit) );
}

APP.updateResults = function()
{
	APP.setupResultsContainer();
	APP.updateCounts();

	//Enabled by default
	document.getElementById("prevBtn").disabled = "";
	document.getElementById("nextBtn").disabled = "";

	//Check if we need pagination at all - which is the case when results < limit per page
	if(this.model.totalRows < APP.limit)
	{
		//disable pagination arrows
		document.getElementById("prevBtn").disabled = "disabled";
		document.getElementById("nextBtn").disabled = "disabled";
	}
	else if((APP.offset / APP.limit + 1) == Math.ceil(this.model.totalRows / APP.limit) )
	{
		//Reached the last page, disable next button
		document.getElementById("nextBtn").disabled = "disabled";
	}
	else if( (APP.offset / APP.limit) == 0)
	{
		//user is on the first page, disable prev button
		document.getElementById("prevBtn").disabled = "disabled";
	}

	//Parse through results and display
	this.model.streamData.forEach(function(item)
	{
		//Grab the template and dynamically create entries based on the template format
		var template = document.querySelector('#resultEntryTemplate');

		// Populate the src and template content with results from query
		template.content.querySelector('img').src = item.preview.large;
		template.content.querySelector('div#displayName').textContent = item.channel.display_name;
		template.content.querySelector('div#gameInfo').textContent = (item.game || "Game Info N/A") + " - " + item.viewers + " viewers";
		template.content.querySelector('div#desc').textContent = item.channel.status || "Description N/A";

		//deep copy of clone, add it to the results area.
		var clone = document.importNode(template.content, true);
		document.getElementById("resultsArea").appendChild(clone);
	})
}
