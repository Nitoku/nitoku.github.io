
var mxNitokuIntegrationXml = ""; 
var mxNitokuEditorUi;
var mxNitokuIntegration = {
	
	init: function()
	{
		
	   window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
			   												+ 620 + "'}","https://www.nitoku.com");
	   window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-data'}",
    		   															 "https://www.nitoku.com");
       
	   // Default resources are included in grapheditor resources
	   mxLoadResources = false;

	   if (screenfull.enabled) {
			screenfull.on('change', () => {
				if(!screenfull.isFullscreen){
					mxNitokuIntegrationXml = 
								mxNitokuEditorUi.editor.getGraphXml().outerHTML;
					//console.log("xml new");
					//console.log(mxNitokuIntegrationXml);
					this.initGraph();
				}
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
	
		        if(jdata.response.id === "get-data" || 
		        		jdata.response.id === "data-update"){
		            
		        	mxNitokuIntegrationXml = jdata.response.data;
		        	//console.log(this.xml);
		        	mxNitokuIntegration.initGraph();
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
			//themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement(); 
			//console.log(xhr[1].getDocumentElement());
			
			// Main
			//var editor = new Editor(urlParams['chrome'] == '0', themes);
			var editor = new Editor(urlParams['chrome'] == '0', themes);
			//var editor = new Editor(true);
			mxNitokuEditorUi =  new EditorUi(editor);
			
			var doc = mxUtils.parseXml(mxNitokuIntegrationXml);
			var node = doc.documentElement;
			//var decoder = new mxCodec(node);
			//decoder.decode(node, editor.graph.getModel());
			mxNitokuEditorUi.editor.graph.model.beginUpdate();
			try
			{
				mxNitokuEditorUi.editor.setGraphXml(node);
			}
			catch (e)
			{
				error = e;
			}
			finally
			{
				mxNitokuEditorUi.editor.graph.model.endUpdate();				
			}			
		}, function()
		{
			document.body.innerHTML = 
				'<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
		});
	
	},
	
	initGraph : function()
	{
	     
	   window.document.body.innerHTML = "<div id='mxgraph'></div>";	 
	   var editor = $('#mxgraph');
       const target = editor[0]; // Get DOM element from jQuery
	   //editor.hide();
		
       // collection
       $('#mxgraph').on('click', () => {
    	   if (screenfull.enabled) {
				if(!screenfull.isFullscreen){
					this.initEditor();
					screenfull.request();
				}//else{
				//	screenfull.exit();
				//	this.initGraph();
				//}
			}
		});
	       
		var container = document.getElementById('mxgraph');
	       
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
			var xmlDocument = mxUtils.parseXml(mxNitokuIntegrationXml);
			
			if (xmlDocument.documentElement != null && 
					xmlDocument.documentElement.nodeName == 'mxGraphModel')
			{
				var decoder = new mxCodec(xmlDocument);
				var node = xmlDocument.documentElement;

				container.innerHTML = '';

				var graph = new mxGraph(container);
				graph.centerZoom = false;
				graph.setTooltips(true);
				graph.setEnabled(true);
				graph.htmlLabels = true;

				// Changes the default style for edges "in-place"
				//var style = graph.getStylesheet().getDefaultEdgeStyle();
				//style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
				
				// Enables panning with left mouse button
				graph.panningHandler.useLeftButtonForPanning = true;
				graph.panningHandler.ignoreCell = true;
				graph.container.style.cursor = 'move';
				graph.setPanning(true);
				
				// Do not allow removing labels from parents
				graph.graphHandler.removeCellsFromParent = false;
				
				graph.resizeContainer = true;
				decoder.decode(node, graph.getModel());
				//graph.resizeContainer = false;
				
				// Adds zoom buttons in top, left corner
				var buttons = document.createElement('div');
				buttons.style.position = 'absolute';
				buttons.style.overflow = 'visible';

				var bs = graph.getBorderSizes();
				buttons.style.top = (container.offsetTop + bs.y) + 'px';
				buttons.style.left = (container.offsetLeft + bs.x) + 'px';
				
				var left = 0;
				var bw = 16;
				var bh = 16;
				
				if (mxClient.IS_QUIRKS)
				{
					bw -= 1;
					bh -= 1;
				}
				
				function addButton(label, funct)
				{
					var btn = document.createElement('div');
					mxUtils.write(btn, label);
					btn.style.position = 'absolute';
					btn.style.backgroundColor = 'transparent';
					btn.style.border = '1px solid gray';
					btn.style.textAlign = 'center';
					btn.style.fontSize = '10px';
					btn.style.cursor = 'hand';
					btn.style.width = bw + 'px';
					btn.style.height = bh + 'px';
					btn.style.left = left + 'px';
					btn.style.top = '0px';
					
					mxEvent.addListener(btn, 'click', function(evt)
					{
						funct();
						mxEvent.consume(evt);
					});
					
					left += bw;
					
					buttons.appendChild(btn);
				};
				
				addButton('+', function()
				{
					graph.zoomIn();
				});
				
				addButton('-', function()
				{
					graph.zoomOut();
				});
				
				if (container.nextSibling != null)
				{
					container.parentNode.insertBefore(buttons, container.nextSibling);
				}
				else
				{
					container.appendChild(buttons);
				}
			}

		}

//		window.document.body.innerText = "";
//		var urlParams = (function(url)
//				{
//					var result = new Object();
//					var idx = url.lastIndexOf('?');
//			
//					if (idx > 0)
//					{
//						var params = url.substring(idx + 1).split('&');
//						
//						for (var i = 0; i < params.length; i++)
//						{
//							idx = params[i].indexOf('=');
//							
//							if (idx > 0)
//							{
//								result[params[i].substring(0, idx)] = params[i].substring(idx + 1);
//							}
//						}
//					}
//					
//					return result;
//				})(window.location.href);
//		
//		var editorUiInit = EditorUi.prototype.init;
//		
//		EditorUi.prototype.init = function()
//		{
//			editorUiInit.apply(this, arguments);
//			
//		};
//		
//		// Adds required resources (disables loading of fallback properties, this can only
//		// be used if we know that all keys are defined in the language specific file)
//		mxResources.loadDefaultBundle = false;
//		var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
//		mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);
//
//		// 	Fixes possible asynchronous requests
//		mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], function(xhr)
//		{
//			// Adds bundle text to resources
//			mxResources.parse(xhr[0].getText());
//			
//			// Configures the default graph theme
//			var themes = new Object();
//			//themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement(); 
//			console.log(xhr[1].getDocumentElement());
//			
//			// Main
//			//var editor = new Editor(urlParams['chrome'] == '0', themes);
//			//var editor = new Editor(urlParams['chrome'] == '0', themes);
//			var editor = new Editor(true);
//			mxNitokuEditorUi =  new EditorUi(editor);
//			
//			var doc = mxUtils.parseXml(mxNitokuIntegrationXml);
//			var node = doc.documentElement;
//			//var decoder = new mxCodec(node);
//			//decoder.decode(node, editor.graph.getModel());
//			mxNitokuEditorUi.editor.graph.model.beginUpdate();
//			try
//			{
//				mxNitokuEditorUi.editor.setGraphXml(node);
//			}
//			catch (e)
//			{
//				error = e;
//			}
//			finally
//			{
//				mxNitokuEditorUi.editor.graph.model.endUpdate();				
//			}			
//		}, function()
//		{
//			document.body.innerHTML = 
//				'<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
//		});

	}
	
};
