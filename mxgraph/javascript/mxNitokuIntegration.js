
var mxNitokuIntegrationXml = ""; 
var mxNitokuIntegrationTmpXml = "";

var mxNitokuEditorUi;
var mxNitokuDevFlag = true;

var mxNitokuIntegration = {
	
	init: function()
	{
		
	   //window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
	   //		   												+ 400 + "'}","https://www.nitoku.com");
	   if(!mxNitokuDevFlag){
		   window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-data'}",
    		   															 "https://www.nitoku.com");
	   }else{
		   window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-data'}",
				 "*");
	   }
	   
	   // Default resources are included in grapheditor resources
	   mxLoadResources = false;

	   if (screenfull.enabled) {
		   
			screenfull.on('change', () => {
				
				if(!screenfull.isFullscreen){
					
					mxNitokuIntegrationTmpXml = 
							mxNitokuEditorUi.editor.getGraphXml().outerHTML;
					
					if(mxNitokuIntegrationXml.trim()
								.localeCompare(mxNitokuIntegrationTmpXml.trim()) === 0){
						
						//make sure that the editor is not blocking reload
						mxNitokuEditorUi.editor.modified = false;
						
					}else{
					
						//mxNitokuIntegrationXml = 
						//	mxNitokuEditorUi.editor.getGraphXml().outerHTML;
						if(!mxNitokuDevFlag){
							parent.postMessage(
								    "{'service':'@nitoku.public/blockApi','request':'set-data : "+ 
								    mxNitokuIntegrationTmpXml+"'}",
								    "https://www.nitoku.com"
							);
						}else{
							parent.postMessage(
								    "{'service':'@nitoku.public/blockApi','request':'set-data : "+ 
								    mxNitokuIntegrationTmpXml+"'}",
								    "*"
							);
						}

						//make sure that the editor is not blocking reload
						mxNitokuEditorUi.editor.modified = false;

						
					}
					
					this.initGraph();
					
				}
				
			});
	   }
	   
	   window.addEventListener('message', function (e) {
	          
		    if(!mxNitokuDevFlag){
			    if (e.origin !== ("https://www.nitoku.com")){
			        console.warn("error on frame origin");
			        return;
			    }
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
		        	//console.log(mxNitokuIntegrationXml);
		        	mxNitokuIntegration.initGraph();
		        	
		        }

		        if(jdata.response.id === "set-data" && 
		        		jdata.response.data === "accepted"){
		            //console.log("accepted change");
		        	mxNitokuIntegrationXml = mxNitokuIntegrationTmpXml;
		        	//console.log(mxNitokuIntegrationXml);
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
			themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement(); 
			//console.log(xhr[1].getDocumentElement());
			//console.log("test here");
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
       //$('#mxgraph').on('click', () => {
  	   //});
	       
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
				graph.centerZoom = true;
				graph.setTooltips(true);
				graph.setEnabled(false);
				graph.htmlLabels = true;

				// Changes the default style for edges "in-place"
				//var style = graph.getStylesheet().getDefaultEdgeStyle();
				//style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
				
				// Enables panning with left mouse button
				graph.panningHandler.useLeftButtonForPanning = true;
				graph.panningHandler.ignoreCell = true;
				graph.container.style.cursor = 'move';
				//graph.setPanning(false);
				
				// Do not allow removing labels from parents
				graph.graphHandler.removeCellsFromParent = false;
				
				graph.resizeContainer = true;
				decoder.decode(node, graph.getModel());
				//graph.resizeContainer = false;
				
				//request new height for the block
				var height = container.offsetHeight + 20;
				//If the width is larger than the available width we need to zoom in by the required
				//factor and then request the height to the blockApi service
				
				if(!mxNitokuDevFlag){
					window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
						   							+ height + "'}","https://www.nitoku.com");
				}else{
					window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
   							+ height + "'}","*");
				}
				
				// Adds zoom buttons in top, left corner
				var buttons = document.createElement('div');
				buttons.classList.add("blockZoomButtonsWrapper");
				
				var editButtons = document.createElement('div');
				editButtons.classList.add("blockEditButtonsWrapper");
				
				//var bs = graph.getBorderSizes();
				//buttons.style.top = (container.offsetTop + bs.y) + 'px';
				//buttons.style.left = (container.offsetLeft + bs.x) + 'px';
				
				var left = 0;
				var bw = 30;
				var bh = 30;
				
				if (mxClient.IS_QUIRKS)
				{
					bw -= 1;
					bh -= 1;
				}
				
				function addButton(label, funct, iconClass)
				{
//					var btn = document.createElement('div');
//					mxUtils.write(btn, label);
//					
//					btn.classList.add("blockZoomButtons");
//					
//					btn.style.width = bw + 'px';
//					btn.style.height = bh + 'px';
//					
//					mxEvent.addListener(btn, 'click', function(evt)
//					{
//						funct();
//						mxEvent.consume(evt);
//					});
//					
//					left += bw;
//					
//					buttons.appendChild(btn);
					
					var btn = document.createElement('div');
					
					btn.classList.add("blockZoomButtons");
					
					mxEvent.addListener(btn, 'click', function(evt)
					{
						funct();
						mxEvent.consume(evt);
					});
					
					var btnIcon = document.createElement('div');
					btnIcon.classList.add("nitoku-icon");
					btnIcon.classList.add("fa");
					btnIcon.classList.add(iconClass);
					btn.appendChild(btnIcon);

					var labelText = document.createElement('div');
					labelText.classList.add("icon-label");
					labelText.innerHTML = label;
					btn.appendChild(labelText);

					buttons.appendChild(btn);
					
				};
				
				function addEditButton(funct)
				{
					
					var btn = document.createElement('div');
										
					btn.classList.add("blockEditButtons");
					
					mxEvent.addListener(btn, 'click', function(evt)
					{
						funct();
						mxEvent.consume(evt);
					});
					
					var btnIcon = document.createElement('div');
					btnIcon.classList.add("nitoku-icon");
					btnIcon.classList.add("fa");
					btnIcon.classList.add("fa-desktop");
					btn.appendChild(btnIcon);

					var labelText = document.createElement('div');
					labelText.classList.add("icon-label");
					labelText.innerHTML = "Edit block data";
					btn.appendChild(labelText);

					editButtons.appendChild(btn);
					
				};
				
				addButton('Zoom in', function()
				{
					
					graph.zoomIn();
					var height = container.offsetHeight + 20;
					if(!mxNitokuDevFlag){
						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
   							+ height + "'}","https://www.nitoku.com");
					}else{
						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
	   							+ height + "'}","*");
					}
					
				}, "fa-search-plus");
				
				addButton('Zoom out', function()
				{
					
					graph.zoomOut();
					var height = container.offsetHeight + 20;
					if(!mxNitokuDevFlag){
						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
   							+ height + "'}","https://www.nitoku.com");
					}else{
						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
	   							+ height + "'}","*");
					}
					
				}, "fa-search-minus");

				addEditButton(function()
				{
			    	if (screenfull.enabled) {
			    		if(!screenfull.isFullscreen){
							mxNitokuIntegration.initEditor();
							screenfull.request();
						}
					}
			    	
				});

				 
				container.parentNode.appendChild(buttons);
				container.parentNode.appendChild(editButtons);
				
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
