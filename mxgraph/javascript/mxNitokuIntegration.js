
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

	   var editor = $('#graphContainer');
       const target = editor[0]; // Get DOM element from jQuery
	   //editor.hide();
		
       // collection
       $('#graphContainer').on('click', () => {
    	   if (screenfull.enabled) {
				if(!screenfull.isFullscreen){
					this.initEditor();
					screenfull.request();
		//			editor.show();
				}else{
					screenfull.exit();
		//			editor.hide();
				}
			}
		});
			
		if (screenfull.enabled) {
			screenfull.on('change', () => {
				console.log('Am I fullscreen?', screenfull.isFullscreen ? 'Yes' : 'No');
			});
		}
	    
		// Default resources are included in grapheditor resources
		mxLoadResources = false;

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
	      
	},

	initEditor : function()
	{
		window.document.body.innerText = "";
		
		var urlParams = (function(url)
				{
					var result = new Object();
					var idx = url.lastIndexOf('?');
			
					if (idx > 0)
					{
						var params = url.substring(idx + 1).split('&');
						
						for (var i = 0; i < params.length; i++)
						{
							idx = params[i].indexOf('=');
							
							if (idx > 0)
							{
								result[params[i].substring(0, idx)] = params[i].substring(idx + 1);
							}
						}
					}
					
					return result;
				})(window.location.href);
		
		var editorUiInit = EditorUi.prototype.init;
		
		EditorUi.prototype.init = function()
		{
			editorUiInit.apply(this, arguments);
			
		};
		
		// Adds required resources (disables loading of fallback properties, this can only
		// be used if we know that all keys are defined in the language specific file)
		mxResources.loadDefaultBundle = false;
		var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
		mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);

		// 	Fixes possible asynchronous requests
		mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], function(xhr)
		{
			// Adds bundle text to resources
			mxResources.parse(xhr[0].getText());
			
			// Configures the default graph theme
			var themes = new Object();
			themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement(); 
			
			// Main
			new EditorUi(new Editor(urlParams['chrome'] == '0', themes));
		}, function()
		{
			document.body.innerHTML = 
				'<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
		});
	
	}

};
