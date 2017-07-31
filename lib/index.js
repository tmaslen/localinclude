var express         = require('express');
var fs              = require( 'fs' );
var curl            = require( 'curlrequest' );
var cheerio         = require( 'cheerio' );
var commandLineArgs = require('command-line-args')

var port = 8000;
var cacheFilePath = '.localincludecache';

var options = getOptions();
var server = express();

function getOptions() {
	var optionDefinitions = [
	  { name: 'url',     type: String },
	  { name: 'dompos',  type: String },
	  { name: 'include', type: String },
	  { name: 'cache',   type: Boolean, defaultOption: false }
	];
	return commandLineArgs( optionDefinitions );
}

function addTheInclude( html ) {
	var $ = cheerio.load( html );
	$( options.dompos ).append( fs.readFileSync( options.include ).toString('utf8') );
	return $.html();
}

function getCachedContent() {
	var cachedHtml = fs.readFileSync( options.include ).toString('utf8');
	if ( cachedHtml ) {
		return addTheInclude( cachedHtml );
	} else {
		return null;
	}
}

function getPageContents( callback ) {

	curl.request( options.url, function ( err, html ) {

		if ( !err ) {

			var response = addTheInclude( html );

		    callback( response );

			fs.writeFile( cacheFilePath, html, function( err ) {
				if ( err ) throw err;
			});

		} else {
			throw new Error( err );
		}

	});

}

server.get('/', function handleRequest( request, response ) {

	var response;

	if ( options.cache ) {

		response = getCachedContent();

	}

	if ( response === null ) {

		getPageContents(function( content ) {

			response.end( content );

		});

	} else {

		response.end( response );

	}

});

server.use( '/', express.static( '.' ) );

server.listen( port, function() {

    console.log( "Server started, go to: http://0.0.0.0:%s", port );

});