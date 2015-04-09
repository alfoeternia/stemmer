#!/usr/bin/env node
/*
 * Use of Porter Stemmer in the Cranfield collection
 * to generate a inverted index. Stopwords are removed.
 *
 * @author Alexis Fouche
 * @repository https://github.com/alfoeternia/stemmer
 * @version 1.0.3
 */

"use strict";

var fs          = require('fs');
var util        = require('util');
var program     = require('commander');
var table       = require('cli-table');
var stemmer     = require('porter-stemmer').stemmer;
var tools       = require('./tools');
var stopwords   = [];
var invIndex    = {};
var wDs         = {};

// Configure application
program
  .version('1.0.3')
  .option('-j, --json', 'output JSON instead of a CLI formatted table')
  .option('-s, --sort', 'sort inverted index (default: no)')
  .option('-c, --collection <file>', 'specify a custom collection file')
  .option('-w, --stop-words <file>', 'specify a custom stopwords file')
  .parse(process.argv);

var collectionFile = program.collection || './docs/cran.all.1400';
var stopwordsFile = program.stopWords || './docs/stopwords.txt';


// Read stopwords
// from: http://www.ranks.nl/stopwords
fs.readFile(stopwordsFile, { encoding: 'utf8', flag: 'r' }, function (err, data) {
	if (err) throw err;
	else stopwords = data.split('\n');

	// Read documents
	// from: http://ir.dcs.gla.ac.uk/resources/test_collections/cran/
	fs.readFile(collectionFile, { encoding: 'utf8', flag: 'r' }, function (err, data) {
		if (err) throw err;
		else processCollection(data);
	});
});

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

	// Sort the inverted index if specified
	if(program.sort) invIndex = tools.sortObject(invIndex);

	// Output JSON or dump array
	if(program.json) {
		console.log(JSON.stringify(invIndex));
	}
	else {
		// Use cli-table library to display a formated table
		var result = new table({ head: ['Term', 'Occurences', 'Documents'], colWidths: [25, 15, 50] });
		for(var term in invIndex) result.push([ 
			term,
			invIndex[term][0],
			tools.removeFreqFromDocList(invIndex[term][1])]);

		//console.log(result.toString());
	}

	console.log(JSON.stringify(wDs));
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
	for(var i = 0; i < terms.length; i++)
		termsOcc[terms[i]] = (termsOcc[terms[i]] == undefined) ? 1 : termsOcc[terms[i]] + 1;

	// Add term to inversed index
	for(var index in termsOcc) addTermToInvIndex(index, id, termsOcc[index]);

	var wD = 0;
	for(var index in termsOcc) {
		wD += Math.pow(1 + Math.log(termsOcc[index]), 2);
	}
	wD = Math.sqrt(wD);
	wDs[id] = wD;
}

/*
 * Adds a term to the inversed index
 *
 * @param term The term
 * @param document The document id where the term appears
 * @param freq Number of occurences of the word (optional)
 */
function addTermToInvIndex(term, doc, freq) {

	freq = freq || 1;

	if(invIndex.hasOwnProperty(term)) {
		// Update document frequency
		invIndex[term][0] += freq;

		// Update document id & term frequency
		// NB:  Documents are processed in order, no need to 
		//      insert the docId at the right location
		invIndex[term][1].push([doc, freq]);

		// NB2: We insert all the unique terms of a document, so
		//      there is no need to check if a term already appeared
		//      previously in the same document. However, here is the
		//      code if needed.
		/*for(var i in invIndex[term][1]) {
			if(invIndex[term][1][i][0] == doc) return invIndex[term][1][i][1] += freq;
		}*/

	} else {
		// Term never inserted, we just insert it...
		invIndex[term] = [1, [[doc, freq]]];
	}

}