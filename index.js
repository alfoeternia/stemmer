/**
 * use of Porter Stemmer in the Cranfield collection.
 * Stopwords are also removed.
 *
 * @author Alexis Fouche
 * @email contact@alexisfouche.net
 * @repository https://github.com/alfoeternia/stemmer
 * @version 1.0.0
 */

"use strict";

var fs 			= require('fs');
var Table 		= require('cli-table');
var stemmer 	= require('porter-stemmer').stemmer;
var stopwords 	= [];

// Read stopwords
fs.readFile('./stopwords.txt', { encoding: 'utf8', flag: 'r' }, function (err, data) {
	if (err) throw err;
	else stopwords = data.split('\n');

	// Read documents
	fs.readFile('./cran.all.1400', { encoding: 'utf8', flag: 'r' }, function (err, data) {
		if (err) throw err;
		else processCollection(data);
	});
});

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

function processDocument(id, lines, idStart, idStop) {

	console.log('================ Document ' + id);

	var terms = [], termOcc = {};

	for(var i = idStart; i < idStop; i++) {
		var line = lines[i].toLowerCase();

		// Split the line in words by selecting only "group of characters"
		// using a regular expression, then filter the returned words
		// by removing those of one character or in the stopwords list
		var words = line.split(/\W+/).filter(function(w) {
			return w.length > 1 && stopwords.indexOf(w) == -1;
		});

		Array.prototype.push.apply(terms, words.map(stemmer));
	}

	// Lexicographical order
	terms.sort();

	// Compute occurences
	for(var i = 0; i < terms.length; i++) termOcc[terms[i]] = (termOcc[terms[i]] == undefined) ? 1 : termOcc[terms[i]] + 1;

	// Compute frequencies
	var result = new Table({ head: ['Term', 'Occurences', 'Frequency'], colWidths: [25, 15, 30] });
	for(var index in termOcc) result.push([ index, termOcc[index], termOcc[index] / Object.keys(termOcc).length]);

	console.log(result.toString());
	console.log('============ End Document ' + id);

}