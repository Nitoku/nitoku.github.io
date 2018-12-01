
var mxNitokuIntegrationXml = ""; 
var mxNitokuIntegrationTmpXml = "";

var mxNitokuEditorUi;
var mxNitokuDevFlag = true;
var mxNitokuAppWindowInnerWidth;
var graph;
var containerWidth = 0;

var mxNitokuIntegration = {
	
	init: function()
	{
	
	   mxNitokuAppWindowInnerWidth = document.body.offsetWidth;
	   //window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
	   //		   												+ 400 + "'}","https://www.nitoku.com");
	   if(!mxNitokuDevFlag){
		   window.parent.postMessage(
				   			"{'service':'@nitoku.public/blockApi','request':'allow-same-origin'}",
			 				"https://www.nitoku.com");
	   }else{
		   window.parent.postMessage(
				   "{'service':'@nitoku.public/blockApi','request':'allow-same-origin'}",
			 		"*");
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
		  		
		  		if(jdata.response.id === "allow-same-origin" && jdata.response.data === "same-origin-allowed"){
		  			mxNitokuIntegration.initWithOrigin();
		  			return;
		  		}
		  		
		        if(jdata.service !== "@nitoku.public/blockApi"){
		          	return;
		        }
	
		        if(jdata.response.id === "get-data" || 
		        		jdata.response.id === "data-update"){
		            
		        	mxNitokuIntegrationXml = jdata.response.data;
		        	mxNitokuIntegration.initGraph();
		        	
		        }

		        if(jdata.response.id === "get-inner-width"){
		            
		        	mxNitokuAppWindowInnerWidth = jdata.response.data;
		        	
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

	initWithOrigin: function() {
		
	   if(!mxNitokuDevFlag){
		   window.parent.postMessage(
				   			"{'service':'@nitoku.public/blockApi','request':'get-inner-width'}",
			 				"https://www.nitoku.com");
		   
		   window.parent.postMessage(
				   			"{'service':'@nitoku.public/blockApi','request':'get-data'}",
    		   				"https://www.nitoku.com");

	   }else{
		   window.parent.postMessage(
				   "{'service':'@nitoku.public/blockApi','request':'get-inner-width'}",
			 		"*");
		   window.parent.postMessage(
				   "{'service':'@nitoku.public/blockApi','request':'get-data'}",
				 	"*");

	   }
	   
	   // Default resources are included in grapheditor resources
	   mxLoadResources = false;

	   if (screenfull.enabled) {
		   
			screenfull.on('change', () => {
				
				if(!screenfull.isFullscreen){
					
					//mxNitokuIntegrationTmpXml = 
					//		mxNitokuEditorUi.editor.getGraphXml().outerHTML;
					mxNitokuIntegrationTmpXml = 
						mxUtils.getPrettyXml(mxNitokuEditorUi.editor.getGraphXml());
					
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
	   
	   const debounce = (func, wait, immediate) => {
		    var timeout;
		    return () => {
		        const context = this, args = arguments;
		        const later = function() {
		            timeout = null;
		            if (!immediate) func.apply(context, args);
		        };
		        const callNow = immediate && !timeout;
		        clearTimeout(timeout);
		        timeout = setTimeout(later, wait);
		        if (callNow) func.apply(context, args);
		    };
	  };
		
	  window.addEventListener('resize', debounce(() => mxNitokuIntegration.zoomToFit(graph),
			  200, false), false);
	      
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
	    
		// Checks if the browser is supported
		if (!mxClient.isBrowserSupported()){
			
			// Displays an error message if the browser is not supported.
			mxUtils.error('Browser is not supported!', 200, false);
			
			return;
			
		}else if(!screenfull.enabled || screenfull.isFullscreen){
			
			return;
		
		}else if(mxNitokuIntegrationXml === ""){
			
			console.log("no graph block data available");
			window.document.body.innerHTML = "<div id='mxgraph'></div>";	 
			
		}else{
			
			window.document.body.innerHTML = "<div id='mxgraph'></div>";
			
			var container = document.getElementById('mxgraph');
			var xmlDocument = mxUtils.parseXml(mxNitokuIntegrationXml);
			
			if (xmlDocument.documentElement != null && 
					xmlDocument.documentElement.nodeName == 'mxGraphModel')
			{
				var decoder = new mxCodec(xmlDocument);
				var node = xmlDocument.documentElement;

				container.innerHTML = '';

				// Enables crisp rendering of rectangles in SVG
				mxConstants.ENTITY_SEGMENT = 20;
				
				graph = new mxGraph(container);
				
				graph.centerZoom = true;
				graph.setTooltips(true);
				graph.setEnabled(false);
				graph.setHtmlLabels(true);
				
				// Overrides method to provide a cell label in the display
				graph.convertValueToString = function(cell)
				{
					if (mxUtils.isNode(cell.value))
					{
						if (cell.value.nodeName.toLowerCase() == 'userobject')
						{
							//console.log(cell);
							var link = cell.getAttribute('link', '');
							var label = cell.getAttribute('label', '');
							
//							//create cell overlay
//							var overlays = graph.getCellOverlays(cell);
//								
//							if (overlays == null)
//							{
//								// Creates a new overlay with an image and a tooltip
//								var overlay = new mxCellOverlay(
//										new mxImage('http://localhost:8080/src/images/point.gif', 16, 16),label);
//								overlay.cursor = "pointer";
//									// Sets the overlay for the cell in the graph
//								graph.addCellOverlay(cell, overlay);
//								
//							}

							//console.log(link);
							if (label != null && label.length > 0 )
							{
								return label;
							}
														
						}
					}

					return cell.value;
					
				};
							
					function updateStyle(state, hover, cell)
					{
						if (hover)
						{

							if(cell != null){
								//console.log(cell);
							    if (mxUtils.isNode(cell.value))
								{
									if (cell.value.nodeName.toLowerCase() == 'userobject')
									{
										graph.container.style.cursor = "pointer";			
									}
								}
							    
							}
							
						}else{
							
							graph.container.style.cursor = "default";
							
						}
						
					};
					
					// Changes fill color to red on mouseover
					graph.addMouseListener(
					{
					    currentState: null,
					    previousStyle: null,
					    mouseDown: function(sender, me)
					    {
					        if (this.currentState != null)
					        {
					        	this.dragLeave(me.getEvent(), this.currentState, me.getCell());
					        	this.currentState = null;
					        }
					    },
					    mouseMove: function(sender, me)
					    {
					        if (this.currentState != null && me.getState() == this.currentState)
					        {
					            return;
					        }

					        var tmp = graph.view.getState(me.getCell());

					        // Ignores everything but vertices
					        if (graph.isMouseDown || (tmp != null && !
					            graph.getModel().isVertex(tmp.cell)))
					        {
					        	tmp = null;
					        }

					        if (tmp != this.currentState)
					        {
					            if (this.currentState != null)
					            {
					                this.dragLeave(me.getEvent(), this.currentState, me.getCell());
					            }

					            this.currentState = tmp;

					            if (this.currentState != null)
					            {
					                this.dragEnter(me.getEvent(), this.currentState, me.getCell());
					            }
					        }
					    },
					    mouseUp: function(sender, me) { 
							var cell = me.getCell(); 
							
							if(cell != null){
								//console.log(cell);
							    if (mxUtils.isNode(cell.value))
								{
									if (cell.value.nodeName.toLowerCase() == 'userobject')
									{
										//console.log(cell);
										var link = cell.getAttribute('link', '');
										var label = cell.getAttribute('label', '');
										
										window.open(link, label);

										//console.log(link);
										//console.log(label);
									}
								}
							}
					    },
					    dragEnter: function(evt, state, cell)
					    {
					        if (state != null)
					        {
					        	updateStyle(state, true, cell);
					        }
					    },
					    dragLeave: function(evt, state, cell)
					    {
					        if (state != null)
					        {
					        	updateStyle(state, false, cell);
					        }
					    }
					});
				
				// Creates the default style for vertices
				style = new Object();
				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_LABEL;
				style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
				style[mxConstants.STYLE_FILLCOLOR] = '#c6e8db';
				style[mxConstants.STYLE_FONTCOLOR] = '#676a6c';
				style[mxConstants.STYLE_STROKECOLOR] = '#1b9866';
				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
				style[mxConstants.STYLE_FONTSIZE] = '12';
				style[mxConstants.STYLE_FONTFAMILY] = 'Helvetica';
				graph.getStylesheet().putDefaultVertexStyle(style);
		
				// Creates the default style for edges
				style = new Object();
				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_CONNECTOR;
				style[mxConstants.STYLE_STROKECOLOR] = '#1b9866';
				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
				//style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
				style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC;
				style[mxConstants.STYLE_FONTSIZE] = '11';
				style[mxConstants.STYLE_FONTFAMILY] = 'Helvetica';
				style[mxConstants.STYLE_FONTCOLOR] = '#676a6c';
				style[mxConstants.STYLE_ROUNDED] = '1';
				graph.getStylesheet().putDefaultEdgeStyle(style);
				
				// Changes the default style for edges "in-place"
				//var style = graph.getStylesheet().getDefaultEdgeStyle();
				//style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
				
				var style = new Object();
				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_STROKECOLOR] = 'none';
				style[mxConstants.STYLE_FILLCOLOR] = 'none';
				style[mxConstants.STYLE_GRADIENTCOLOR] = 'none';
				graph.getStylesheet().putCellStyle('text', style);
				
				var style = new Object();
				style[mxConstants.STYLE_FONTSTYLE] = '1';
				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
				style[mxConstants.STYLE_SPACING_LEFT] = '52';
				style[mxConstants.STYLE_SPACING] = '2';
				style[mxConstants.STYLE_IMAGE_WIDTH] = '42';
				style[mxConstants.STYLE_IMAGE_HEIGHT] = '42';
				style[mxConstants.STYLE_ROUNDED] = '1';
				graph.getStylesheet().putCellStyle('label', style);

				var style = new Object();
				style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
				style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = 'bottom';
				style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#ffffff';	
				style[mxConstants.STYLE_FONTSTYLE] = '0';
				style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
				style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
				style[mxConstants.STYLE_FONTSTYLE] = '1';
				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_SPACING_LEFT] = '0';
				style[mxConstants.STYLE_SPACING_TOP] = '6';
				style[mxConstants.STYLE_SPACING] = '0';
				style[mxConstants.STYLE_IMAGE_WIDTH] = '42';
				style[mxConstants.STYLE_IMAGE_HEIGHT] = '42';
				style[mxConstants.STYLE_ROUNDED] = '1';
				//extends label ends
				graph.getStylesheet().putCellStyle('icon', style);

				var style = new Object();
				style[mxConstants.STYLE_FONTSIZE] = '12';
				style[mxConstants.STYLE_FONTSTYLE] = '1';
				style[mxConstants.STYLE_STARTSIZE] = '23';
				graph.getStylesheet().putCellStyle('swimlane', style);

				var style = new Object();
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_STROKECOLOR] = 'none';
				style[mxConstants.STYLE_FILLCOLOR] = 'none';
				style[mxConstants.STYLE_GRADIENTCOLOR] = 'none';
				style[mxConstants.STYLE_POINTER_EVENTS] = 0;
				graph.getStylesheet().putCellStyle('group', style);

				var style = new Object();
				style[mxConstants.STYLE_SHAPE] = 'ellipse';
				style[mxConstants.STYLE_PERIMETER] = 'ellipsePerimeter';
				graph.getStylesheet().putCellStyle('ellipse', style);
				
				var style = new Object();
				style[mxConstants.STYLE_SHAPE] = 'rhombus';
				style[mxConstants.STYLE_PERIMETER] = 'rhombusPerimeter';
				graph.getStylesheet().putCellStyle('rhombus', style);
				
				var style = new Object();
				style[mxConstants.STYLE_SHAPE] = 'triangle';
				style[mxConstants.STYLE_PERIMETER] = 'trianglePerimeter';
				graph.getStylesheet().putCellStyle('triangle', style);
				
				var style = new Object();
				style[mxConstants.STYLE_SHAPE] = 'line';
				style[mxConstants.STYLE_STROKEWIDTH] = '4';
				style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#ffffff';
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_SPACING_TOP] = '8';
				graph.getStylesheet().putCellStyle('line', style);
			
				//If a generic image style is not added the images will not be displayed.
				var style = new Object();
				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
				style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				graph.getStylesheet().putCellStyle('image', style);
			
				var style = new Object();
				//extends image
				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
				style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_PERIMETER] = 'ellipsePerimeter';
				graph.getStylesheet().putCellStyle('roundImage', style);
				
				var style = new Object();
				//extends image
				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
				style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
				style[mxConstants.STYLE_PERIMETER] = 'rhombusPerimeter';
				graph.getStylesheet().putCellStyle('rhombusImage', style);
				
				var style = new Object();
				style[mxConstants.STYLE_SHAPE] ='arrow';
				style[mxConstants.STYLE_EDGE] = 'none';
				style[mxConstants.STYLE_FILLCOLOR] = '#c6e8db';
				graph.getStylesheet().putCellStyle('arrow', style);
				

				// Enables panning with left mouse button
				graph.panningHandler.useLeftButtonForPanning = false;
				graph.panningHandler.ignoreCell = false;
				//graph.container.style.cursor = 'move';
				//graph.setPanning(false);
				
				// Do not allow removing labels from parents
				graph.graphHandler.removeCellsFromParent = false;
				
				graph.resizeContainer = true;
				decoder.decode(node, graph.getModel());
				
				
				// Adds zoom buttons in top, left corner
//				var buttons = document.createElement('div');
//				buttons.classList.add("blockZoomButtonsWrapper");
				
				
//				function addButton(label, funct, iconClass)
//				{
//
//					var btn = document.createElement('div');
//					
//					btn.classList.add("blockZoomButtons");
//					
//					mxEvent.addListener(btn, 'click', function(evt)
//					{
//						funct();
//						mxEvent.consume(evt);
//					});
//					
//					var btnIcon = document.createElement('div');
//					btnIcon.classList.add("nitoku-icon");
//					btnIcon.classList.add("fa");
//					btnIcon.classList.add(iconClass);
//					btn.appendChild(btnIcon);
//
//					var labelText = document.createElement('div');
//					labelText.classList.add("icon-label");
//					labelText.innerHTML = label;
//					btn.appendChild(labelText);
//
//					buttons.appendChild(btn);
//					
//				};
//				addButton('Zoom in', function()
//				{
//					
//					graph.zoomIn();
//					var height = this.calculateHeight();
//					if(!mxNitokuDevFlag){
//						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
//   							+ height + "'}","https://www.nitoku.com");
//					}else{
//						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
//	   							+ height + "'}","*");
//					}
//					
//				}, "fa-search-plus");
//				
//				addButton('Zoom out', function()
//				{
//					
//					graph.zoomOut();
//					var height = this.calculateHeight();
//					if(!mxNitokuDevFlag){
//						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
//   							+ height + "'}","https://www.nitoku.com");
//					}else{
//						window.parent.postMessage("{'service':'@nitoku.public/blockApi','request':'get-height:"
//	   							+ height + "'}","*");
//					}
//					
//				}, "fa-search-minus");
//				container.parentNode.appendChild(buttons);
				
				
				
			}

			containerWidth = parseInt(container.style.width, 10);
			
			//If the width is larger than the available width we need to zoom in by the required
			//factor and then request the height to the blockApi service
			this.zoomToFit(graph);
			
			//request new height for the block
			
		  }
		  
		  mxNitokuIntegration.addEditButton();
		  
		},
		
		zoomToFit : function(graph)
		{
			//console.log("zoom to fit");
			
			if(graph === null || graph === undefined){
				//console.log("no graph");
				return;
			}
			
			var container = document.getElementById('mxgraph');
			
			if(container === null){
				//console.log("no container");
				return;
				
			}
			
			var bodyWidth = document.body.offsetWidth;
			var _containerWidth = parseInt(container.style.width, 10);
			
			
			if(_containerWidth > bodyWidth + 10){
				
				graph.zoom(bodyWidth/(_containerWidth + 10), false);
				//console.log("shrink ");
				
			}else if(containerWidth < bodyWidth){
				
				//console.log("reset ");
				graph.zoomActual();
				
			}else if (_containerWidth + 10 < bodyWidth ){
				
				graph.zoom(bodyWidth/(_containerWidth + 10), false);
				//console.log("grow ");
				
			}else{

				//console.log("container width : " + containerWidth);
				//console.log("body width : " + document.body.offsetWidth);
				//console.log("_containerWidth : " + _containerWidth);

			}

			var height = this.calculateHeight();
			
			if(!mxNitokuDevFlag){
				window.parent.postMessage(
						"{'service':'@nitoku.public/blockApi','request':'get-height:"
					   	+ height + "'}","https://www.nitoku.com");
			}else{
				window.parent.postMessage(
						"{'service':'@nitoku.public/blockApi','request':'get-height:"
							+ height + "'}","*");
			}
		},
		
		calculateHeight : function()
		{
			var container = document.getElementById('mxgraph');
			var height;
			if(container.offsetHeight < 100){
				height = 100;	
			}else{
				height = container.offsetHeight + 20;
			}
			return height;
			
		},
		
		addEditButton : function() {
			
			//Has to be the number from the app.
			if(!screenfull.enabled || 
					mxNitokuAppWindowInnerWidth < 700){
				return;
			}
			
			var editButtons = document.createElement('div');
			editButtons.classList.add("blockEditButtonsWrapper");

			var btn = document.createElement('div');
			
			btn.classList.add("blockEditButtons");
			
			mxEvent.addListener(btn, 'click', function(evt)
			{
				if (screenfull.enabled) {
			    	if(!screenfull.isFullscreen){
						mxNitokuIntegration.initEditor();
						screenfull.request();
					}
				}
				mxEvent.consume(evt);
				
			});
			
			var btnIcon = document.createElement('div');
			btnIcon.classList.add("nitoku-icon");
			btnIcon.classList.add("fa");
			btnIcon.classList.add("fa-desktop");
			btn.appendChild(btnIcon);

			var labelText = document.createElement('div');
			labelText.classList.add("icon-label");
			labelText.innerHTML = "Edit graph";
			btn.appendChild(labelText);

			editButtons.appendChild(btn);
			
			var container = document.getElementById('mxgraph');
			container.parentNode.appendChild(editButtons);
			
		}
	
};
