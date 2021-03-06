
//var mxNitokuIntegrationXml = ""; 
//var mxNitokuIntegrationTmpXml = "";

var mxNitokuEditorUi;
var mxNitokuReadOnly;
var graph;


var mxEditorNitokuIntegration = {
	
	init: function()
	{

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
	   mxLoadResources = false;

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

		        	mxEditorNitokuIntegration.initEditor(blockXml);      		
		        	
		        }

		        if(e.data.service === "close-dialog-event"){
		        
		        	var readOnlyFlag;
		    		var xmlDocumentOriginal = 
		    						mxUtils.parseXml(mxNitokuEditorUi.editor.originalBlockXml);
		    		var xmlMxGraphModelOriginal = 
		    						xmlDocumentOriginal.getElementsByTagName('mxGraphModel');
		    		
		    		if(xmlMxGraphModelOriginal != null){
		    			readOnlyFlagOriginal = 
		    						xmlMxGraphModelOriginal[0].getAttribute('readOnly');
		    		}

		    		var xml = mxNitokuEditorUi.editor.getGraphXml();
		    		mxNitokuEditorUi.editor.modified = false;
		    		
		    		var newXmlData = mxUtils.getPrettyXml(xml);
		    		var xmlDocument = mxUtils.parseXml(newXmlData);
		    		var xmlMxGraphModel = xmlDocument.getElementsByTagName('mxGraphModel');
		    		if(xmlMxGraphModel != undefined && xmlMxGraphModel != null){
		    			xmlMxGraphModel[0].setAttribute("readOnly", readOnlyFlagOriginal);
		    			newXmlData = mxUtils.getPrettyXml(xmlMxGraphModel[0]);
		    		}
		    		
		    		if(mxNitokuEditorUi.editor.originalBlockXml.trim()
		    				.localeCompare(newXmlData.trim()) === 0){

		    			console.log("same text, not saving editor's data");
		    			
	    		        var postMsg = {};
	    		        postMsg.channel = '@nitoku.public/blockApi';
		    		    postMsg.version = '1.0';
		    		    postMsg.service = 'close-dialog';
		    		    parent.postMessage( postMsg, "https://www.nitoku.com" );
		    			
		    			return null;
		       
		    		}
		    		
		    		var postMsg = {};
		    		postMsg.channel = '@nitoku.public/blockApi';
		    		postMsg.version = '1.0';
		    		postMsg.service = 'save-and-close-dialog';
		    		postMsg.message = { 'data' : newXmlData };
		    		parent.postMessage( postMsg, "https://www.nitoku.com" ); 
		    		
		        }
		        
		  	}
		          
		});

	},

	/**
	 * returns null if we have no changes
	 */
	initEditor : function(blockXml)
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
			
			var doc = mxUtils.parseXml(blockXml);
			mxNitokuEditorUi.editor.originalBlockXml = blockXml; 
			
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
			
		}	
};
