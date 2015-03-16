/**
 * Use of Porter Stemmer in the Cranfield collection.
 * Stopwords are also removed.
 *
 * @author Alexis Fouche
 * @email contact@alexisfouche.net
 * @repository https://github.com/alfoeternia/stemmer
 * @version 1.0.0
 */

"use strict";

var fs          = require('fs');
var util        = require('util');
var Table       = require('cli-table');
var stemmer     = require('porter-stemmer').stemmer;
var jsep        = require("./jsep");
var stopwords   = [];

// JSEP configuration
jsep.addUnaryOp("NOT");
jsep.addBinaryOp("AND", 0);
jsep.addBinaryOp("OR", 0);

// Read stopwords
// from: http://www.ranks.nl/stopwords
fs.readFile('./stopwords.txt', { encoding: 'utf8', flag: 'r' }, function (err, data) {
	if (err) throw err;
	else stopwords = data.split('\n');

	// Read documents
	// from: http://ir.dcs.gla.ac.uk/resources/test_collections/cran/
	fs.readFile('./cran.all.1400', { encoding: 'utf8', flag: 'r' }, function (err, data) {
		if (err) throw err;
		else processCollection(data);
	});
});

// Reads queries
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    processQuery(chunk.toString().trim());
  }
});



function processQuery(query) {
	var parse_tree = jsep(query);
	console.log(util.inspect(parse_tree, {depth: 10, colors: true}));
}


/*
 * Reads the collection file (data) and sends the text of the article
 * to the processDocument() funtion
 *
 * @param data The content of the collection file
 */
function processCollection(data) {
	var lines = data.split('\n');
	var lineIndex = 0;

	// While the entire file has not been processed
	while(lineIndex < lines.length) {

		// Find the document ID
		while(lines[lineIndex].slice(0, 2) != '.I') lineIndex++;
		var id = lines[lineIndex].split(' ')[1];

		// Find the beginning of the text
		while(lines[lineIndex].slice(0, 2) != '.W') lineIndex++;
		var idStart = lineIndex + 1;

		// Find the end of the text
		while(lines[lineIndex] != undefined && lines[lineIndex].slice(0, 2) != '.I') lineIndex++;
		var idStop = lineIndex;

		// Process document
		processDocument(id, lines, idStart, idStop);
	}
}

/*
 * Reads the text of each article from "idStart" to "idStop",
 * then stem each word to a list of terms, and finally
 * calculate the term frequency defined as the following:
 * (# of occurences of a unique term) / (# of terms)
 *
 * @param id The document id
 * @param lines The lines of the collection
 * @param idStart The beginning line of the text for document "id"
 * @param idStop The end line of the text
 */
function processDocument(id, lines, idStart, idStop) {

	//console.log('================ Document ' + id);

	// - terms is an 1-dimension array that contains the stemmed words,
	//   expected the stopwords.
	// - termsOcc is an associative array ({'a': 1, 'b': 2}) that contains
	//   unique terms along with its number of occurences.
	var terms   = []
	var termsOcc = {};

	// Go through every line of the text
	for(var i = idStart; i < idStop; i++) {

		var line = lines[i].toLowerCase();

		// Split the line in words by selecting only "group of characters"
		// using a regular expression, then filter the returned words
		// by removing those of one character or in the stopwords list.
		//
		// The \W notation (uppercase W) means [^A-Za-z0-9_], which is every
		// non-word character that I use for delimiter.
		var words = line.split(/\W+/).filter(function(w) {
			return w.length > 1 && stopwords.indexOf(w) == -1;
		});

		// Push the list of terms of the lines to the list of terms of the text
		Array.prototype.push.apply(terms, words.map(stemmer));
	}

	// Lexicographical order
	terms.sort();

	// Compute occurences
	for(var i = 0; i < terms.length; i++) termsOcc[terms[i]] = (termsOcc[terms[i]] == undefined) ? 1 : termsOcc[terms[i]] + 1;
	//console.log('Number of unique terms: ' + Object.keys(termsOcc).length);

	// Compute frequencies and display the table
	var result = new Table({ head: ['Term', 'Occurences', 'Frequency'], colWidths: [25, 15, 30] });
	for(var index in termsOcc) result.push([ index, termsOcc[index], termsOcc[index] / Object.keys(termsOcc).length]);

	//console.log(result.toString());
	//console.log('============ End Document ' + id);
}

