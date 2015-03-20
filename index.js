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
var invIndex	= {};

// JSEP configuration
jsep.addUnaryOp("NOT");
jsep.addBinaryOp("AND", 0);
jsep.addBinaryOp("OR", 0);
process.stdin.setEncoding('utf8');

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

	// Sort the inverted index and display it
	invIndex = sortObject(invIndex);
	console.log(util.inspect(sortObject(invIndex), {depth: 10}));
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
	

	// Compute frequencies and display the table
	// NB: Disabled for assignment 2.
	//
	//var result = new Table({ head: ['Term', 'Occurences', 'Frequency'], colWidths: [25, 15, 30] });
	//for(var index in termsOcc) result.push([ index, termsOcc[index], termsOcc[index] / Object.keys(termsOcc).length]);
	//console.log('Number of unique terms: ' + Object.keys(termsOcc).length);
	//console.log(result.toString());
	//console.log('============ End Document ' + id);
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

/*
 * Reads queries
 * NB: For next assignement...

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    processQuery(chunk.toString().trim());
  }
});
function processQuery(query) {
	var parse_tree = jsep(query);
	console.log(util.inspect(parse_tree, {depth: 10, colors: true}));
}*/

/*
 * Sort the properties of an Object.
 * Useful when an Object is used as an associative array (hashmap).
 * Downloaded from: http://stackoverflow.com/a/1359808
 *
 * @param o The object to sort
 */
function sortObject(o) {
    var sorted = {},
    key, a = [];

    for (key in o) {
    	if (o.hasOwnProperty(key)) {
    		a.push(key);
    	}
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
    	sorted[a[key]] = o[a[key]];
    }
    return sorted;
}