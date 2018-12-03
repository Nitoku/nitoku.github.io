// urlParams is null when used for embedding
window.urlParams = window.urlParams || {};

// Public global variables
window.MAX_REQUEST_SIZE = window.MAX_REQUEST_SIZE  || 10485760;
window.MAX_AREA = window.MAX_AREA || 15000 * 15000;

// URLs for save and export
window.EXPORT_URL = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/export';
window.SAVE_URL = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/save';
window.OPEN_URL = 'http://nitoku.github.io/mxgraph/open';
window.RESOURCES_PATH = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/resources';
window.RESOURCE_BASE = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/resources/grapheditor';
window.STENCIL_PATH = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/stencils';
window.IMAGE_PATH = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/images';
window.STYLE_PATH = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/styles';
window.CSS_PATH = 'https://nitoku.github.io/mxgraph/javascript/grapheditor/www/styles';
window.OPEN_FORM = 'http://nitoku.github.io/mxgraph/open.html';

// Sets the base path, the UI language via URL param and configures the
// supported languages to avoid 404s. The loading of all core language
// resources is disabled as all required resources are in grapheditor.
// properties. Note that in this example the loading of two resource
// files (the special bundle and the default bundle) is disabled to
// save a GET request. This requires that all resources be present in
// each properties file since only one file is loaded.
window.mxBasePath = window.mxBasePath || 'https://nitoku.github.io/mxgraph/src';
window.mxLanguage = window.mxLanguage || urlParams['lang'];
window.mxLanguages = window.mxLanguages || ['en'];
