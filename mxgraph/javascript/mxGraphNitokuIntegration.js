var mxNitokuEditorUi;
var mxNitokuDevFlag = true;
var mxNitokuAppWindowInnerWidth;
var mxNitokuReadOnly;
var graph;
var containerWidth = 0;

var mxGraphNitokuIntegration = {
	
	init: function()
	{
	   	 
	   mxNitokuAppWindowInnerWidth = document.body.offsetWidth;
	   
	   if(!mxNitokuDevFlag){
	       window.parent.postMessage(
				   "{'service':'@nitoku.public/blockApi','request':'get-inner-width'}","https://www.nitoku.com");
		   window.parent.postMessage(
				   "{'service':'@nitoku.public/blockApi','request':'get-data'}","https://www.nitoku.com");

	   }else{
	       window.parent.postMessage(
				   "{'service':'@nitoku.public/blockApi','request':'get-inner-width'}","*");
		   window.parent.postMessage(
				   "{'service':'@nitoku.public/blockApi','request':'get-data'}","*");

	   }
	   
	   // Default resources are included in grapheditor resources
	   mxLoadResources = false;
	   
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
		
	  window.addEventListener('resize', 
			  					debounce(() => mxGraphNitokuIntegration.zoomToFit(graph),
			  					200, false), false);

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

		        	var blockXml = jdata.response.data;
	        		mxGraphNitokuIntegration.initGraph(blockXml);
		        	
		        }

		        if(jdata.response.id === "get-inner-width"){
		            
		        	mxNitokuAppWindowInnerWidth = jdata.response.data;
		        	
		        }
		        
		        if(jdata.response.id === "set-data" && 
		        		jdata.response.data === "accepted"){
		        
		     	   if(!mxNitokuDevFlag){
		    		   window.parent.postMessage(
		    				   "{'service':'@nitoku.public/blockApi','request':'get-data'}","https://www.nitoku.com");

		    	   }else{
		    		   window.parent.postMessage(
		    				   "{'service':'@nitoku.public/blockApi','request':'get-data'}","*");

		    	   }

		        }

		  	}
		          
		});

	},
	
	initGraph : function(blockXml)
	{
	    
		// Checks if the browser is supported
		if (!mxClient.isBrowserSupported()){
			
			// Displays an error message if the browser is not supported.
			mxUtils.error('Browser is not supported!', 200, false);
			
			return;
			
//		}else if(!screenfull.enabled || screenfull.isFullscreen){
//			
//			return;
		
		}else if(blockXml === ""){
			
			console.log("no graph block data available");
			window.document.body.innerHTML = "<div id='mxgraph'></div>";	 
			
		}else{
			
			window.document.body.innerHTML = "<div id='mxgraph'></div>";
			
			var container = document.getElementById('mxgraph');
			var xmlDocument = mxUtils.parseXml(blockXml);
			
			var xmlMxGraphModel = xmlDocument.getElementsByTagName('mxGraphModel');
			if(xmlMxGraphModel != null){
				mxNitokuReadOnly = xmlMxGraphModel[0].getAttribute('readOnly');
			}
			
			if (xmlDocument.documentElement != null && 
					xmlDocument.documentElement.nodeName == 'mxGraphModel')
			{
				var decoder = new mxCodec(xmlDocument);
				var node = xmlDocument.documentElement;

				container.innerHTML = '';

				// Enables crisp rendering of rectangles in SVG
				mxConstants.ENTITY_SEGMENT = 20;
				
				//mxEvent.disableContextMenu(document.body);
				
				graph = new mxGraph(container);
				
				graph.centerZoom = true;
				graph.setTooltips(true);
				graph.setEnabled(false);
				graph.setHtmlLabels(true);
				//graph.setPanning(true);
				
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
										
										if(link.startsWith("https://www.nitoku.com") || 
											link.startsWith("http://www.nitoku.com") ){
											
											window.parent.postMessage(
												"{'service':'@nitoku.public/blockApi','request':'open-link:"
												+ link + "'}","https://www.nitoku.com");
											
										}else{
											
											window.open(link, label);
											
										}
										
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
				//graph.backgroundImage = "";
				
				//graph.setBackgroundImage(new mxImage('', 40, 40));
				//graph.backgroundImage = null;
				var model = graph.getModel();
				
				graph.gridEnabled = false;
				decoder.decode(node, model);
				graph.container.style.backgroundColor = model.background;
				
			}

			containerWidth = parseInt(container.style.width, 10);
			
			//If the width is larger than the available width we need to zoom in by the required
			//factor and then request the height to the blockApi service
			this.zoomToFit(graph);
			
			//request new height for the block
			
		  }
		
		  if(mxNitokuReadOnly !== "true"){
			  mxGraphNitokuIntegration.addEditButton();
		  }
		  
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
						"{'service':'@nitoku.public/blockApi','request':{'set-height':'"
					   	+ height + "'}}","https://www.nitoku.com");
			}else{
				window.parent.postMessage(
						"{'service':'@nitoku.public/blockApi','request':{'set-height':'"
							+ height + "'}}","*");
			}
		},
		
		calculateHeight : function()
		{
			var container = document.getElementById('mxgraph');
			
			//mxGraph will disable touchAction for 
			//devices that support the Microsoft pointer events. But the problem
			//is that setting touch events to none will disable scrolling on parent page
			//for android devices, 
			//after every redraw set the touch action to auto
			container.style.touchAction = "auto";
			
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
			//if(!screenfull.enabled ||
			if(	mxNitokuAppWindowInnerWidth < 750 ){
				return;
			}
			
			var editButtons = document.createElement('div');
			editButtons.classList.add("blockEditButtonsWrapper");

			var btn = document.createElement('div');
			
			btn.classList.add("blockEditButtons");
			
			mxEvent.addListener(btn, 'click', function(evt)
			{
				//if (screenfull.enabled) {
			    //	if(!screenfull.isFullscreen){
				//		mxNitokuIntegration.initEditor();
				//		screenfull.request();
				//	}
				//}
				window.parent.postMessage(
						"{'service':'@nitoku.public/blockApi','request':'show-dialog:full'}","https://www.nitoku.com");
				
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
