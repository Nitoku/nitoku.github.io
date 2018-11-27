
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
	     
	   window.document.body.innerHTML = "<div id='mxgraph'></div>";	 
	   var editor = $('#mxgraph');
       const target = editor[0]; // Get DOM element from jQuery
	       
		var container = document.getElementById('mxgraph');
	       
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
				graph.setHtmlLabels(true);
				
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
				graph.panningHandler.useLeftButtonForPanning = true;
				graph.panningHandler.ignoreCell = true;
				graph.container.style.cursor = 'move';
				//graph.setPanning(false);
				
				// Do not allow removing labels from parents
				graph.graphHandler.removeCellsFromParent = false;
				
				graph.resizeContainer = true;
				decoder.decode(node, graph.getModel());
				//graph.resizeContainer = false;
				
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
			
			//request new height for the block
			var height = this.calculateHeight();
			
			//If the width is larger than the available width we need to zoom in by the required
			//factor and then request the height to the blockApi service
			
			if(!mxNitokuDevFlag){
				window.parent.postMessage(
						"{'service':'@nitoku.public/blockApi','request':'get-height:"
					   	+ height + "'}","https://www.nitoku.com");
			}else{
				window.parent.postMessage(
						"{'service':'@nitoku.public/blockApi','request':'get-height:"
							+ height + "'}","*");
			}
			
			mxNitokuIntegration.addEditButton();
			
			
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
