
var mxNitokuIntegration = {
	
	init: function()
	{
		
	   window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
			   												+ 620 + "'}","https://www.nitoku.com");
	   window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-data'}",
    		   															 "https://www.nitoku.com");
       var container = document.getElementById('graphContainer');
       
       // Program starts here. Creates a sample graph in the
       // DOM node with the specified ID. This function is invoked
       // from the onLoad event handler of the document (see below).
	   // Checks if the browser is supported
	   if (!mxClient.isBrowserSupported())
	   {
			// Displays an error message if the browser is not supported.
			mxUtils.error('Browser is not supported!', 200, false);
	   }
	   else
	   {
			// Disables the built-in context menu
			mxEvent.disableContextMenu(container);
			
			// Creates the graph inside the given container
			var graph = new mxGraph(container);

			// Enables rubberband selection
			new mxRubberband(graph);
			
			// Gets the default parent for inserting new cells. This
			// is normally the first child of the root (ie. layer 0).
			var parent = graph.getDefaultParent();
							
			// Adds cells to the model in a single step
			graph.getModel().beginUpdate();
			try
			{
				var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
				var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
				var e1 = graph.insertEdge(parent, null, '', v1, v2);
			}
			finally
			{
				// Updates the display
				graph.getModel().endUpdate();
			}
		}

       const target = $('#graphContainer')[0]; // Get DOM element from jQuery
       // collection
       $('#graphContainer').on('click', () => {
    	   if (screenfull.enabled) {
				if(!screenfull.isFullscreen){
					screenfull.request(target);
				}else{
					screenfull.exit();
				}
			}
		});
			
		if (screenfull.enabled) {
			screenfull.on('change', () => {
				console.log('Am I fullscreen?', screenfull.isFullscreen ? 'Yes' : 'No');
			});
		}
	    
		window.addEventListener('message', function (e) {
	          
	      if (e.origin !== ("https://www.nitoku.com")){
	        console.warn("error on frame origin");
	        return;
	      }
	        
	      if(e.data != null) {
	    	var jdata;
            try {
	           	jdata = JSON.parse(e.data);
	  		} catch (err) {
	            return;
	        }
	  			
	        if(jdata.service !== "@nitoku.public/blockApi"){
	          	return;
	        }

	        if(jdata.response.id === "get-data" || jdata.response.id === "data-update"){
	           console.log(jdata.response.data);     	
	        }
	              
	  	}
	          
	  });
	      
	}

};
