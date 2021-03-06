var mxNitokuEditorUi;
var mxNitokuAppWindowInnerWidth;
var mxNitokuReadOnly;
var graph;
var originalContainerWidth = 0;

var mxGraphNitokuIntegration = {
	
	init: function()
	{

      //capture click on links
 	  //find first parent with tagName [tagname]
 	  function findParent(tagname,el){
 		  while (el){
 		    if ((el.nodeName || el.tagName).toLowerCase()===tagname.toLowerCase()){
 		      return el;
 		    }
 		    el = el.parentNode;
 		  }
 		  return null;
 	  }
 	  
	  document.body.onclick = function(e){
		   e = e || event;
		   var link = findParent('a',e.target || e.srcElement);
		   if (link){
			  var postMsg = {};
			  postMsg.channel = '@nitoku.public/blockApi';
			  postMsg.version = '1.0';
			  postMsg.service = 'open-link';
			  postMsg.message = { 'href' : link.href };
			  window.parent.postMessage(postMsg,"https://www.nitoku.com");   
			  return false;
		   }
	   }
	   
	   mxNitokuAppWindowInnerWidth = document.body.offsetWidth;
	   
	   
	   var postMsg = {};
       postMsg.channel = '@nitoku.public/blockApi';
       postMsg.version = '1.0';
       postMsg.service = 'get-inner-width';
       parent.postMessage( postMsg, "https://www.nitoku.com" );

       var postMsg = {};
       postMsg.channel = '@nitoku.public/blockApi';
       postMsg.version = '1.0';
       postMsg.service = 'get-data';
       parent.postMessage( postMsg, "https://www.nitoku.com" );

	   // Default resources are included in grapheditor resources
	   mxLoadResources = false;block A
	
	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered. The function will be called after it stops being called for
	// N milliseconds. If `immediate` is passed, trigger the function on the
	// leading edge, instead of the trailing.
	   function debounce(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
	  };
	  
	  var debouncedZoomToFitFn = debounce(function() {
	       
		  var postMsg = {};
	      postMsg.channel = '@nitoku.public/blockApi';
	      postMsg.version = '1.0';
	      postMsg.service = 'get-inner-width';
	      parent.postMessage( postMsg, "https://www.nitoku.com" );
	       
	  }, 200);
	  
	  window.addEventListener('resize', debouncedZoomToFitFn);

	  window.addEventListener('message', function (e) {
	          
		    if (e.origin !== ("https://www.nitoku.com")){
		        console.warn("error on frame origin");
		        return;
		    }
			        
		    if(e.data != null) {
			    
	            if(e.data.channel !== "@nitoku.public/blockApi"){
	      			return;
	    		}
	
		        if(e.data.service === "get-data" || 
		        		e.data.service === "data-update"){
		        	var blockXml = e.data.response.data;
	        		mxGraphNitokuIntegration.initGraph(blockXml);
		        }
		        
		        if(e.data.service === "can-edit-page"){
		        	if(e.data.response.data === "true"){
		        		mxGraphNitokuIntegration.addEditButton();
		        	}
		        }		        

		        if(e.data.service === "get-inner-width"){
		            
		        	// console.log("ipad bug from parent : mxNitokuAppWindowInnerWidth :" + mxNitokuAppWindowInnerWidth);
		        	mxNitokuAppWindowInnerWidth = parseInt(e.data.response.data,10);
		        	
		        	// responses of get-inner-width will trigger a zoom to fit
		        	// this is needed because ios expand the frame beyond 100% width, see below
		        	// https://stackoverflow.com/questions/49749442/workaround-to-ios-11-webkit-iframe-bugs 
		            // https://bugs.webkit.org/show_bug.cgi?id=155198
		        	// therefore we need to get the width to calculate the zoom from nitoku app 
		        	mxGraphNitokuIntegration.zoomToFit(graph);
		        	
		        }
		        
		        if(e.data.service === "set-data" && 
		        		e.data.service === "accepted"){
		        
		  		  var postMsg = {};
			      postMsg.channel = '@nitoku.public/blockApi';
			      postMsg.version = '1.0';
			      postMsg.service = 'get-data';
			      parent.postMessage( postMsg, "https://www.nitoku.com" );

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
		
		}else if(blockXml === ""){
			
			console.log("no graph block data available");
			window.document.body.innerHTML = "<div id='mxgraph'></div>";	 
			
		    var postMsg = {};
		    postMsg.channel = '@nitoku.public/blockApi';
		    postMsg.version = '1.0';
		    postMsg.service = 'can-edit-page';
		    parent.postMessage( postMsg, "https://www.nitoku.com" );
		       
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
				
				/** don't show the text on hover **/
				graph.setTooltips(false);
				/** don't let user grab elements **/
				graph.setEnabled(false);
				/** enable labels **/
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
								
							    if (mxUtils.isNode(cell.value))
								{
							    
							    	//console.log(cell.value);
							    	//var href = cell.getAttribute('href', '');
							    	//if(href != null){
							    	//	console.log('href : ' + href);
							    	//}
							    	
									if (cell.value.nodeName.toLowerCase() == 'userobject')
									{
										//console.log(cell);
										var link = cell.getAttribute('link', '');
										var label = cell.getAttribute('label', '');
										
										var postMsg = {};
									    postMsg.channel = '@nitoku.public/blockApi';
										postMsg.version = '1.0';
										postMsg.service = 'open-link';
										postMsg.message = { 'href' : link };
										window.parent.postMessage(postMsg,"https://www.nitoku.com");   
								
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
				
			    var postMsg = {};
			    postMsg.channel = '@nitoku.public/blockApi';
			    postMsg.version = '1.0';
			    postMsg.service = 'can-edit-page';
			    parent.postMessage( postMsg, "https://www.nitoku.com" );
				
			}

			originalContainerWidth = parseInt(container.style.width, 10);
			
			//If the width is larger than the available width we need to zoom in by the required
			//factor and then request the height to the blockApi service
			//console.log("ipad bug : init function before zoom to fit");
			
			//The reponse to inner width will trigger the execution of the zoomtoFit method
			var postMsg = {};
		    postMsg.channel = '@nitoku.public/blockApi';
			postMsg.version = '1.0';
			postMsg.service = 'get-inner-width';
			window.parent.postMessage(postMsg,"https://www.nitoku.com");   
			
		  }
		
		  
		  
		},
		
		zoomToFit : function(graph)
		{
			//console.log("zoom to fit");
			//console.log("ipad bug : zoom to fit 1");
			
			if(graph === null || graph === undefined){
				//console.log("no graph");
				return;
			}
			
			var container = document.getElementById('mxgraph');
			
			if(container === null){
				//console.log("no container");
				return;
				
			}
			
			var bodyWidth = mxNitokuAppWindowInnerWidth;
			var newContainerWidth = parseInt(container.style.width, 10);
			
			//console.log("ipad bug : bodyWidth : " + bodyWidth);
			//console.log("ipad bug : _containerWidth : " + _containerWidth);
		       
			if(newContainerWidth + 50 > bodyWidth){
				
				graph.zoom((bodyWidth - 50)/(newContainerWidth + 50), false);
				//console.log("shrink ");
				//console.log("ipad bug : shrink : " + bodyWidth/(_containerWidth + 10));
				
			}else if( originalContainerWidth + 50 < bodyWidth){
				
				//console.log("reset ");
				//console.log("ipad bug : reset ");
				graph.zoomActual();

			}else if (newContainerWidth + 50 < bodyWidth ){
				
				graph.zoom((bodyWidth - 50)/(newContainerWidth + 50), false);
				//console.log("grow ");
				//console.log("ipad bug : grow : " + _containerWidth + 10);

				
			}else{

				graph.zoom((bodyWidth - 50)/(newContainerWidth + 50), false);
				//console.log("ipad bug else : do nothing ");
				//console.log("ipad bug else : container width : " + containerWidth);
				//console.log("ipad bug else : body width : " + document.body.offsetWidth);
				//console.log("ipad bug else : _containerWidth : " + _containerWidth);

			}

			var height = this.calculateHeight();
			
			//The reponse to inner width will trigger the execution of the zoomtoFit method
			var postMsg = {};
			postMsg.channel = '@nitoku.public/blockApi';
			postMsg.version = '1.0';
			postMsg.service = 'set-height';
			postMsg.message = { 'height' : height };
			parent.postMessage( postMsg, "https://www.nitoku.com" ); 
			
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
			if(container.offsetHeight + 20 < 100){
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
				var postMsg = {};
				postMsg.channel = '@nitoku.public/blockApi';
				postMsg.version = '1.0';
				postMsg.service = 'show-dialog';
				parent.postMessage( postMsg, "https://www.nitoku.com");
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
